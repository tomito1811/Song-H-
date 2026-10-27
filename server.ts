import express, { Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { FieldValue, Query, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import {
  adminAuth,
  adminDb,
  requireAuth,
  optionalAuth,
  requireAdmin,
  isAdminEmail,
  AuthenticatedRequest,
} from './src/server/firebaseAdmin.js';
import { WEDDING_TEMPLATES } from './src/data/templates.js';
import { PRICING_PLANS } from './src/data/pricing.js';
import {
  WeddingInvitation,
  Guest,
  RSVP,
  Wish,
  User,
  Order,
  Payment,
  AIDesignProposal,
} from './src/types/wedding.js';
import { sendOrderPaidEmails } from './src/server/email.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to get GoogleGenAI client
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper: Generate random 6-character reference code (e.g., TOP8F2K9M)
function generatePaymentCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TOP';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

// ==========================================
// AUTHENTICATION & USER MANAGEMENT ROUTES
// ==========================================

// Get current verified user profile
app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const now = new Date().toISOString();
    let userData: any = {
      id: uid,
      email: req.user!.email || '',
      displayName: req.user!.displayName || req.user!.email?.split('@')[0] || 'Cặp Đôi Mới',
      photoURL: req.user!.photoURL || '',
      plan: 'free',
      planExpiresAt: null,
      role: req.user!.isAdmin ? 'admin' : 'user',
      createdAt: now,
      lastLoginAt: now,
      acceptedTermsAt: null,
    };

    try {
      const userRef = adminDb.collection('users').doc(uid);
      const doc = await userRef.get();
      if (!doc.exists) {
        await userRef.set(userData);
      } else {
        const existingData = doc.data();
        userData = { ...userData, ...existingData, lastLoginAt: now, role: req.user!.isAdmin ? 'admin' : 'user' };
        await userRef.update({ lastLoginAt: now }).catch(() => {});
      }
    } catch (e: any) {
      console.warn('adminDb users read limited, serving token user:', e?.message || e);
    }

    res.json({
      success: true,
      user: {
        id: uid,
        name: userData.displayName || req.user!.displayName || 'Cặp Đôi Mới',
        email: userData.email,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        role: req.user!.isAdmin ? 'admin' : 'user',
        plan: userData.plan || 'free',
        planExpiresAt: userData.planExpiresAt,
        createdAt: userData.createdAt,
        lastLoginAt: userData.lastLoginAt,
        acceptedTermsAt: userData.acceptedTermsAt,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/auth/me:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi xác thực người dùng' });
  }
});

// Update terms acceptance for user
app.post('/api/auth/accept-terms', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const uid = req.user!.uid;
    const now = new Date().toISOString();
    try {
      const userRef = adminDb.collection('users').doc(uid);
      await userRef.set({ acceptedTermsAt: now }, { merge: true });
    } catch (e: any) {
      console.warn('adminDb accept-terms write warning:', e?.message || e);
    }
    res.json({ success: true, acceptedTermsAt: now });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi ghi nhận điều khoản' });
  }
});

// ==========================================
// TEMPLATES ROUTES
// ==========================================

app.get('/api/templates', (req, res) => {
  const { category, isPremium } = req.query;
  let results = [...WEDDING_TEMPLATES];
  if (category && category !== 'all') {
    results = results.filter(t => t.category === category);
  }
  if (isPremium === 'true') {
    results = results.filter(t => t.isPremium);
  } else if (isPremium === 'false') {
    results = results.filter(t => !t.isPremium);
  }
  res.json({ success: true, templates: results });
});

app.get('/api/templates/:slug', (req, res) => {
  const template = WEDDING_TEMPLATES.find(t => t.slug === req.params.slug || t.id === req.params.slug);
  if (!template) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy mẫu thiệp' });
  }
  res.json({ success: true, template });
});

// ==========================================
// INVITATIONS ROUTES (FIRESTORE)
// ==========================================

app.get('/api/invitations', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const isUserAdmin = req.user!.isAdmin;
    const requestedUserId = req.query.userId as string;

    let query: Query = adminDb.collection('invitations');

    if (isUserAdmin) {
      if (requestedUserId) {
        query = query.where('userId', '==', requestedUserId);
      }
    } else {
      // Normal user can strictly only see their own invitations
      query = query.where('userId', '==', req.user!.uid);
    }

    const snapshot = await query.get();
    const invitations: WeddingInvitation[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => {
      invitations.push({ ...(doc.data() as WeddingInvitation), id: doc.id });
    });

    // Sort in memory by updatedAt descending
    invitations.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());

    res.json({ success: true, invitations });
  } catch (err: any) {
    console.error('Error fetching invitations:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách thiệp cưới' });
  }
});

// Public fetch by slug (for public invite webpage)
app.get('/api/invitations/:slug', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const slug = req.params.slug;
    let invDoc: DocumentSnapshot | null = null;

    // Search by slug
    const snapshot = await adminDb.collection('invitations').where('slug', '==', slug).limit(1).get();
    if (!snapshot.empty) {
      invDoc = snapshot.docs[0];
    } else {
      // Fallback check by doc ID
      const direct = await adminDb.collection('invitations').doc(slug).get();
      if (direct.exists) {
        invDoc = direct;
      }
    }

    if (!invDoc || !invDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp cưới này' });
    }

    const data = invDoc.data() as WeddingInvitation;

    // Security check: Unpaid/draft cards return 404 to non-owner public visitors
    const isOwnerOrAdmin = req.user && (req.user.isAdmin || req.user.uid === data.userId);
    if (data.status !== 'published' && !isOwnerOrAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Thiệp cưới chưa được xuất bản hoặc đang được cặp đôi chỉnh sửa.',
      });
    }

    // Atomically increment viewsCount if published
    if (data.status === 'published') {
      await invDoc.ref.update({
        viewsCount: FieldValue.increment(1),
      }).catch(() => {});
    }

    res.json({
      success: true,
      invitation: {
        ...data,
        id: invDoc.id,
        viewsCount: (data.viewsCount || 0) + (data.status === 'published' ? 1 : 0),
      },
    });
  } catch (err: any) {
    console.error('Error fetching public invitation:', err);
    res.status(500).json({ success: false, message: 'Lỗi truy cập thiệp cưới' });
  }
});

app.get('/api/invitations/id/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await adminDb.collection('invitations').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp cưới' });
    }
    const data = doc.data() as WeddingInvitation;
    if (!req.user!.isAdmin && data.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem thiệp cưới này' });
    }
    res.json({ success: true, invitation: { ...data, id: doc.id } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

app.post('/api/invitations', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payload = req.body as Partial<WeddingInvitation>;
    const userId = req.user!.uid;

    // Fetch user plan and check quotas
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userPlan = userDoc.exists ? (userDoc.data()?.plan || 'free') : 'free';

    const existingCountSnapshot = await adminDb.collection('invitations').where('userId', '==', userId).get();
    const existingCount = existingCountSnapshot.size;

    const planLimits: Record<string, number> = {
      free: 1,
      premium: 3,
      luxury: 9999,
    };

    if (existingCount >= (planLimits[userPlan] || 1) && !req.user!.isAdmin) {
      return res.status(403).json({
        success: false,
        message: `Gói ${userPlan.toUpperCase()} hiện tại chỉ cho phép tối đa ${planLimits[userPlan]} thiệp. Vui lòng nâng cấp gói để tạo thêm.`,
      });
    }

    const templateId = payload.templateId || 'tpl-pastel-01';
    const tpl = WEDDING_TEMPLATES.find(t => t.id === templateId) || WEDDING_TEMPLATES[0];

    // Unique slug generator
    const rawBride = (payload.brideName ?? '').trim();
    const rawGroom = (payload.groomName ?? '').trim();
    const baseSlug = (rawBride || rawGroom)
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

    const newId = `inv-${Date.now()}`;
    const now = new Date().toISOString();

    const newInvitation: WeddingInvitation = {
      id: newId,
      slug,
      userId,
      title: payload.title !== undefined ? payload.title : (rawBride && rawGroom ? `Hôn Lễ ${rawBride} & ${rawGroom}` : 'Thiệp Cưới'),
      status: payload.status || 'draft',
      templateId,
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
      invitationMessage: payload.invitationMessage ?? tpl.defaultInvitationMessage,
      thankYouMessage: payload.thankYouMessage ?? tpl.defaultThankYouMessage,
      coverImage: payload.coverImage ?? tpl.preview,
      galleryImages: payload.galleryImages ?? [tpl.preview],
      musicUrl: payload.musicUrl ?? 'https://assets.mixkit.co/music/preview/mixkit-wedding-waltz-298.mp3',
      design: payload.design ?? tpl.design,
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
          yearOrDate: '2022',
          title: 'Lần Đầu Gặp Gỡ',
          description: 'Những ánh mắt đầu tiên trao nhau và bắt đầu một hành trình yêu thương.',
        },
        {
          id: 'story-2',
          yearOrDate: '2024',
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
        enabled: false,
        bankName: 'TPBank',
        accountNumber: '87583868888',
        accountHolder: 'TRAN MINH TIEN',
        note: 'Mừng cưới',
      },
      viewsCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await adminDb.collection('invitations').doc(newId).set(newInvitation);
    console.log(`[API POST /invitations] Successfully created invitation id ${newId}`);
    res.status(201).json({ success: true, invitation: newInvitation });
  } catch (err: any) {
    console.error('[API POST /invitations] Detailed error creating invitation:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi tạo thiệp cưới trên máy chủ' });
  }
});

app.put('/api/invitations/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invId = req.params.id;
    console.log(`[API PUT /invitations/${invId}] Update payload received:`, Object.keys(req.body));
    const invRef = adminDb.collection('invitations').doc(invId);
    const doc = await invRef.get();
    if (!doc.exists) {
      console.warn(`[API PUT /invitations/${invId}] Invitation not found in Firestore`);
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp cưới để cập nhật' });
    }

    const existing = doc.data() as WeddingInvitation;
    if (!req.user!.isAdmin && existing.userId !== req.user!.uid) {
      console.warn(`[API PUT /invitations/${invId}] User ${req.user!.uid} does not own invitation ${invId}`);
      return res.status(403).json({ success: false, message: 'Bạn không có quyền chỉnh sửa thiệp cưới này' });
    }

    const updatedData = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    delete updatedData.id;
    delete updatedData.userId; // Prevent hijacking

    await invRef.update(updatedData);
    const fresh = await invRef.get();
    console.log(`[API PUT /invitations/${invId}] Successfully updated invitation`);

    res.json({ success: true, invitation: { id: fresh.id, ...fresh.data() } });
  } catch (err: any) {
    console.error(`[API PUT /invitations/${req.params.id}] Detailed error updating:`, err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi cập nhật thiệp cưới trên máy chủ' });
  }
});

app.delete('/api/invitations/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invRef = adminDb.collection('invitations').doc(req.params.id);
    const doc = await invRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp cưới' });
    }

    const existing = doc.data() as WeddingInvitation;
    if (!req.user!.isAdmin && existing.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa thiệp cưới này' });
    }

    await invRef.delete();

    // Clean up subcollections
    const guestsSnap = await invRef.collection('guests').get();
    guestsSnap.forEach(g => g.ref.delete());

    const rsvpsSnap = await invRef.collection('rsvps').get();
    rsvpsSnap.forEach(r => r.ref.delete());

    const wishesSnap = await invRef.collection('wishes').get();
    wishesSnap.forEach(w => w.ref.delete());

    res.json({ success: true, message: 'Đã xóa thiệp cưới thành công' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi xóa thiệp cưới' });
  }
});

app.post('/api/invitations/:id/publish', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invRef = adminDb.collection('invitations').doc(req.params.id);
    const doc = await invRef.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp cưới' });
    }

    const existing = doc.data() as WeddingInvitation;
    const isUserAdmin = Boolean(req.user!.isAdmin);
    if (!isUserAdmin && existing.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền cập nhật thiệp cưới này' });
    }

    const nextStatus = existing.status === 'published' ? 'draft' : 'published';

    // Strict Server-side Plan Check: if switching to published and not admin
    if (!isUserAdmin && nextStatus === 'published') {
      let userPlan = 'free';
      try {
        const userDoc = await adminDb.collection('users').doc(req.user!.uid).get();
        if (userDoc.exists) {
          userPlan = userDoc.data()?.plan || 'free';
        }
      } catch (e) {
        console.warn('Could not read user plan on server:', e);
      }

      const isPaid = Boolean(existing.isPaid);
      const tpl = WEDDING_TEMPLATES.find(t => t.id === existing.templateId || t.slug === existing.templateId);
      const isPremiumTemplate = Boolean(tpl?.isPremium);
      const photoCount = existing.galleryImages?.length || 0;
      const hasMusic = Boolean(existing.musicUrl && existing.musicUrl.trim() !== '');
      const hasGiftBox = Boolean(existing.giftBank?.enabled);
      const requiresPaid = isPremiumTemplate || photoCount > 5 || hasMusic || hasGiftBox;

      if (requiresPaid && userPlan === 'free' && !isPaid) {
        return res.status(402).json({
          success: false,
          message: 'Thiệp cưới đang sử dụng các tính năng cao cấp (mẫu Premium, nhạc nền, album ảnh hoặc hộp mừng). Vui lòng thanh toán gói Premium/Luxury để xuất bản.',
        });
      }
    }

    const updatedAt = new Date().toISOString();
    await invRef.update({
      status: nextStatus,
      publishedAt: nextStatus === 'published' ? (existing.publishedAt || updatedAt) : existing.publishedAt,
      updatedAt,
    });

    res.json({
      success: true,
      status: nextStatus,
      invitation: {
        ...existing,
        status: nextStatus,
        publishedAt: nextStatus === 'published' ? (existing.publishedAt || updatedAt) : existing.publishedAt,
        updatedAt,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi thay đổi trạng thái xuất bản' });
  }
});

// ==========================================
// GUEST MANAGEMENT ROUTES (FIRESTORE)
// ==========================================

app.get('/api/invitations/:id/guests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invDoc = await adminDb.collection('invitations').doc(req.params.id).get();
    if (!invDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp cưới' });
    }
    const invData = invDoc.data() as WeddingInvitation;
    if (!req.user!.isAdmin && invData.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Không có quyền xem khách mời' });
    }

    const snapshot = await invDoc.ref.collection('guests').get();
    const guests: Guest[] = [];
    snapshot.forEach(doc => {
      guests.push({ id: doc.id, ...doc.data() } as Guest);
    });

    res.json({ success: true, guests });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách khách' });
  }
});

app.post('/api/invitations/:id/guests', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invDoc = await adminDb.collection('invitations').doc(req.params.id).get();
    if (!invDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp cưới' });
    }
    const invData = invDoc.data() as WeddingInvitation;
    if (!req.user!.isAdmin && invData.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Không có quyền thêm khách mời' });
    }

    const { name, group, email, phone, attendeesCount, note } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Tên khách mời là bắt buộc' });
    }

    const guestId = `gst-${Date.now()}`;
    const token = Math.random().toString(36).substring(2, 8);
    const newGuest: Guest = {
      id: guestId,
      invitationId: req.params.id,
      name,
      group: group || 'family',
      email: email || '',
      phone: phone || '',
      personalToken: token,
      rsvpStatus: 'pending',
      attendeesCount: attendeesCount ? Number(attendeesCount) : 1,
      note: note || '',
      createdAt: new Date().toISOString(),
    };

    await invDoc.ref.collection('guests').doc(guestId).set(newGuest);
    res.status(201).json({ success: true, guest: newGuest });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi thêm khách mời' });
  }
});

app.put('/api/invitations/:id/guests/:guestId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invDoc = await adminDb.collection('invitations').doc(req.params.id).get();
    if (!invDoc.exists) return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp' });
    if (!req.user!.isAdmin && invDoc.data()?.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    const guestRef = invDoc.ref.collection('guests').doc(req.params.guestId);
    await guestRef.update(req.body);
    const fresh = await guestRef.get();
    res.json({ success: true, guest: { id: fresh.id, ...fresh.data() } });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật khách mời' });
  }
});

app.delete('/api/invitations/:id/guests/:guestId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invDoc = await adminDb.collection('invitations').doc(req.params.id).get();
    if (!invDoc.exists) return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp' });
    if (!req.user!.isAdmin && invDoc.data()?.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Không có quyền' });
    }

    await invDoc.ref.collection('guests').doc(req.params.guestId).delete();
    res.json({ success: true, message: 'Đã xóa khách mời' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi xóa khách mời' });
  }
});

// ==========================================
// RSVP & WISHES (GUESTBOOK)
// ==========================================

app.get('/api/invitations/:id/rsvps', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invDoc = await adminDb.collection('invitations').doc(req.params.id).get();
    if (!invDoc.exists) return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp' });
    if (!req.user!.isAdmin && invDoc.data()?.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Không có quyền xem RSVP' });
    }

    const snapshot = await invDoc.ref.collection('rsvps').get();
    const rsvps: RSVP[] = [];
    snapshot.forEach(doc => rsvps.push({ id: doc.id, ...doc.data() } as RSVP));
    rsvps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, rsvps });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi tải RSVP' });
  }
});

// Public RSVP Submission
app.post('/api/invitations/:slug/rsvp', async (req, res) => {
  try {
    const slug = req.params.slug;
    let invDoc: DocumentSnapshot | null = null;
    const snap = await adminDb.collection('invitations').where('slug', '==', slug).limit(1).get();
    if (!snap.empty) {
      invDoc = snap.docs[0];
    } else {
      const direct = await adminDb.collection('invitations').doc(slug).get();
      if (direct.exists) invDoc = direct;
    }

    if (!invDoc || !invDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp cưới' });
    }

    const { guestName, phone, isAttending, attendeesCount, side, dietaryNote, message } = req.body;
    if (!guestName) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập họ và tên của bạn' });
    }

    const rsvpId = `rsvp-${Date.now()}`;
    const now = new Date().toISOString();

    const newRsvp: RSVP = {
      id: rsvpId,
      invitationId: invDoc.id,
      guestName,
      phone: phone || '',
      isAttending: Boolean(isAttending),
      attendeesCount: attendeesCount ? Math.max(1, Number(attendeesCount)) : 1,
      side: side || 'mutual',
      dietaryNote: dietaryNote || '',
      message: message || '',
      createdAt: now,
    };

    await invDoc.ref.collection('rsvps').doc(rsvpId).set(newRsvp);

    // If message present, auto create guestbook wish
    if (message && message.trim()) {
      const sideMap = { groom: 'Khách nhà trai', bride: 'Khách nhà gái', mutual: 'Bạn chung' };
      const wishId = `wish-${Date.now()}`;
      await invDoc.ref.collection('wishes').doc(wishId).set({
        id: wishId,
        invitationId: invDoc.id,
        senderName: guestName,
        senderRelation: sideMap[side as keyof typeof sideMap] || 'Khách quý',
        message: message.trim(),
        createdAt: now,
        isApproved: true,
      });
    }

    // Try finding matching guest to update status
    const guestSnap = await invDoc.ref.collection('guests').get();
    guestSnap.forEach(async (gDoc: QueryDocumentSnapshot) => {
      const g = gDoc.data() as Guest;
      if ((phone && g.phone === phone) || g.name.toLowerCase() === guestName.toLowerCase()) {
        await gDoc.ref.update({
          rsvpStatus: isAttending ? 'attending' : 'declined',
          attendeesCount: newRsvp.attendeesCount,
        });
      }
    });

    res.status(201).json({
      success: true,
      message: 'Gửi xác nhận thành công. Chân thành cảm ơn bạn!',
      rsvp: newRsvp,
    });
  } catch (err: any) {
    console.error('Error submitting RSVP:', err);
    res.status(500).json({ success: false, message: 'Lỗi ghi nhận phản hồi' });
  }
});

// Public Wishes (Guestbook) List
app.get('/api/invitations/:slug/wishes', async (req, res) => {
  try {
    const slug = req.params.slug;
    let invDoc: DocumentSnapshot | null = null;
    const snap = await adminDb.collection('invitations').where('slug', '==', slug).limit(1).get();
    if (!snap.empty) {
      invDoc = snap.docs[0];
    } else {
      const direct = await adminDb.collection('invitations').doc(slug).get();
      if (direct.exists) invDoc = direct;
    }

    if (!invDoc || !invDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp cưới' });
    }

    const wishesSnap = await invDoc.ref.collection('wishes').where('isApproved', '==', true).get();
    const wishes: Wish[] = [];
    wishesSnap.forEach((doc: QueryDocumentSnapshot) => wishes.push({ ...(doc.data() as Wish), id: doc.id }));
    wishes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ success: true, wishes });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi tải lời chúc' });
  }
});

// Public Wishes Submission
app.post('/api/invitations/:slug/wishes', async (req, res) => {
  try {
    const slug = req.params.slug;
    let invDoc: DocumentSnapshot | null = null;
    const snap = await adminDb.collection('invitations').where('slug', '==', slug).limit(1).get();
    if (!snap.empty) {
      invDoc = snap.docs[0];
    } else {
      const direct = await adminDb.collection('invitations').doc(slug).get();
      if (direct.exists) invDoc = direct;
    }

    if (!invDoc || !invDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp cưới' });
    }

    const { senderName, senderRelation, message } = req.body;
    if (!senderName || !message) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và lời chúc' });
    }

    const wishId = `wish-${Date.now()}`;
    const newWish: Wish = {
      id: wishId,
      invitationId: invDoc.id,
      senderName,
      senderRelation: senderRelation || 'Bạn bè',
      message,
      createdAt: new Date().toISOString(),
      isApproved: true,
    };

    await invDoc.ref.collection('wishes').doc(wishId).set(newWish);
    res.status(201).json({ success: true, message: 'Gửi lời chúc thành công!', wish: newWish });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi gửi lời chúc' });
  }
});

// Admin/Owner delete wish
app.delete('/api/invitations/:id/wishes/:wishId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invDoc = await adminDb.collection('invitations').doc(req.params.id).get();
    if (!invDoc.exists) return res.status(404).json({ success: false, message: 'Không tìm thấy thiệp' });
    if (!req.user!.isAdmin && invDoc.data()?.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Không có quyền xóa' });
    }

    await invDoc.ref.collection('wishes').doc(req.params.wishId).delete();
    res.json({ success: true, message: 'Đã xóa lời chúc' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi xóa lời chúc' });
  }
});

// ==========================================
// AI WEDDING DESIGNER (GEMINI 3.8 FLASH)
// ==========================================

app.post('/api/ai/design', async (req, res) => {
  const { brideName, groomName, stylePreference, tone, notes } = req.body;

  const bride = brideName || 'Cô Dâu';
  const groom = groomName || 'Chú Rể';
  const style = stylePreference || 'Pastel Luxury';

  const curatedProposals: AIDesignProposal[] = [
    {
      id: 'ai-prop-1',
      title: 'Pastel Luxury & Hồng Phấn Hoàng Gia',
      concept: `Dành riêng cho chuyện tình lãng mạn của ${bride} & ${groom}. Phối màu hồng phấn dịu nhẹ và rose pastel kết hợp thi văn tinh tế.`,
      styleName: 'Pastel Luxury',
      palette: {
        primary: '#D4899C',
        secondary: '#E8B7C8',
        background: '#FFFBF7',
        surface: '#FDF2F4',
        text: '#453C45',
        accent: '#C76A82',
      },
      fontHeading: 'Playfair Display, Georgia, serif',
      fontBody: 'Plus Jakarta Sans, sans-serif',
      heroLayout: 'centered',
      invitationMessage: `Hạnh phúc không phải là điểm đến, mà là một hành trình kỳ diệu khi được đồng hành cùng nhau. Chúng tôi trân trọng kính mời quý vị đến làm chứng và chia vui cho ngày chung đôi của ${bride} và ${groom}.`,
      ornamentStyle: 'botanical',
      previewColor: '#F6DCE5',
    },
    {
      id: 'ai-prop-2',
      title: 'Korean Minimalist — Thanh Lịch Đương Đại',
      concept: `Thiết kế tối giản phong cách Hàn Quốc, bố cục tạp chí thông thoáng tôn vinh từng khoảnh khắc chân thực của ${bride} & ${groom}.`,
      styleName: 'Korean Minimal',
      palette: {
        primary: '#7E6B5D',
        secondary: '#D8CEC4',
        background: '#FAF8F5',
        surface: '#FFFFFF',
        text: '#3A332C',
        accent: '#9A8272',
      },
      fontHeading: 'Cormorant Garamond, serif',
      fontBody: 'Plus Jakarta Sans, sans-serif',
      heroLayout: 'editorial',
      invitationMessage: `Giữa hàng triệu người trên thế giới này, chúng tôi đã tìm thấy nhau. Một lời hứa trọn đời, một sự khởi đầu mới đầy ắp yêu thương và bình yên.`,
      ornamentStyle: 'minimal-lines',
      previewColor: '#EBE5DF',
    },
    {
      id: 'ai-prop-3',
      title: 'Luxury Champagne — Dạ Yến Ánh Sao',
      concept: `Sang trọng với tone màu rượu mừng champagne và vàng cát ấm, tạo nên vẻ đẹp đẳng cấp cho hôn lễ của ${bride} & ${groom}.`,
      styleName: 'Luxury Champagne',
      palette: {
        primary: '#B6925B',
        secondary: '#E9D8BD',
        background: '#FCFBF7',
        surface: '#F8F4EC',
        text: '#383229',
        accent: '#8E6F3E',
      },
      fontHeading: 'Playfair Display, Georgia, serif',
      fontBody: 'Plus Jakarta Sans, sans-serif',
      heroLayout: 'card-overlay',
      invitationMessage: `Cùng nâng ly rượu mừng cho tình yêu đơm hoa kết trái. Sự hiện diện của bạn là mảnh ghép hoàn hảo nhất trong ngày hạnh phúc của chúng tôi.`,
      ornamentStyle: 'vintage-flourish',
      previewColor: '#E9D8BD',
    },
  ];

  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        success: true,
        isAIGenerated: false,
        source: 'preset_fallback',
        proposals: curatedProposals,
      });
    }

    const prompt = `
Bạn là chuyên gia thiết kế thiệp cưới cao cấp (Wedding Invitation Art Director) tại Việt Nam.
Hãy thiết kế 3 phương án thiệp cưới riêng biệt cho cặp đôi:
- Cô dâu: "${bride}"
- Chú rể: "${groom}"
- Phong cách yêu cầu: "${style}"
- Giọng điệu thiệp: "${tone || 'Lãng mạn, sâu lắng, tinh tế'}"
- Ghi chú thêm: "${notes || 'Tiệc cưới sang trọng tại Việt Nam'}"

Hãy trả về DUY NHẤT một mảng JSON gồm đúng 3 phương án theo cấu trúc:
[
  {
    "id": "ai-prop-1",
    "title": "Tên phương án (ngắn gọn, mỹ miều)",
    "concept": "Ý tưởng thiết kế (2 câu giải thích)",
    "styleName": "Pastel Romantic hoặc Korean Minimal hoặc Champagne Luxury",
    "palette": {
      "primary": "#HEX (màu chủ đạo)",
      "secondary": "#HEX (màu phụ)",
      "background": "#FFFBF7 hoặc màu pastel kem",
      "surface": "#HEX",
      "text": "#453C45 hoặc than đậm",
      "accent": "#HEX"
    },
    "fontHeading": "Playfair Display, Georgia, serif" hoặc "Cormorant Garamond, serif",
    "fontBody": "Plus Jakarta Sans, sans-serif",
    "heroLayout": "centered" hoặc "editorial" hoặc "card-overlay",
    "invitationMessage": "Lời mời cưới tiếng Việt thật sâu sắc, xúc động và trang nhã (2-3 câu, nêu tên ${bride} và ${groom})",
    "ornamentStyle": "botanical" hoặc "minimal-lines" hoặc "vintage-flourish",
    "previewColor": "#HEX"
  }
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(responseText.trim());

    if (Array.isArray(parsed) && parsed.length >= 3) {
      return res.json({
        success: true,
        isAIGenerated: true,
        source: 'gemini-3.8-flash',
        proposals: parsed,
      });
    }

    return res.json({
      success: true,
      isAIGenerated: false,
      source: 'preset_fallback',
      proposals: curatedProposals,
    });
  } catch (err: any) {
    console.error('Gemini API call encountered an issue, serving fallback proposals:', err?.message || err);
    return res.json({
      success: true,
      isAIGenerated: false,
      source: 'preset_fallback',
      message: 'Đã tạo phương án tối ưu theo các chuẩn thiết kế thịnh hành',
      proposals: curatedProposals,
    });
  }
});

// ==========================================
// ORDERS & SEPAY PAYMENT INTEGRATION
// ==========================================

app.get('/api/pricing', (req, res) => {
  res.json({ success: true, plans: PRICING_PLANS });
});

// GET /api/orders: Admin sees all, normal user sees strictly own orders
app.get('/api/orders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    let query: Query = adminDb.collection('orders');
    if (!req.user!.isAdmin) {
      query = query.where('userId', '==', req.user!.uid);
    }

    const snapshot = await query.get();
    const orders: Order[] = [];
    snapshot.forEach((doc: QueryDocumentSnapshot) => orders.push({ ...(doc.data() as Order), id: doc.id }));

    orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ success: true, orders });
  } catch (err: any) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách đơn hàng' });
  }
});

// Single order status polling
app.get('/api/orders/:id/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const doc = await adminDb.collection('orders').doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    const order = doc.data() as Order;
    if (!req.user!.isAdmin && order.userId !== req.user!.uid) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }

    res.json({
      success: true,
      order: { ...order, id: doc.id },
      isPaid: order.status === 'paid' || order.status === 'manual_approved',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi kiểm tra đơn hàng' });
  }
});

// POST /api/orders: Create verified order with dynamic TOP payment code
app.post('/api/orders', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId } = req.body;
    const plan = PRICING_PLANS.find(p => p.id === planId);
    if (!plan || (planId !== 'premium' && planId !== 'luxury')) {
      return res.status(400).json({ success: false, message: 'Gói dịch vụ không hợp lệ' });
    }

    const userId = req.user!.uid;
    const userEmail = req.user!.email || '';
    const userName = req.user!.displayName || 'Cặp Đôi';

    const orderId = `ord-${Date.now().toString().slice(-6)}`;
    const bankReference = generatePaymentCode(); // "TOP" + 6 chars
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // 30 mins

    const newOrder: Order = {
      id: orderId,
      userId,
      userName,
      userEmail,
      planId: plan.id as 'premium' | 'luxury',
      amount: plan.price, // Price strictly enforced on server
      status: 'pending',
      bankReference,
      proofNote: 'Chờ giao dịch SePay TPBank',
      createdAt: now.toISOString(),
      expiresAt,
    };

    await adminDb.collection('orders').doc(orderId).set(newOrder);

    res.status(201).json({
      success: true,
      order: newOrder,
      bankAccount: {
        bankName: 'TPBank',
        accountNumber: process.env.TPBANK_ACCOUNT_NO || '87583868888',
        accountHolder: process.env.TPBANK_ACCOUNT_NAME || 'TRAN MINH TIEN',
        amount: plan.price,
        referenceCode: bankReference,
        vietQrUrl: `https://vietqr.app/img?acc=${process.env.TPBANK_ACCOUNT_NO || '87583868888'}&bank=TPBank&amount=${plan.price}&des=${bankReference}`,
      },
    });
  } catch (err: any) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, message: 'Lỗi tạo đơn hàng' });
  }
});

// Admin manual approval for mismatched description / transfer note
app.post('/api/orders/approve-manual', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId, note } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã đơn hàng' });
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    const order = orderDoc.data() as Order;
    const now = new Date().toISOString();
    const approvedBy = req.user!.email || 'Admin';

    // Extend 12 months from now
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Use transaction to ensure consistency
    await adminDb.runTransaction(async t => {
      t.update(orderRef, {
        status: 'manual_approved',
        approvedBy,
        approvedAt: now,
        proofNote: note || `Được phê duyệt thủ công bởi ${approvedBy}`,
      });

      // Update user plan
      const userRef = adminDb.collection('users').doc(order.userId);
      t.set(
        userRef,
        {
          plan: order.planId,
          planExpiresAt: oneYearLater,
        },
        { merge: true }
      );

      // Record payment document
      const paymentRef = adminDb.collection('payments').doc(`pay-manual-${order.id}`);
      t.set(paymentRef, {
        id: `pay-manual-${order.id}`,
        orderId: order.id,
        transactionId: `manual-${Date.now()}`,
        amount: order.amount,
        content: `Duyệt tay bởi ${approvedBy}: ${note || ''}`,
        gateway: 'Manual-Approval',
        createdAt: now,
        userId: order.userId,
      });
    });

    // Send emails
    sendOrderPaidEmails({
      orderId: order.id,
      userEmail: order.userEmail,
      userName: order.userName,
      planName: order.planId,
      amount: order.amount,
      bankReference: order.bankReference,
      paidAt: now,
      expiresAt: oneYearLater,
    }).catch(e => console.error('Email dispatch error on manual approve:', e));

    const fresh = await orderRef.get();
    res.json({ success: true, order: { id: fresh.id, ...fresh.data() } });
  } catch (err: any) {
    console.error('Error approving order manually:', err);
    res.status(500).json({ success: false, message: 'Lỗi duyệt đơn hàng thủ công' });
  }
});

// POST /api/webhooks/sepay: Webhook handler for SePay automatic payment processing
app.post('/api/webhooks/sepay', async (req, res) => {
  try {
    const expectedKey = process.env.SEPAY_WEBHOOK_KEY;
    const authHeader = req.headers.authorization;

    // Strict Authorization check if configured
    if (expectedKey) {
      if (authHeader !== `Apikey ${expectedKey}` && authHeader !== expectedKey) {
        console.warn('[SePay Webhook] Unauthorized attempt with header:', authHeader);
        return res.status(401).json({ success: false, message: 'Unauthorized webhook key' });
      }
    }

    const payload = req.body;
    console.log('[SePay Webhook] Received payload:', JSON.stringify(payload));

    // Only process incoming money
    const transferType = payload.transferType || 'in';
    const amountIn = Number(payload.transferAmount || payload.amount || 0);

    if (transferType !== 'in' || amountIn <= 0) {
      console.log('[SePay Webhook] Ignored non-incoming transaction');
      return res.json({ success: true, message: 'Giao dịch không phải nạp tiền, bỏ qua' });
    }

    // Search for reference code TOP[A-Z0-9]{6}
    const combinedContent = `${payload.content || ''} ${payload.description || ''} ${payload.code || ''}`.toUpperCase();
    const codeMatch = combinedContent.match(/TOP[A-Z0-9]{6}/i);

    if (!codeMatch) {
      console.log('[SePay Webhook] No matching TOP reference code in content:', combinedContent);
      return res.json({ success: true, message: 'Không tìm thấy mã đơn hàng TOP...' });
    }

    const refCode = codeMatch[0].toUpperCase();
    console.log(`[SePay Webhook] Found reference code: ${refCode}`);

    // Query pending order with this bankReference
    const orderSnap = await adminDb.collection('orders').where('bankReference', '==', refCode).limit(1).get();
    if (orderSnap.empty) {
      console.warn(`[SePay Webhook] No order found with reference code ${refCode}`);
      return res.json({ success: true, message: `Không tìm thấy đơn hàng tương ứng với mã ${refCode}` });
    }

    const orderDoc = orderSnap.docs[0];
    const orderData = orderDoc.data() as Order;

    // Check amount
    if (amountIn < orderData.amount) {
      console.warn(`[SePay Webhook] Amount transferred ${amountIn} is less than order amount ${orderData.amount}`);
      return res.json({ success: true, message: 'Số tiền chuyển khoản không đủ' });
    }

    // Check transaction idempotency
    const sepayTxId = String(payload.id || payload.transactionId || `tx-${Date.now()}`);
    const existingPayment = await adminDb.collection('payments').doc(sepayTxId).get();
    if (existingPayment.exists) {
      console.log(`[SePay Webhook] Transaction ${sepayTxId} has already been processed.`);
      return res.json({ success: true, message: 'Giao dịch đã được xử lý trước đó' });
    }

    const now = new Date().toISOString();
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    // Run atomic transaction: Order -> paid, log payments, User plan upgrade
    await adminDb.runTransaction(async t => {
      t.update(orderDoc.ref, {
        status: 'paid',
        paidAt: now,
        sepayTransactionId: sepayTxId,
        proofNote: `Tự động xác nhận qua SePay TPBank (${sepayTxId})`,
      });

      const paymentRef = adminDb.collection('payments').doc(sepayTxId);
      t.set(paymentRef, {
        id: sepayTxId,
        orderId: orderDoc.id,
        transactionId: sepayTxId,
        amount: amountIn,
        content: payload.content || '',
        gateway: 'SePay-TPBank',
        createdAt: now,
        userId: orderData.userId,
      });

      const userRef = adminDb.collection('users').doc(orderData.userId);
      t.set(
        userRef,
        {
          plan: orderData.planId,
          planExpiresAt: oneYearLater,
        },
        { merge: true }
      );
    });

    console.log(`[SePay Webhook] Successfully processed order ${orderDoc.id} for user ${orderData.userId}`);

    // Trigger emails asynchronously
    sendOrderPaidEmails({
      orderId: orderDoc.id,
      userEmail: orderData.userEmail,
      userName: orderData.userName,
      planName: orderData.planId,
      amount: amountIn,
      bankReference: refCode,
      paidAt: now,
      expiresAt: oneYearLater,
    }).catch(e => console.error('[SePay Webhook] Email error:', e));

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[SePay Webhook] Error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Lỗi xử lý webhook' });
  }
});

// ==========================================
// ADMIN CRM & CUSTOMER MANAGEMENT
// ==========================================

// GET /api/admin/users: Customer list with search & filters
app.get('/api/admin/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, plan } = req.query;

    const snapshot = await adminDb.collection('users').get();
    let users: User[] = [];

    snapshot.forEach(doc => {
      users.push({ id: doc.id, ...doc.data() } as User);
    });

    // Filter by plan
    if (plan && plan !== 'all') {
      users = users.filter(u => u.plan === plan);
    }

    // Search by email or name
    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      users = users.filter(u =>
        (u.email || '').toLowerCase().includes(q) ||
        (u.name || u.displayName || '').toLowerCase().includes(q)
      );
    }

    users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate aggregated revenue
    const ordersSnap = await adminDb.collection('orders').where('status', 'in', ['paid', 'manual_approved', 'completed']).get();
    let totalRevenue = 0;
    ordersSnap.forEach(o => {
      totalRevenue += Number(o.data().amount || 0);
    });

    res.json({
      success: true,
      users,
      totalUsers: users.length,
      totalRevenue,
    });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách khách hàng' });
  }
});

// CSV Export for Customers
app.get('/api/admin/export/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await adminDb.collection('users').get();
    const rows = ['"UID","Email","Tên Hiển Thị","Gói Dịch Vụ","Hạn Dùng","Ngày Tạo","Đăng Nhập Cuối","Đã Đồng Ý Điều Khoản"'];

    snapshot.forEach(doc => {
      const u = doc.data();
      rows.push([
        `"${doc.id}"`,
        `"${u.email || ''}"`,
        `"${(u.displayName || u.name || '').replace(/"/g, '""')}"`,
        `"${u.plan || 'free'}"`,
        `"${u.planExpiresAt || 'Không giới hạn'}"`,
        `"${u.createdAt || ''}"`,
        `"${u.lastLoginAt || ''}"`,
        `"${u.acceptedTermsAt || 'Chưa'}"`,
      ].join(','));
    });

    const csv = '\uFEFF' + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="THIEPONL_KhachHang_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi xuất CSV khách hàng' });
  }
});

// CSV Export for Orders
app.get('/api/admin/export/orders', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const snapshot = await adminDb.collection('orders').get();
    const rows = ['"Mã Đơn","Email Khách","Tên Khách","Gói","Số Tiền","Trạng Thái","Mã CK","Ngày Tạo","Người Duyệt"'];

    snapshot.forEach(doc => {
      const o = doc.data();
      rows.push([
        `"${doc.id}"`,
        `"${o.userEmail || ''}"`,
        `"${(o.userName || '').replace(/"/g, '""')}"`,
        `"${o.planId || ''}"`,
        `"${o.amount || 0}"`,
        `"${o.status || ''}"`,
        `"${o.bankReference || ''}"`,
        `"${o.createdAt || ''}"`,
        `"${o.approvedBy || 'Tự động'}"`,
      ].join(','));
    });

    const csv = '\uFEFF' + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="THIEPONL_DonHang_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csv);
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Lỗi xuất CSV đơn hàng' });
  }
});

// ==========================================
// VITE SPA DEV & STATIC SERVING
// ==========================================

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THIEPONL Full-Stack Production Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
