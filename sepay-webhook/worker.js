/**
 * SePay → Firestore: tự động kích hoạt gói khi khách chuyển khoản.
 * Chạy trên Cloudflare Workers (miễn phí). GitHub Pages là web tĩnh nên cần dịch vụ nhỏ này nhận webhook.
 *
 * Biến môi trường (Settings → Variables and Secrets của Worker):
 *   SEPAY_API_KEY             — khóa bạn đặt trong SePay (Webhook → Kiểu chứng thực "API Key")
 *   FIREBASE_SERVICE_ACCOUNT  — toàn bộ nội dung file JSON tài khoản dịch vụ Firebase
 *   FIRESTORE_DATABASE        — tên database (vd: ai-studio-thieponlnntngthi-7150013d-11a3-4714-ab0b-607155d1b9f3)
 *
 * SePay gửi POST JSON: { id, gateway, transactionDate, accountNumber, content, transferType, transferAmount, referenceCode, ... }
 * Nội dung chuyển khoản chứa mã đơn TOPxxxxxx do web tạo.
 */

const PLAN_DAYS = 365;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'GET') {
      return json({ ok: true, service: 'sepay-webhook', path: url.pathname });
    }
    if (request.method !== 'POST') return json({ success: false, message: 'Method not allowed' }, 405);

    // 1. Xác thực đúng SePay gọi tới
    const auth = request.headers.get('Authorization') || '';
    if (!env.SEPAY_API_KEY || (auth !== `Apikey ${env.SEPAY_API_KEY}` && auth !== env.SEPAY_API_KEY)) {
      return json({ success: false, message: 'Unauthorized' }, 401);
    }

    let tx;
    try {
      tx = await request.json();
    } catch {
      return json({ success: false, message: 'Invalid JSON' }, 400);
    }

    try {
      const result = await handleTransaction(tx, env);
      // SePay coi 200 + success:true là đã nhận (không gửi lại)
      return json({ success: true, ...result });
    } catch (err) {
      console.error('SePay webhook error', err && err.stack ? err.stack : err);
      // Trả 500 để SePay tự gửi lại sau
      return json({ success: false, message: String(err && err.message ? err.message : err) }, 500);
    }
  },
};

async function handleTransaction(tx, env) {
  const amount = Number(tx.transferAmount || tx.amount || 0);
  if ((tx.transferType || 'in') !== 'in' || amount <= 0) return { note: 'Bỏ qua giao dịch không phải tiền vào' };

  const text = `${tx.content || ''} ${tx.description || ''} ${tx.code || ''}`.toUpperCase();
  const m = text.match(/TOP[A-Z0-9]{6}/);
  if (!m) return { note: 'Không có mã đơn TOP trong nội dung' };
  const code = m[0];

  const fs = await firestore(env);

  // 2. Tìm đơn theo mã tham chiếu
  const orders = await fs.query('orders', 'bankReference', code);
  if (!orders.length) return { note: `Không tìm thấy đơn ${code}` };
  const order = orders[0];
  const o = order.data;

  if (o.status === 'paid' || o.status === 'manual_approved') return { note: 'Đơn đã thanh toán trước đó', orderId: order.id };
  if (amount < Number(o.amount || 0)) return { note: `Số tiền ${amount} nhỏ hơn giá gói ${o.amount}`, orderId: order.id };

  const txId = String(tx.id || tx.referenceCode || `${code}-${Date.now()}`);
  const now = new Date().toISOString();
  const expires = new Date(Date.now() + PLAN_DAYS * 86400000).toISOString();

  // 3. Ghi nguyên tử: payment (chống xử lý trùng), order → paid, user → gói mới, thiệp → xuất bản
  const writes = [
    fs.createWrite(`payments/sepay-${txId}`, {
      id: `sepay-${txId}`,
      orderId: order.id,
      transactionId: txId,
      amount,
      content: tx.content || '',
      gateway: `SePay-${tx.gateway || 'bank'}`,
      userId: o.userId || '',
      createdAt: now,
    }),
    fs.updateWrite(`orders/${order.id}`, {
      status: 'paid',
      paidAt: now,
      sepayTransactionId: txId,
      proofNote: `Tự động xác nhận qua SePay (${tx.gateway || 'ngân hàng'} · ${txId})`,
    }),
  ];
  if (o.userId) {
    writes.push(fs.updateWrite(`users/${o.userId}`, { plan: o.planId, planExpiresAt: expires }));
  }
  if (o.invitationId) {
    writes.push(
      fs.updateWrite(`invitations/${o.invitationId}`, {
        status: 'published',
        isPaid: true,
        selectedPlanId: o.planId,
        orderId: order.id,
        publishedAt: now,
        updatedAt: now,
      })
    );
  }

  const ok = await fs.commit(writes);
  if (!ok.committed) return { note: 'Giao dịch đã được xử lý (trùng webhook)', orderId: order.id };
  return { orderId: order.id, plan: o.planId };
}

/* ================= Firestore REST + Service Account ================= */

async function firestore(env) {
  const sa = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  const db = env.FIRESTORE_DATABASE || '(default)';
  const token = await accessToken(sa);
  const root = `projects/${sa.project_id}/databases/${db}`;
  const base = `https://firestore.googleapis.com/v1/${root}`;
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  return {
    async query(collection, field, value) {
      const res = await fetch(`${base}/documents:runQuery`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: collection }],
            where: { fieldFilter: { field: { fieldPath: field }, op: 'EQUAL', value: { stringValue: value } } },
            limit: 1,
          },
        }),
      });
      if (!res.ok) throw new Error(`Firestore query ${res.status}: ${await res.text()}`);
      const rows = await res.json();
      return rows
        .filter((r) => r.document)
        .map((r) => ({ id: r.document.name.split('/').pop(), data: decodeFields(r.document.fields || {}) }));
    },
    createWrite(path, data) {
      return { update: { name: `${root}/documents/${path}`, fields: encodeFields(data) }, currentDocument: { exists: false } };
    },
    updateWrite(path, data) {
      return {
        update: { name: `${root}/documents/${path}`, fields: encodeFields(data) },
        updateMask: { fieldPaths: Object.keys(data) },
      };
    },
    async commit(writes) {
      const res = await fetch(`${base}/documents:commit`, { method: 'POST', headers, body: JSON.stringify({ writes }) });
      if (res.ok) return { committed: true };
      const body = await res.text();
      // payment đã tồn tại → webhook gửi lặp, coi như đã xử lý
      if (res.status === 409 || body.includes('ALREADY_EXISTS')) return { committed: false };
      throw new Error(`Firestore commit ${res.status}: ${body}`);
    },
  };
}

async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claim}`));
  const jwt = `${header}.${claim}.${b64url(sig)}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`Google token ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

function b64url(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  return { mapValue: { fields: encodeFields(v) } };
}
function encodeFields(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = encodeValue(v);
  return out;
}
function decodeValue(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return undefined;
}
function decodeFields(f) {
  const out = {};
  for (const [k, v] of Object.entries(f)) out[k] = decodeValue(v);
  return out;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}
