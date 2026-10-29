/**
 * Giới hạn thiệp miễn phí theo thiết bị & địa chỉ IP.
 *  - Thiết bị: mã ngẫu nhiên lưu trên trình duyệt + dấu vân tay nhẹ (màn hình, múi giờ, ngôn ngữ, GPU).
 *  - IP: lấy mã băm IP (không lưu IP thật) từ Worker Cloudflare.
 * Mỗi mã được "giữ chỗ" 1 lần trong Firestore (freeClaims/{key}); luật Firestore chỉ cho tạo, không sửa/xóa.
 */
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const WORKER = 'https://songhy-sepay.contact-media-vnn.workers.dev';
const LS_KEY = 'thieponl_device_id';

async function sha(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

function gpu(): string {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl') as WebGLRenderingContext | null;
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return ext && gl ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
  } catch {
    return '';
  }
}

export async function deviceKeys(): Promise<string[]> {
  const keys: string[] = [];
  try {
    let id = localStorage.getItem(LS_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(LS_KEY, id);
    }
    keys.push(`dev_${await sha(id)}`);
  } catch {
    /* trình duyệt chặn lưu trữ */
  }
  const fp = [screen.width, screen.height, screen.colorDepth, navigator.hardwareConcurrency, Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language, navigator.platform, gpu()].join('|');
  keys.push(`fp_${await sha(fp)}`);
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(`${WORKER}/ip`, { signal: ctrl.signal });
    clearTimeout(t);
    const j = await r.json();
    if (j.ipHash) keys.push(`ip_${j.ipHash}`);
  } catch {
    /* Worker chưa cập nhật / mạng lỗi → chỉ dùng mã thiết bị */
  }
  return keys;
}

/** Thiết bị/IP này đã dùng lượt miễn phí cho tài khoản khác chưa? */
export async function deviceClaimedByOther(uid: string, keys: string[]): Promise<boolean> {
  for (const k of keys) {
    try {
      const s = await getDoc(doc(db, 'freeClaims', k));
      if (s.exists() && s.data().uid !== uid) return true;
    } catch {
      /* bỏ qua */
    }
  }
  return false;
}

export async function claimDevice(uid: string, invitationId: string, keys: string[]): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all(
    keys.map((k) =>
      setDoc(doc(db, 'freeClaims', k), { uid, invitationId, createdAt: now }).catch(() => {
        /* đã có → giữ nguyên */
      })
    )
  );
}
