export type TemplateCategory =
  | 'pastel'
  | 'korean'
  | 'floral'
  | 'minimal'
  | 'champagne'
  | 'vintage'
  | 'traditional'
  | 'modern'
  | 'lavender'
  | 'sage'
  | 'blossom'
  | 'classic';

export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
}

export interface DesignConfig {
  fontHeading: string;
  fontBody: string;
  fontScript?: string;
  palette: ColorPalette;
  ornamentStyle: 'botanical' | 'minimal-lines' | 'vintage-flourish' | 'traditional-knot' | 'sparkle' | 'none';
  envelopeColor: string;
  envelopeLiningColor: string;
  envelopeTexture?: string;
  sealColor: string;
  sealInitial?: string;
  heroLayout: 'centered' | 'split-left' | 'split-right' | 'card-overlay' | 'editorial';
  backgroundPattern?: 'none' | 'dots' | 'floral-corners' | 'arch-glow' | 'paper-texture';
  musicPreset?: string;
  /**
   * Thiết kế minh họa gốc (bộ sưu tập cao cấp). Khi có giá trị, thiệp hiển thị
   * bằng InvitationArtCard (SVG + chữ HTML) thay cho ảnh bìa mặc định.
   * Trường tùy chọn: các mẫu cũ và thiệp đã lưu không bị ảnh hưởng.
   */
  motif?: TemplateMotif;
}

export type MotifId =
  | 'song-hy'
  | 'long-phung'
  | 'minimal-monogram'
  | 'thanh-diep'
  | 'lien-hoa'
  | 'vuon-kinh'
  | 'baroque'
  | 'santorini'
  | 'bach-su'
  | 'nhat-binh'
  | 'chibi'
  | 'hoa-kho';

export interface TemplateMotif {
  id: MotifId;
  /** Biến thể chi tiết trang trí trong cùng ngôn ngữ thiết kế (vd. 'v2', 'dark'). */
  variant?: string;
  /** Màu nền của tấm thiệp minh họa. */
  ground: string;
  /** Màu chủ đạo của họa tiết & tên cô dâu chú rể. */
  ink: string;
  /** Màu ánh kim / nhấn cho đường viền, hoa văn. */
  metal: string;
  /** Màu phụ (cánh hoa, lá, mảng nhẹ). */
  soft?: string;
  /** Màu chữ thông tin (ngày, địa điểm). Mặc định tự chọn theo độ tương phản. */
  text?: string;
}

/** 6 nhóm chủ đề của bộ sưu tập cao cấp. */
export type TemplateCollection =
  | 'truyen-thong'
  | 'toi-gian'
  | 'hoa-la'
  | 'hoang-gia'
  | 'co-phuc'
  | 'nghe-thuat';

export type ColorTag =
  | 'do'
  | 'hong'
  | 'xanh-la'
  | 'xanh-duong'
  | 'vang'
  | 'trung-tinh'
  | 'tim'
  | 'cam'
  | 'den';

export interface WeddingTemplate {
  id: string;
  name: string;
  slug: string;
  category: TemplateCategory;
  style: string;
  colorPalette: ColorPalette;
  thumbnail: string;
  preview: string;
  description: string;
  isPremium: boolean;
  design: DesignConfig;
  defaultInvitationMessage: string;
  defaultThankYouMessage: string;
  // ---- Metadata bổ sung (tùy chọn, chỉ dùng cho bộ sưu tập mới) ----
  collection?: TemplateCollection;
  colorTags?: ColorTag[];
  /** Tên màu hiển thị, vd. "Đỏ son". */
  colorName?: string;
  /** Chỉ hiển thị khi 'published'. Mẫu cũ không có trường này được coi là đã xuất bản. */
  status?: 'published' | 'draft';
  sortOrder?: number;
  featured?: boolean;
}

export interface LoveStoryItem {
  id: string;
  yearOrDate: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  icon?: string;
}

export interface GiftBankInfo {
  enabled: boolean;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
  note?: string;
  qrOverrideUrl?: string;
}

export interface SectionsVisibility {
  cover: boolean;
  countdown: boolean;
  parents: boolean;
  eventInfo: boolean;
  loveStory: boolean;
  timeline: boolean;
  gallery: boolean;
  rsvp: boolean;
  wishes: boolean;
  giftBox: boolean;
  map: boolean;
}

export interface WeddingInvitation {
  id: string;
  slug: string;
  userId: string;
  title: string;
  status: 'draft' | 'pending_payment' | 'published' | 'expired';
  isPaid?: boolean;
  selectedPlanId?: 'free' | 'premium' | 'luxury';
  orderId?: string;
  publishedAt?: string;
  templateId: string;
  brideName: string;
  groomName: string;
  brideTitle?: string; // e.g. Cô dâu
  groomTitle?: string; // e.g. Chú rể
  brideParents?: {
    father: string;
    mother: string;
  };
  groomParents?: {
    father: string;
    mother: string;
  };
  weddingDate: string; // YYYY-MM-DD
  weddingTime: string; // HH:mm
  lunarDate?: string; // Ngày âm lịch
  venueName: string;
  venueAddress: string;
  mapUrl?: string;
  invitationMessage: string;
  thankYouMessage: string;
  coverImage: string;
  galleryImages: string[];
  musicUrl?: string;
  design: DesignConfig;
  sectionsVisibility: SectionsVisibility;
  loveStories: LoveStoryItem[];
  timelineEvents: TimelineEvent[];
  giftBank: GiftBankInfo;
  viewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  invitationId: string;
  name: string;
  group: 'family' | 'bride_friends' | 'groom_friends' | 'colleagues' | 'other';
  email?: string;
  phone?: string;
  personalToken: string;
  rsvpStatus: 'pending' | 'attending' | 'declined';
  attendeesCount: number;
  note?: string;
  createdAt: string;
}

export interface RSVP {
  id: string;
  invitationId: string;
  guestName: string;
  phone?: string;
  isAttending: boolean;
  attendeesCount: number;
  side: 'groom' | 'bride' | 'mutual';
  dietaryNote?: string;
  message?: string;
  createdAt: string;
}

export interface Wish {
  id: string;
  invitationId: string;
  senderName: string;
  senderRelation: string;
  message: string;
  createdAt: string;
  isApproved: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  plan: 'free' | 'premium' | 'luxury';
  planExpiresAt?: string;
  avatar?: string;
  theme?: 'light' | 'dark' | 'system';
  createdAt: string;
  lastLoginAt?: string;
  acceptedTermsAt?: string;
}

export interface PricingPlan {
  id: 'free' | 'premium' | 'luxury';
  name: string;
  price: number;
  priceFormatted: string;
  badge?: string;
  description: string;
  features: string[];
  maxInvitations: number;
  maxPhotos: number;
  aiGenerations: number;
  isPopular?: boolean;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: 'free' | 'premium' | 'luxury';
  amount: number;
  status: 'pending' | 'completed' | 'paid' | 'cancelled' | 'manual_approved';
  bankReference: string;
  proofNote?: string;
  invitationId?: string;
  invitationTitle?: string;
  invitationSlug?: string;
  createdAt: string;
  expiresAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Payment {
  id: string;
  orderId: string;
  transactionId: string;
  amount: number;
  content: string;
  gateway: string;
  createdAt: string;
}

export interface AIDesignProposal {
  id: string;
  title: string;
  concept: string;
  styleName: string;
  palette: ColorPalette;
  fontHeading: string;
  fontBody: string;
  heroLayout: 'centered' | 'split-left' | 'split-right' | 'card-overlay' | 'editorial';
  invitationMessage: string;
  ornamentStyle: 'botanical' | 'minimal-lines' | 'vintage-flourish' | 'traditional-knot' | 'sparkle' | 'none';
  previewColor: string;
}

export interface AdminAction {
  id: string;
  adminEmail: string;
  adminName?: string;
  action: 'free_publish' | 'manual_approve';
  invitationId?: string;
  invitationTitle?: string;
  invitationSlug?: string;
  assignedPlan: 'free' | 'premium' | 'luxury';
  timestamp: string;
  note?: string;
}

