import {
  WeddingInvitation,
  WeddingTemplate,
  Guest,
  RSVP,
  Wish,
  User,
  PricingPlan,
  Order,
  AIDesignProposal,
  AdminAction,
} from '../types/wedding';
import { auth, db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
} from 'firebase/firestore';
import { PRICING_PLANS } from '../data/pricing';
import { randomToken, notifyOwner } from './engagement';

const BASE_URL = '';

// Firestore error handler according to AI Studio Firebase Integration Skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(error instanceof Error ? error.message : JSON.stringify(errInfo));
}

export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return normalized === 'contact.media.vnn@gmail.com' || normalized === 'admin@thieponl.vn';
}

// ==========================================
// TEMPLATES (Client / Server fallback)
// ==========================================

export async function fetchTemplates(category?: string, isPremium?: boolean): Promise<WeddingTemplate[]> {
  try {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (isPremium !== undefined) params.append('isPremium', String(isPremium));

    const res = await fetch(`${BASE_URL}/api/templates?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data.templates || [];
    }
  } catch (err) {
    console.warn('Fallback to local templates on network error');
  }
  const { WEDDING_TEMPLATES } = await import('../data/templates');
  let list = [...WEDDING_TEMPLATES];
  if (category && category !== 'all') list = list.filter((t) => t.category === category);
  if (isPremium !== undefined) list = list.filter((t) => t.isPremium === isPremium);
  return list;
}

export async function fetchTemplateBySlug(slug: string): Promise<WeddingTemplate | null> {
  const { WEDDING_TEMPLATES } = await import('../data/templates');
  return WEDDING_TEMPLATES.find((t) => t.slug === slug || t.id === slug) || null;
}

// ==========================================
// USER AUTH & PROFILE (FIRESTORE)
// ==========================================

export async function getCurrentUser(): Promise<User | null> {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;

  const uid = currentUser.uid;
  const userDocRef = doc(db, 'users', uid);

  try {
    const snapshot = await getDoc(userDocRef);
    const now = new Date().toISOString();
    const isAdmin = isAdminUser(currentUser.email);

    if (snapshot.exists()) {
      const data = snapshot.data();
      const userProfile: User = {
        id: uid,
        name: data.displayName || currentUser.displayName || 'Cặp Đôi',
        email: currentUser.email || data.email || '',
        displayName: data.displayName || currentUser.displayName || 'Cặp Đôi',
        photoURL: data.photoURL || currentUser.photoURL || '',
        role: isAdmin ? 'admin' : (data.role || 'user'),
        plan: data.plan || 'free',
        planExpiresAt: data.planExpiresAt || undefined,
        theme: data.theme || undefined,
        createdAt: data.createdAt || now,
        lastLoginAt: now,
        acceptedTermsAt: data.acceptedTermsAt || undefined,
      };

      // Background update lastLoginAt (safely)
      updateDoc(userDocRef, { lastLoginAt: now }).catch(() => {});
      return userProfile;
    } else {
      // Bootstrap new user document
      const newUserData = {
        id: uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Cặp Đôi Mới',
        photoURL: currentUser.photoURL || '',
        plan: 'free',
        planExpiresAt: null,
        role: isAdmin ? 'admin' : 'user',
        theme: 'system',
        createdAt: now,
        lastLoginAt: now,
        acceptedTermsAt: null,
      };
      await setDoc(userDocRef, newUserData);

      return {
        id: uid,
        name: newUserData.displayName,
        email: newUserData.email,
        displayName: newUserData.displayName,
        photoURL: newUserData.photoURL,
        role: newUserData.role as any,
        plan: 'free',
        planExpiresAt: undefined,
        theme: 'system',
        createdAt: now,
        lastLoginAt: now,
        acceptedTermsAt: undefined,
      };
    }
  } catch (error) {
    console.warn('Firestore user profile fetch encountered error, falling back to auth session:', error);
    const now = new Date().toISOString();
    const isAdmin = isAdminUser(currentUser.email);
    return {
      id: uid,
      name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Cặp Đôi',
      email: currentUser.email || '',
      displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Cặp Đôi',
      photoURL: currentUser.photoURL || '',
      role: isAdmin ? 'admin' : 'user',
      plan: 'free',
      planExpiresAt: undefined,
      theme: 'system',
      createdAt: now,
      lastLoginAt: now,
    };
  }
}

export async function updateUserTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  try {
    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, { theme });
  } catch (err) {
    console.warn('Failed to persist user theme to Firestore:', err);
  }
}

export async function acceptTerms(): Promise<{ success: boolean; acceptedTermsAt: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Chưa đăng nhập');

  const now = new Date().toISOString();
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), { acceptedTermsAt: now });
    return { success: true, acceptedTermsAt: now };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
  }
}

// ==========================================
// INVITATIONS (FIRESTORE)
// ==========================================

export async function fetchInvitations(userId?: string): Promise<WeddingInvitation[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const targetUid = userId || currentUser.uid;
  const invCol = collection(db, 'invitations');

  try {
    const q = query(invCol, where('userId', '==', targetUid));
    const snapshot = await getDocs(q);
    const invitations: WeddingInvitation[] = [];
    snapshot.forEach((d) => {
      invitations.push({ ...(d.data() as WeddingInvitation), id: d.id });
    });

    invitations.sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    );
    return invitations;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'invitations');
  }
}

export async function fetchInvitationBySlug(slug: string): Promise<WeddingInvitation | null> {
  const invCol = collection(db, 'invitations');
  const toInv = (d: any): WeddingInvitation => ({ ...(d.data() as WeddingInvitation), id: d.id });

  // 1. Thiệp đã xuất bản (khách chưa đăng nhập chỉ được truy vấn kèm điều kiện status)
  try {
    const snap = await getDocs(query(invCol, where('slug', '==', slug), where('status', '==', 'published'), limit(1)));
    if (!snap.empty) return toInv(snap.docs[0]);
  } catch (err) {
    console.warn('Không truy vấn được thiệp đã xuất bản:', err);
  }

  // 2. Chủ thiệp đang đăng nhập: xem cả bản nháp của mình
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const snap = await getDocs(query(invCol, where('slug', '==', slug), where('userId', '==', uid), limit(1)));
      if (!snap.empty) return toInv(snap.docs[0]);
    } catch (err) {
      console.warn('Không truy vấn được thiệp của chủ:', err);
    }
  }

  // 3. Dự phòng: mở theo ID thiệp
  try {
    const directDoc = await getDoc(doc(db, 'invitations', slug));
    if (directDoc.exists()) return toInv(directDoc);
  } catch {
    /* không có quyền hoặc không tồn tại */
  }
  return null;
}

export async function fetchInvitationById(id: string): Promise<WeddingInvitation | null> {
  try {
    const d = await getDoc(doc(db, 'invitations', id));
    if (d.exists()) {
      return { ...(d.data() as WeddingInvitation), id: d.id };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `invitations/${id}`);
  }
}

export async function createInvitation(payload: Partial<WeddingInvitation>): Promise<WeddingInvitation> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Vui lòng đăng nhập để tạo thiệp cưới.');

  const newId = `inv-${randomToken(14)}`;
  const now = new Date().toISOString();

  // Generate URL slug
  const rawBride = (payload.brideName ?? '').trim();
  const rawGroom = (payload.groomName ?? '').trim();
  const baseSlug =
    rawBride || rawGroom
      ? `${rawBride}-${rawGroom}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
      : 'thiep-cuoi';
  const uniqueSuffix = Math.random().toString(36).substring(2, 6);
  const slug = payload.slug || `${baseSlug || 'thiep'}-${uniqueSuffix}`;

  const newInvitation: WeddingInvitation = {
    id: newId,
    slug,
    userId: currentUser.uid,
    title:
      payload.title !== undefined
        ? payload.title
        : rawBride && rawGroom
        ? `Hôn Lễ ${rawBride} & ${rawGroom}`
        : 'Thiệp Cưới',
    status: payload.status || 'draft',
    templateId: payload.templateId || 'tpl-pastel-01',
    ...(payload.eventType && payload.eventType !== 'wedding' ? { eventType: payload.eventType } : {}),
    brideName: payload.brideName ?? '',
    groomName: payload.groomName ?? '',
    brideTitle: payload.brideTitle ?? 'Cô Dâu',
    groomTitle: payload.groomTitle ?? 'Chú Rể',
    brideParents: payload.brideParents ?? { father: '', mother: '' },
    groomParents: payload.groomParents ?? { father: '', mother: '' },
    weddingDate: payload.weddingDate ?? '',
    weddingTime: payload.weddingTime ?? '11:00',
    lunarDate: payload.lunarDate ?? '',
    venueName: payload.venueName ?? '',
    venueAddress: payload.venueAddress ?? '',
    mapUrl: payload.mapUrl ?? '',
    invitationMessage: payload.invitationMessage ?? 'Kính mời quý khách tới chung vui cùng gia đình chúng tôi.',
    thankYouMessage: payload.thankYouMessage ?? 'Sự hiện diện của quý vị là niềm vinh hạnh to lớn cho gia đình.',
    coverImage: payload.coverImage ?? 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    galleryImages: payload.galleryImages ?? [
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
    ],
    musicUrl: payload.musicUrl ?? 'https://assets.mixkit.co/music/preview/mixkit-wedding-waltz-298.mp3',
    design: payload.design ?? {
      fontHeading: 'Playfair Display, Georgia, serif',
      fontBody: 'Plus Jakarta Sans, sans-serif',
      palette: {
        primary: '#C76A82',
        secondary: '#E8B7C8',
        background: '#FFFBF7',
        surface: '#FDF2F4',
        text: '#453C45',
        accent: '#C76A82',
      },
      ornamentStyle: 'botanical',
      envelopeColor: '#E8B7C8',
      envelopeLiningColor: '#FFFBF7',
      sealColor: '#C76A82',
      heroLayout: 'centered',
    },
    sectionsVisibility: payload.sectionsVisibility ?? {
      cover: true,
      countdown: true,
      parents: true,
      eventInfo: true,
      loveStory: true,
      timeline: true,
      gallery: true,
      rsvp: true,
      wishes: true,
      giftBox: true,
      map: true,
    },
    loveStories: payload.loveStories ?? [
      {
        id: 'story-1',
        yearOrDate: '',
        title: 'Lần Đầu Gặp Gỡ',
        description: 'Những ánh mắt đầu tiên trao nhau và bắt đầu một hành trình yêu thương.',
      },
      {
        id: 'story-2',
        yearOrDate: '',
        title: 'Lời Hứa Nguyện Ước',
        description: 'Khoảnh khắc trao chiếc nhẫn ước định ngày về chung một mái nhà.',
      },
    ],
    timelineEvents: payload.timelineEvents ?? [
      { id: 'time-1', time: '10:30', title: 'Đón Khách', description: 'Đón tiếp quý khách và chụp hình lưu niệm.' },
      { id: 'time-2', time: '11:30', title: 'Làm Lễ', description: 'Nghi thức trao nhẫn và cắt bánh cưới.' },
      { id: 'time-3', time: '12:00', title: 'Khai Tiệc', description: 'Bữa tiệc mừng hạnh phúc cùng gia đình hai bên.' },
    ],
    giftBank: payload.giftBank ?? {
      // Để trống: mỗi cặp đôi tự nhập tài khoản nhận quà của mình
      enabled: false,
      bankName: '',
      accountNumber: '',
      accountHolder: '',
      note: 'Mừng cưới',
    },
    viewsCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'invitations', newId), newInvitation);
    return newInvitation;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `invitations/${newId}`);
  }
}

export async function updateInvitation(id: string, payload: Partial<WeddingInvitation>): Promise<WeddingInvitation> {
  const now = new Date().toISOString();
  const updateData = {
    ...payload,
    updatedAt: now,
  };
  delete (updateData as any).id;
  delete (updateData as any).userId;

  try {
    const invRef = doc(db, 'invitations', id);
    await updateDoc(invRef, updateData);
    const fresh = await getDoc(invRef);
    return { ...(fresh.data() as WeddingInvitation), id: fresh.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `invitations/${id}`);
  }
}

export async function deleteInvitation(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'invitations', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `invitations/${id}`);
  }
}

export async function togglePublishInvitation(
  id: string
): Promise<{ status: 'draft' | 'published'; invitation: WeddingInvitation }> {
  try {
    const invRef = doc(db, 'invitations', id);
    const currentSnap = await getDoc(invRef);
    if (!currentSnap.exists()) throw new Error('Không tìm thấy thiệp cưới');

    const current = currentSnap.data() as WeddingInvitation;
    const nextStatus = current.status === 'published' ? 'draft' : 'published';
    if (nextStatus === 'published') {
      // Xuất bản luôn đi qua kiểm tra gói / lượt miễn phí
      const published = await publishInvitation(id);
      return { status: 'published', invitation: published };
    }
    await updateDoc(invRef, { status: nextStatus, updatedAt: new Date().toISOString() });

    const fresh = await getDoc(invRef);
    const updated = { ...(fresh.data() as WeddingInvitation), id: fresh.id };
    return { status: nextStatus, invitation: updated };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `invitations/${id}`);
  }
}

// ==========================================
// GUESTS (SUBCOLLECTION: invitations/{id}/guests)
// ==========================================

export async function fetchGuests(invitationId: string): Promise<Guest[]> {
  try {
    const colRef = collection(db, 'invitations', invitationId, 'guests');
    const snapshot = await getDocs(colRef);
    const guests: Guest[] = [];
    snapshot.forEach((d) => guests.push({ ...(d.data() as Guest), id: d.id }));
    return guests;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `invitations/${invitationId}/guests`);
  }
}

export async function createGuest(invitationId: string, payload: Partial<Guest>): Promise<Guest> {
  // ID khách = token bí mật dùng trong link riêng (?g=...), không đoán được
  const token = randomToken(12);
  const newId = `g${token}`;
  const now = new Date().toISOString();

  const newGuest: Guest = {
    id: newId,
    invitationId,
    name: payload.name || 'Khách Mời',
    group: payload.group || 'other',
    phone: payload.phone || '',
    email: payload.email || '',
    personalToken: token,
    rsvpStatus: 'pending',
    attendeesCount: payload.attendeesCount || 1,
    note: payload.note || '',
    createdAt: now,
  };

  try {
    await setDoc(doc(db, 'invitations', invitationId, 'guests', newId), newGuest);
    return newGuest;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `invitations/${invitationId}/guests/${newId}`);
  }
}

export async function updateGuest(
  invitationId: string,
  guestId: string,
  payload: Partial<Guest>
): Promise<Guest> {
  try {
    const gRef = doc(db, 'invitations', invitationId, 'guests', guestId);
    await updateDoc(gRef, payload);
    const fresh = await getDoc(gRef);
    return { ...(fresh.data() as Guest), id: fresh.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `invitations/${invitationId}/guests/${guestId}`);
  }
}

export async function deleteGuest(invitationId: string, guestId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'invitations', invitationId, 'guests', guestId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `invitations/${invitationId}/guests/${guestId}`);
  }
}

// ==========================================
// RSVP & WISHES
// ==========================================

export async function submitRsvp(
  slugOrId: string,
  payload: Partial<RSVP>,
  guestId?: string
): Promise<RSVP> {
  // First resolve invitation ID if passed slug
  let invId = slugOrId;
  const inv = await fetchInvitationBySlug(slugOrId);
  if (inv) invId = inv.id;

  const newId = `rsvp-${Date.now()}`;
  const newRsvp: RSVP = {
    id: newId,
    invitationId: invId,
    guestName: payload.guestName || 'Khách Mời',
    phone: payload.phone || '',
    isAttending: payload.isAttending ?? true,
    attendeesCount: payload.attendeesCount || 1,
    side: payload.side || 'mutual',
    dietaryNote: payload.dietaryNote || '',
    message: payload.message || '',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'invitations', invId, 'rsvps', newId), { ...newRsvp, ...(guestId ? { guestId } : {}) });

    // Cập nhật trạng thái khách mời có link riêng
    if (guestId) {
      await updateDoc(doc(db, 'invitations', invId, 'guests', guestId), {
        rsvpStatus: newRsvp.isAttending ? 'attending' : 'declined',
        attendeesCount: newRsvp.isAttending ? newRsvp.attendeesCount : 0,
        respondedAt: newRsvp.createdAt,
      }).catch((e) => console.warn('Không cập nhật được trạng thái khách:', e));
    }

    // Lời chúc kèm RSVP được lưu vào sổ lưu bút
    if (newRsvp.message?.trim()) {
      const wishId = `wish-${Date.now()}`;
      await setDoc(doc(db, 'invitations', invId, 'wishes', wishId), {
        id: wishId,
        invitationId: invId,
        senderName: newRsvp.guestName,
        senderRelation: newRsvp.side === 'groom' ? 'Khách nhà trai' : newRsvp.side === 'bride' ? 'Khách nhà gái' : 'Bạn bè',
        message: newRsvp.message,
        isApproved: true,
        createdAt: newRsvp.createdAt,
      }).catch(() => {});
    }

    if (inv) {
      await notifyOwner(inv, {
        type: 'rsvp',
        guestId,
        guestName: newRsvp.guestName,
        isAttending: newRsvp.isAttending,
        attendeesCount: newRsvp.attendeesCount,
        message: newRsvp.message,
      });
    }
    return newRsvp;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `invitations/${invId}/rsvps/${newId}`);
  }
}

export async function fetchRsvps(invitationId: string): Promise<RSVP[]> {
  try {
    const colRef = collection(db, 'invitations', invitationId, 'rsvps');
    const snapshot = await getDocs(colRef);
    const rsvps: RSVP[] = [];
    snapshot.forEach((d) => rsvps.push({ ...(d.data() as RSVP), id: d.id }));
    return rsvps;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `invitations/${invitationId}/rsvps`);
  }
}

export async function fetchWishes(slugOrId: string): Promise<Wish[]> {
  let invId = slugOrId;
  const inv = await fetchInvitationBySlug(slugOrId);
  if (inv) invId = inv.id;

  try {
    const colRef = collection(db, 'invitations', invId, 'wishes');
    let snapshot;
    try {
      // Chủ thiệp: đọc tất cả lời chúc
      snapshot = await getDocs(colRef);
    } catch {
      // Khách: chỉ được đọc lời chúc đã duyệt
      snapshot = await getDocs(query(colRef, where('isApproved', '==', true)));
    }
    const wishes: Wish[] = [];
    snapshot.forEach((d) => wishes.push({ ...(d.data() as Wish), id: d.id }));
    wishes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return wishes;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, `invitations/${invId}/wishes`);
  }
}

export async function submitWish(
  slugOrId: string,
  payload: { senderName: string; senderRelation: string; message: string; signature?: string },
  guestId?: string
): Promise<Wish> {
  let invId = slugOrId;
  const inv = await fetchInvitationBySlug(slugOrId);
  if (inv) invId = inv.id;

  const newId = `wish-${Date.now()}`;
  const newWish: Wish = {
    id: newId,
    invitationId: invId,
    senderName: payload.senderName || 'Bạn bè',
    senderRelation: payload.senderRelation || 'Bạn bè',
    message: payload.message || '',
    isApproved: true,
    createdAt: new Date().toISOString(),
    ...(payload.signature && payload.signature.length < 300000 ? { signature: payload.signature } : {}),
    ...(guestId ? { guestId } : {}),
  };

  try {
    await setDoc(doc(db, 'invitations', invId, 'wishes', newId), newWish);
    if (inv) {
      await notifyOwner(inv, {
        type: 'wish',
        guestId,
        guestName: newWish.senderName,
        message: newWish.message,
      });
    }
    return newWish;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `invitations/${invId}/wishes/${newId}`);
  }
}

// ==========================================
// AI DESIGN & PRICING
// ==========================================

export async function generateAIDesign(payload: {
  brideName: string;
  groomName: string;
  stylePreference: string;
  tone?: string;
  notes?: string;
}, variation = 0): Promise<{ isAIGenerated: boolean; proposals: AIDesignProposal[] }> {
  const { generateLocalProposals } = await import('./smartDesigner');
  const local = generateLocalProposals(payload, variation);
  // Trên GitHub Pages không có máy chủ /api → dùng trợ lý thiết kế chạy trên trình duyệt.
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${BASE_URL}/api/ai/design`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    if (res.ok && isJson) {
      const data = await res.json();
      if (data.isAIGenerated && Array.isArray(data.proposals) && data.proposals.length) {
        // Gắn mẫu thiệp thật cho phương án AI để áp dụng ra thiệp đẹp ngay
        const proposals = data.proposals.map((p: AIDesignProposal, i: number) => ({
          ...p,
          templateId: p.templateId || local[i % local.length]?.templateId,
          groomName: payload.groomName,
          brideName: payload.brideName,
        }));
        return { isAIGenerated: true, proposals };
      }
    }
  } catch {
    /* không có máy chủ AI — dùng bản chạy trên trình duyệt */
  }
  return { isAIGenerated: false, proposals: local };
}

export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/pricing`);
    if (res.ok) {
      const data = await res.json();
      return data.plans || PRICING_PLANS;
    }
  } catch {
    // fallback
  }
  return PRICING_PLANS;
}

// ==========================================
// ORDERS & SEPAY VIETQR
// ==========================================

export async function fetchOrders(): Promise<Order[]> {
  const currentUser = auth.currentUser;
  if (!currentUser) return [];

  const isAdmin = isAdminUser(currentUser.email);
  const ordersCol = collection(db, 'orders');

  try {
    const q = isAdmin ? query(ordersCol) : query(ordersCol, where('userId', '==', currentUser.uid));
    const snapshot = await getDocs(q);
    const orders: Order[] = [];
    snapshot.forEach((d) => orders.push({ ...(d.data() as Order), id: d.id }));
    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return orders;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'orders');
  }
}

export async function createOrder(
  planId: string,
  invitationId?: string,
  invitationTitle?: string,
  invitationSlug?: string
): Promise<{
  order: Order;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    amount: number;
    referenceCode: string;
    vietQrUrl: string;
  };
}> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Vui lòng đăng nhập để nâng cấp gói.');

  const plan = PRICING_PLANS.find((p) => p.id === planId) || PRICING_PLANS[1];
  const orderId = `ord-${Date.now()}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

  // Random 6-char reference code (TOP + 6 chars)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let refSuffix = '';
  for (let i = 0; i < 6; i++) {
    refSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const referenceCode = `TOP${refSuffix}`;

  const { SEPAY_BANK } = await import('../data/paymentConfig');
  const bankName = SEPAY_BANK.bankName;
  const accountNumber = SEPAY_BANK.accountNumber;
  const accountHolder = SEPAY_BANK.accountHolder;
  const amount = plan.price;
  const encodedDes = encodeURIComponent(referenceCode);
  // Mã QR động của SePay: quét là điền sẵn số tiền & nội dung (mã đơn) → SePay tự xác nhận
  const vietQrUrl = `https://qr.sepay.vn/img?acc=${accountNumber}&bank=${encodeURIComponent(bankName)}&amount=${amount}&des=${encodedDes}&template=compact`;

  const order: Order = {
    id: orderId,
    userId: currentUser.uid,
    userName: currentUser.displayName || 'Khách hàng',
    userEmail: currentUser.email || '',
    planId: plan.id as 'premium' | 'luxury',
    amount,
    status: 'pending',
    bankReference: referenceCode,
    expiresAt,
    invitationId,
    invitationTitle,
    invitationSlug,
    createdAt: now.toISOString(),
  };

  try {
    await setDoc(doc(db, 'orders', orderId), order);

    // If attached to an invitation, mark invitation as pending_payment
    if (invitationId) {
      try {
        const invRef = doc(db, 'invitations', invitationId);
        await updateDoc(invRef, {
          status: 'pending_payment',
          selectedPlanId: plan.id as any,
          orderId,
          updatedAt: now.toISOString(),
        });
      } catch (e) {
        console.warn('Could not update invitation to pending_payment:', e);
      }
    }

    return {
      order,
      bankAccount: {
        bankName,
        accountNumber,
        accountHolder,
        amount,
        referenceCode,
        vietQrUrl,
      },
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `orders/${orderId}`);
  }
}

export async function pollOrderStatus(orderId: string): Promise<{ order: Order; isPaid: boolean }> {
  try {
    const snap = await getDoc(doc(db, 'orders', orderId));
    if (!snap.exists()) throw new Error('Không tìm thấy đơn hàng');
    const order = { ...(snap.data() as Order), id: snap.id };
    return {
      order,
      isPaid: order.status === 'paid' || order.status === 'manual_approved',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `orders/${orderId}`);
  }
}

export async function simulateDevPayment(orderId: string): Promise<{ order: Order; isPaid: boolean }> {
  const orderRef = doc(db, 'orders', orderId);
  try {
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error('Không tìm thấy đơn hàng để mô phỏng thanh toán.');

    const orderData = snap.data() as Order;
    const now = new Date();
    const paidAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Mark order as paid
    await updateDoc(orderRef, {
      status: 'paid',
      sepayTransactionId: `DEV-SIM-${Date.now()}`,
      paidAt,
      proofNote: 'Thanh toán thành công giả lập (Dev Sandbox)',
    });

    // 2. Upgrade user plan in users collection
    if (orderData.userId) {
      try {
        const userRef = doc(db, 'users', orderData.userId);
        await updateDoc(userRef, {
          plan: orderData.planId,
          planExpiresAt: expiresAt,
        });
      } catch (e) {
        console.warn('Could not upgrade user profile in dev simulation:', e);
      }
    }

    // 3. Auto-publish invitation if linked
    if (orderData.invitationId) {
      try {
        const invRef = doc(db, 'invitations', orderData.invitationId);
        await updateDoc(invRef, {
          status: 'published',
          isPaid: true,
          selectedPlanId: orderData.planId,
          orderId: orderData.id,
          publishedAt: paidAt,
          updatedAt: paidAt,
        });
      } catch (e) {
        console.warn('Could not auto-publish invitation in dev simulation:', e);
      }
    }

    const fresh = await getDoc(orderRef);
    const updatedOrder = { ...(fresh.data() as Order), id: fresh.id };
    return {
      order: updatedOrder,
      isPaid: true,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function adminPublishInvitation(
  invitationId: string,
  assignedPlan: 'free' | 'premium' | 'luxury',
  invitationTitle?: string,
  invitationSlug?: string
): Promise<WeddingInvitation> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isAdminUser(currentUser.email)) {
    throw new Error('Chỉ Quản Trị Viên mới có quyền xuất bản miễn phí.');
  }

  const now = new Date().toISOString();
  const invRef = doc(db, 'invitations', invitationId);

  // Update invitation directly to published
  await updateDoc(invRef, {
    status: 'published',
    isPaid: true,
    selectedPlanId: assignedPlan,
    publishedAt: now,
    updatedAt: now,
  });

  // Record audit log to adminActions (does not count towards revenue)
  const actionId = `act-${Date.now()}`;
  const adminAction: AdminAction = {
    id: actionId,
    adminEmail: currentUser.email || 'admin@thieponl.vn',
    adminName: currentUser.displayName || 'Quản Trị Viên',
    action: 'free_publish',
    invitationId,
    invitationTitle: invitationTitle || 'Thiệp Cưới',
    invitationSlug: invitationSlug || '',
    assignedPlan,
    timestamp: now,
    note: `Xuất bản miễn phí bởi Quản Trị Viên (Gán gói: ${assignedPlan.toUpperCase()})`,
  };

  try {
    await setDoc(doc(db, 'adminActions', actionId), adminAction);
  } catch (err) {
    console.warn('Could not record adminAction log:', err);
  }

  const fresh = await getDoc(invRef);
  return { ...(fresh.data() as WeddingInvitation), id: fresh.id };
}

export async function fetchAdminActions(): Promise<AdminAction[]> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isAdminUser(currentUser.email)) {
    return [];
  }

  try {
    const colRef = collection(db, 'adminActions');
    const snapshot = await getDocs(colRef);
    const actions: AdminAction[] = [];
    snapshot.forEach((d) => actions.push({ ...(d.data() as AdminAction), id: d.id }));
    actions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return actions;
  } catch (error) {
    console.error('Error fetching admin actions:', error);
    return [];
  }
}

export async function publishInvitation(invitationId: string): Promise<WeddingInvitation> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Vui lòng đăng nhập để xuất bản thiệp.');

  const invRef = doc(db, 'invitations', invitationId);
  const snap = await getDoc(invRef);
  if (!snap.exists()) throw new Error('Không tìm thấy thiệp cưới');

  const invData = snap.data() as WeddingInvitation;
  const isAdmin = isAdminUser(currentUser.email);

  let markFreeTrial = false;

  // Không phải admin: kiểm tra gói. Mỗi tài khoản được 1 thiệp miễn phí ĐẦY ĐỦ tính năng.
  if (!isAdmin) {
    const userRef = doc(db, 'users', currentUser.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.exists() ? userSnap.data() : {};
    const userPlan = userData.plan || 'free';
    const planActive =
      (userPlan === 'premium' || userPlan === 'luxury') &&
      (!userData.planExpiresAt || new Date(userData.planExpiresAt).getTime() > Date.now());

    if (!planActive && !invData.isPaid) {
      const freeStatus = await getFreeTrialStatus(invitationId);
      if (!freeStatus.available) {
        throw new Error(
          'Bạn đã sử dụng lượt tạo thiệp miễn phí cho tài khoản này. Vui lòng chọn gói Premium hoặc Luxury để xuất bản thêm thiệp.'
        );
      }
      markFreeTrial = true;
      await updateDoc(userRef, { freeInvitationId: invitationId }).catch((e) =>
        console.warn('Không ghi được lượt miễn phí:', e)
      );
    }
  }

  const now = new Date().toISOString();
  await updateDoc(invRef, {
    status: 'published',
    publishedAt: invData.publishedAt || now,
    updatedAt: now,
    ...(markFreeTrial ? { isFreeTrial: true, selectedPlanId: 'free' } : {}),
  });

  const fresh = await getDoc(invRef);
  return { ...(fresh.data() as WeddingInvitation), id: fresh.id };
}

/**
 * Kiểm tra lượt thiệp miễn phí của tài khoản hiện tại.
 * available = true nếu chưa dùng, hoặc chính thiệp `invitationId` là thiệp đã dùng lượt free.
 */
export async function getFreeTrialStatus(
  invitationId?: string
): Promise<{ available: boolean; usedInvitationId?: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser) return { available: true };
  try {
    const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
    const usedId: string | undefined = userSnap.exists() ? userSnap.data().freeInvitationId || undefined : undefined;
    if (usedId) {
      return { available: usedId === invitationId, usedInvitationId: usedId };
    }
    // Tài khoản cũ: coi thiệp đã xuất bản mà chưa thanh toán là đã dùng lượt free
    const snap = await getDocs(query(collection(db, 'invitations'), where('userId', '==', currentUser.uid)));
    let legacy: string | undefined;
    snap.forEach((d) => {
      const data = d.data() as WeddingInvitation;
      if (d.id !== invitationId && data.status === 'published' && !data.isPaid) legacy = d.id;
    });
    return legacy ? { available: false, usedInvitationId: legacy } : { available: true };
  } catch (err) {
    console.warn('Không kiểm tra được lượt miễn phí:', err);
    return { available: true };
  }
}

export async function approveOrderManually(orderId: string, note?: string): Promise<Order> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isAdminUser(currentUser.email)) {
    throw new Error('Chỉ Quản Trị Viên mới có quyền duyệt đơn thủ công.');
  }

  const orderRef = doc(db, 'orders', orderId);
  try {
    const snap = await getDoc(orderRef);
    if (!snap.exists()) throw new Error('Không tìm thấy đơn hàng');
    const orderData = snap.data() as Order;

    const now = new Date();
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + 1);

    await updateDoc(orderRef, {
      status: 'manual_approved',
      manualApprovedBy: currentUser.email || 'admin',
      manualApprovedAt: now.toISOString(),
      manualNote: note || 'Duyệt tay thủ công bởi Admin',
    });

    // Update target user's plan in Firestore
    if (orderData.userId) {
      const userRef = doc(db, 'users', orderData.userId);
      await updateDoc(userRef, {
        plan: orderData.planId,
        planExpiresAt: expiry.toISOString(),
      }).catch(() => {});
    }

    const fresh = await getDoc(orderRef);
    return { ...(fresh.data() as Order), id: fresh.id };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function fetchAdminUsers(
  search?: string,
  plan?: string
): Promise<{ users: User[]; totalUsers: number; totalRevenue: number }> {
  const currentUser = auth.currentUser;
  if (!currentUser || !isAdminUser(currentUser.email)) {
    throw new Error('Chỉ Admin mới có quyền truy cập');
  }

  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let usersList: User[] = [];
    usersSnap.forEach((d) => usersList.push({ ...(d.data() as User), id: d.id }));

    if (search) {
      const s = search.toLowerCase();
      usersList = usersList.filter(
        (u) => u.email?.toLowerCase().includes(s) || u.displayName?.toLowerCase().includes(s)
      );
    }
    if (plan && plan !== 'all') {
      usersList = usersList.filter((u) => u.plan === plan);
    }

    // Calculate revenue from orders
    let totalRevenue = 0;
    const ordersSnap = await getDocs(collection(db, 'orders'));
    ordersSnap.forEach((d) => {
      const ord = d.data() as Order;
      if (ord.status === 'paid' || ord.status === 'manual_approved') {
        totalRevenue += ord.amount || 0;
      }
    });

    return {
      users: usersList,
      totalUsers: usersList.length,
      totalRevenue,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'users');
  }
}
