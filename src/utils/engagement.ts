/**
 * Tương tác khách mời ↔ chủ thiệp:
 *  - Link riêng / QR cho từng khách (invitations/{id}/guests/{guestId})
 *  - Khách xác nhận mừng cưới (invitations/{id}/gifts)
 *  - Thông báo realtime về tài khoản quản lý thiệp (notifications)
 *  - Bản xem trước bí mật của thiệp đang soạn (previews/{key})
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
  onSnapshot,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  WeddingInvitation,
  Guest,
  GiftRecord,
  OwnerNotification,
  NotificationType,
} from '../types/wedding';

const TOKEN_CHARS = 'abcdefghijkmnpqrstuvwxyz23456789';

/** Chuỗi ngẫu nhiên an toàn (không đoán được) dùng cho ID / link riêng. */
export function randomToken(length = 12): string {
  const out: string[] = [];
  const bytes = new Uint8Array(length);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) out.push(TOKEN_CHARS[bytes[i] % TOKEN_CHARS.length]);
  return out.join('');
}

function siteOrigin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'https://thieponl.vn';
}

// ==========================================
// LINK RIÊNG CHO TỪNG KHÁCH
// ==========================================

export function buildGuestLink(inv: Pick<WeddingInvitation, 'slug' | 'id'>, guest: Pick<Guest, 'id'>): string {
  return `${siteOrigin()}/invite/${inv.slug || inv.id}?g=${encodeURIComponent(guest.id)}`;
}

export function buildDemoLink(templateSlug: string): string {
  return `${siteOrigin()}/demo/${templateSlug}`;
}

export function buildPreviewLink(previewKey: string): string {
  return `${siteOrigin()}/preview/${previewKey}`;
}

/** Khách mở link riêng: đọc thông tin khách (chỉ get theo ID bí mật). */
export async function fetchGuestForInvite(invitationId: string, guestId: string): Promise<Guest | null> {
  try {
    const snap = await getDoc(doc(db, 'invitations', invitationId, 'guests', guestId));
    return snap.exists() ? ({ ...(snap.data() as Guest), id: snap.id }) : null;
  } catch (err) {
    console.warn('Không tải được thông tin khách mời:', err);
    return null;
  }
}

/** Ghi nhận khách đã mở thiệp; lần mở đầu tiên gửi thông báo cho chủ thiệp. */
export async function markGuestViewed(inv: WeddingInvitation, guest: Guest): Promise<void> {
  const now = new Date().toISOString();
  const sessionKey = `viewed:${inv.id}:${guest.id}`;
  try {
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(sessionKey)) return;
  } catch {
    /* ignore */
  }
  try {
    await updateDoc(doc(db, 'invitations', inv.id, 'guests', guest.id), {
      lastViewedAt: now,
      viewCount: increment(1),
    });
    try {
      sessionStorage.setItem(sessionKey, '1');
    } catch {
      /* ignore */
    }
    if (!guest.lastViewedAt) {
      await notifyOwner(inv, { type: 'view', guestId: guest.id, guestName: guest.name });
    }
  } catch (err) {
    console.warn('Không ghi nhận được lượt xem của khách:', err);
  }
}

// ==========================================
// QUÀ MỪNG CƯỚI
// ==========================================

export async function submitGift(
  inv: WeddingInvitation,
  payload: { senderName: string; amount?: number; method?: GiftRecord['method']; message?: string },
  guestId?: string
): Promise<GiftRecord> {
  const id = `gift-${Date.now()}-${randomToken(4)}`;
  const gift: GiftRecord = {
    id,
    invitationId: inv.id,
    senderName: payload.senderName.trim() || 'Khách mời',
    method: payload.method || 'bank',
    message: payload.message?.trim() || '',
    createdAt: new Date().toISOString(),
    ...(guestId ? { guestId } : {}),
    ...(payload.amount && payload.amount > 0 ? { amount: Math.round(payload.amount) } : {}),
  };
  await setDoc(doc(db, 'invitations', inv.id, 'gifts', id), gift);
  if (guestId) {
    await updateDoc(doc(db, 'invitations', inv.id, 'guests', guestId), { giftSent: true }).catch(() => {});
  }
  await notifyOwner(inv, {
    type: 'gift',
    guestId,
    guestName: gift.senderName,
    amount: gift.amount,
    message: gift.message,
  });
  return gift;
}

export async function fetchGifts(invitationId: string): Promise<GiftRecord[]> {
  const snap = await getDocs(collection(db, 'invitations', invitationId, 'gifts'));
  const list: GiftRecord[] = [];
  snap.forEach((d) => list.push({ ...(d.data() as GiftRecord), id: d.id }));
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ==========================================
// THÔNG BÁO CHO CHỦ THIỆP
// ==========================================

export async function notifyOwner(
  inv: Pick<WeddingInvitation, 'id' | 'userId' | 'title'>,
  data: {
    type: NotificationType;
    guestName: string;
    guestId?: string;
    message?: string;
    isAttending?: boolean;
    attendeesCount?: number;
    amount?: number;
  }
): Promise<void> {
  if (!inv.userId) return;
  const id = `ntf-${Date.now()}-${randomToken(5)}`;
  const n: Record<string, unknown> = {
    id,
    ownerId: inv.userId,
    invitationId: inv.id,
    invitationTitle: inv.title || '',
    type: data.type,
    guestName: (data.guestName || 'Khách mời').slice(0, 120),
    read: false,
    createdAt: new Date().toISOString(),
  };
  if (data.guestId) n.guestId = data.guestId;
  if (data.message) n.message = data.message.slice(0, 1000);
  if (data.isAttending !== undefined) n.isAttending = data.isAttending;
  if (data.attendeesCount !== undefined) n.attendeesCount = data.attendeesCount;
  if (data.amount !== undefined) n.amount = data.amount;
  try {
    await setDoc(doc(db, 'notifications', id), n);
  } catch (err) {
    // Không chặn thao tác của khách nếu gửi thông báo lỗi
    console.warn('Không gửi được thông báo cho chủ thiệp:', err);
  }
}

/** Lắng nghe realtime thông báo của chủ thiệp (mới nhất trước). */
export function subscribeNotifications(
  ownerId: string,
  onChange: (list: OwnerNotification[]) => void
): () => void {
  const q = query(collection(db, 'notifications'), where('ownerId', '==', ownerId), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const list: OwnerNotification[] = [];
      snap.forEach((d) => list.push({ ...(d.data() as OwnerNotification), id: d.id }));
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      onChange(list);
    },
    (err) => console.warn('Lỗi lắng nghe thông báo:', err)
  );
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const batch = writeBatch(db);
  ids.slice(0, 450).forEach((id) => batch.update(doc(db, 'notifications', id), { read: true }));
  await batch.commit();
}

export function describeNotification(n: OwnerNotification): { title: string; body: string } {
  const who = n.guestName || 'Khách mời';
  switch (n.type) {
    case 'rsvp':
      return {
        title: n.isAttending
          ? `${who} xác nhận tham dự${n.attendeesCount ? ` (${n.attendeesCount} người)` : ''}`
          : `${who} báo vắng mặt`,
        body: n.message || n.invitationTitle || '',
      };
    case 'wish':
      return { title: `${who} gửi lời chúc`, body: n.message || '' };
    case 'gift':
      return {
        title: `${who} đã gửi quà mừng${n.amount ? `: ${new Intl.NumberFormat('vi-VN').format(n.amount)} đ` : ''}`,
        body: n.message || n.invitationTitle || '',
      };
    case 'view':
    default:
      return { title: `${who} đã mở thiệp mời`, body: n.invitationTitle || '' };
  }
}

// ==========================================
// BẢN XEM TRƯỚC BÍ MẬT (QR xem thiệp khi đang soạn)
// ==========================================

/** Lưu ảnh chụp thiệp hiện tại vào previews/{key} để xem trên điện thoại qua QR. */
export async function upsertPreview(inv: WeddingInvitation): Promise<string> {
  const key = inv.previewKey || randomToken(16);
  const snapshot = JSON.parse(JSON.stringify({ ...inv, previewKey: key }));
  await setDoc(doc(db, 'previews', key), {
    ownerId: inv.userId,
    invitationId: inv.id,
    data: snapshot,
    updatedAt: new Date().toISOString(),
  });
  if (!inv.previewKey && inv.id && !inv.id.startsWith('draft-')) {
    await updateDoc(doc(db, 'invitations', inv.id), { previewKey: key }).catch(() => {});
  }
  return key;
}

export async function fetchPreview(key: string): Promise<WeddingInvitation | null> {
  try {
    const snap = await getDoc(doc(db, 'previews', key));
    if (!snap.exists()) return null;
    return snap.data().data as WeddingInvitation;
  } catch (err) {
    console.warn('Không tải được bản xem trước:', err);
    return null;
  }
}
