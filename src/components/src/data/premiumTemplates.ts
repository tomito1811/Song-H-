/**
 * BỘ SƯU TẬP THIỆP CAO CẤP THIEPONL (mở rộng thư viện).
 *
 * - Không sửa / xóa mẫu cũ trong templates.ts; danh sách này được nối thêm phía sau.
 * - Mỗi mẫu dùng đúng schema WeddingTemplate + các trường tùy chọn (collection, colorTags,
 *   status, sortOrder, featured) và design.motif để trình biên tập mở & chỉnh sửa được.
 * - thumbnail / preview là ảnh render thật từ chính InvitationArtCard
 *   (xem tools/template-thumbs). Chạy lại công cụ đó sau khi sửa motif để ảnh luôn đồng nhất.
 * - Chỉ mẫu có status 'published' mới được hiển thị. Thêm mẫu mới: đặt 'draft' trước,
 *   render ảnh, kiểm thử, rồi mới chuyển sang 'published'.
 */
import type {
  WeddingTemplate,
  ColorPalette,
  TemplateMotif,
  TemplateCategory,
  TemplateCollection,
  ColorTag,
  DesignConfig,
} from '../types/wedding';

export const TEMPLATE_COLLECTIONS: { id: TemplateCollection; label: string; short: string }[] = [
  { id: 'truyen-thong', label: 'Truyền Thống – Rồng Phụng – Chữ Hỷ', short: 'Truyền thống' },
  { id: 'toi-gian', label: 'Tối Giản – Thanh Lịch', short: 'Tối giản' },
  { id: 'hoa-la', label: 'Hoa Lá – Hoa Sen – Thiên Nhiên', short: 'Hoa lá' },
  { id: 'hoang-gia', label: 'Sang Trọng – Hoàng Gia – Châu Âu', short: 'Hoàng gia' },
  { id: 'co-phuc', label: 'Cổ Phục – Văn Hóa – Họa Tiết', short: 'Cổ phục' },
  { id: 'nghe-thuat', label: 'Dễ Thương – Nghệ Thuật', short: 'Nghệ thuật' },
];

export const COLOR_TAGS: { id: ColorTag; label: string; swatch: string }[] = [
  { id: 'do', label: 'Đỏ', swatch: '#A61B29' },
  { id: 'hong', label: 'Hồng', swatch: '#D98CA0' },
  { id: 'xanh-la', label: 'Xanh lá', swatch: '#4F6F52' },
  { id: 'xanh-duong', label: 'Xanh dương', swatch: '#1F4E8C' },
  { id: 'vang', label: 'Vàng', swatch: '#C9A227' },
  { id: 'cam', label: 'Cam', swatch: '#C2643B' },
  { id: 'tim', label: 'Tím', swatch: '#6B3E75' },
  { id: 'trung-tinh', label: 'Trung tính', swatch: '#CDBFAE' },
  { id: 'den', label: 'Đen huyền', swatch: '#15110F' },
];

interface Spec {
  id: string;
  name: string;
  slug: string;
  collection: TemplateCollection;
  category: TemplateCategory;
  style: string;
  colorName: string;
  colorTags: ColorTag[];
  description: string;
  isPremium: boolean;
  motif: TemplateMotif;
  /** Bảng màu trang web thiệp (phần nội dung nền trắng) – primary phải đọc rõ trên nền trắng. */
  page: ColorPalette;
  fontHeading: string;
  fontScript?: string;
  ornamentStyle: DesignConfig['ornamentStyle'];
  envelope: [string, string];
  seal: string;
  invitation: string;
  thanks: string;
  sortOrder: number;
  featured?: boolean;
  status: 'published' | 'draft';
}

const asset = (slug: string, kind: 'thumb' | 'preview') =>
  `${import.meta.env.BASE_URL}assets/templates/${slug}-${kind}.webp`;

function build(s: Spec): WeddingTemplate {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    category: s.category,
    style: s.style,
    colorPalette: s.page,
    thumbnail: asset(s.slug, 'thumb'),
    preview: asset(s.slug, 'preview'),
    description: s.description,
    isPremium: s.isPremium,
    design: {
      fontHeading: s.fontHeading,
      fontBody: 'Plus Jakarta Sans, sans-serif',
      fontScript: s.fontScript || 'Great Vibes, cursive',
      palette: s.page,
      ornamentStyle: s.ornamentStyle,
      envelopeColor: s.envelope[0],
      envelopeLiningColor: s.envelope[1],
      sealColor: s.seal,
      heroLayout: 'centered',
      backgroundPattern: 'none',
      motif: s.motif,
    },
    defaultInvitationMessage: s.invitation,
    defaultThankYouMessage: s.thanks,
    collection: s.collection,
    colorTags: s.colorTags,
    colorName: s.colorName,
    status: s.status,
    sortOrder: s.sortOrder,
    featured: s.featured,
  };
}

const CORMORANT = 'Cormorant Garamond, serif';
const PLAYFAIR = 'Playfair Display, Georgia, serif';

const MSG_TRAD =
  'Nhân duyên tiền định, hai họ kết giao. Gia đình chúng tôi trân trọng kính mời quý khách đến dự buổi tiệc chung vui cùng hai cháu.';
const THANK_TRAD = 'Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi.';

const SPECS: Spec[] = [
  /* ============ NHÓM 1: TRUYỀN THỐNG ============ */
  {
    id: 'tpl-lux-song-hy-do',
    name: 'Song Hỷ – Đỏ',
    slug: 'song-hy-do',
    collection: 'truyen-thong',
    category: 'traditional',
    style: 'Song Hỷ Truyền Thống',
    colorName: 'Đỏ son · Vàng kim',
    colorTags: ['do', 'vang'],
    description: 'Chữ Hỷ khắc âm trên huy chương ánh kim, nền đỏ son dệt gấm hoa thị, góc khung mây cuộn cung đình.',
    isPremium: false,
    motif: { id: 'song-hy', ground: '#A3131F', ink: '#A3131F', metal: '#D9B25F', text: '#FBEBD0' },
    page: { primary: '#9E1622', secondary: '#E9C9A0', background: '#FBF4EA', surface: '#FDF3EE', text: '#3B2422', accent: '#B8892F' },
    fontHeading: CORMORANT,
    ornamentStyle: 'traditional-knot',
    envelope: ['#A3131F', '#F6E2C0'],
    seal: '#B8892F',
    invitation: MSG_TRAD,
    thanks: THANK_TRAD,
    sortOrder: 101,
    featured: true,
    status: 'published',
  },
  {
    id: 'tpl-lux-long-phung-huyen',
    name: 'Long Phụng – Huyền',
    slug: 'long-phung-huyen',
    collection: 'truyen-thong',
    category: 'traditional',
    style: 'Long Phụng Cao Cấp',
    colorName: 'Đen huyền · Vàng kim',
    colorTags: ['den', 'vang'],
    description: 'Rồng phụng sum vầy quanh huy chương chữ Hỷ, nét vàng kim mảnh trên nền đen huyền – phiên bản luxury trang trọng.',
    isPremium: true,
    motif: { id: 'long-phung', ground: '#15110F', ink: '#15110F', metal: '#CDA349', text: '#F3E6C8' },
    page: { primary: '#7A5A1E', secondary: '#E8D6A8', background: '#F7F2E8', surface: '#FAF6EE', text: '#231C14', accent: '#A8823A' },
    fontHeading: CORMORANT,
    ornamentStyle: 'traditional-knot',
    envelope: ['#1C1714', '#E8D6A8'],
    seal: '#A8823A',
    invitation: MSG_TRAD,
    thanks: THANK_TRAD,
    sortOrder: 102,
    featured: true,
    status: 'published',
  },

  /* ============ NHÓM 2: TỐI GIẢN ============ */
  {
    id: 'tpl-lux-minimal-do-dam',
    name: 'Minimalism – Đỏ đậm',
    slug: 'minimalism-do-dam',
    collection: 'toi-gian',
    category: 'minimal',
    style: 'Minimal Monogram',
    colorName: 'Đỏ rượu vang · Trắng ngà',
    colorTags: ['do', 'trung-tinh'],
    description: 'Nền trắng ngà, chữ đỏ rượu vang, monogram tên viết tắt và khung chỉ mảnh – tinh giản mà sang.',
    isPremium: false,
    motif: { id: 'minimal-monogram', ground: '#FBF6EE', ink: '#6E1423', metal: '#B08A57', text: '#3A2226' },
    page: { primary: '#6E1423', secondary: '#E7D3C6', background: '#FBF6EE', surface: '#F8F0EA', text: '#2E2224', accent: '#8A2A39' },
    fontHeading: PLAYFAIR,
    ornamentStyle: 'minimal-lines',
    envelope: ['#F3E7DC', '#FBF6EE'],
    seal: '#6E1423',
    invitation: 'Chúng tôi trân trọng kính mời bạn đến chung vui trong ngày chúng tôi chính thức về chung một nhà.',
    thanks: 'Cảm ơn bạn đã là một phần trong câu chuyện của chúng tôi.',
    sortOrder: 201,
    featured: true,
    status: 'published',
  },
  {
    id: 'tpl-lux-thanh-diep-xanh',
    name: 'Thanh Diệp – Xanh',
    slug: 'thanh-diep-xanh',
    collection: 'toi-gian',
    category: 'sage',
    style: 'Botanical Minimal',
    colorName: 'Xanh olive · Kem',
    colorTags: ['xanh-la', 'trung-tinh'],
    description: 'Nhành lá olive vắt qua khung vòm, nền xanh sage dịu, bố cục thoáng cho đám cưới ngoài trời.',
    isPremium: false,
    motif: { id: 'thanh-diep', ground: '#DCE4D3', ink: '#4F6B45', metal: '#9C8A5A', soft: '#F7F5EE', text: '#2F3A2B' },
    page: { primary: '#46613E', secondary: '#D5DFCB', background: '#F4F6EF', surface: '#EEF2E8', text: '#2B3328', accent: '#6E8A5F' },
    fontHeading: CORMORANT,
    fontScript: 'Alex Brush, cursive',
    ornamentStyle: 'botanical',
    envelope: ['#DCE4D3', '#F7F5EE'],
    seal: '#4F6B45',
    invitation: 'Giữa đất trời xanh mát, chúng tôi nắm tay nhau bắt đầu chương mới. Rất mong bạn đến chung vui.',
    thanks: 'Cảm ơn bạn đã gửi đến chúng tôi những lời chúc ấm áp nhất.',
    sortOrder: 202,
    status: 'published',
  },

  /* ============ NHÓM 3: HOA LÁ ============ */
  {
    id: 'tpl-lux-lien-hoa-hong',
    name: 'Liên Hoa – Hồng',
    slug: 'lien-hoa-hong',
    collection: 'hoa-la',
    category: 'floral',
    style: 'Hoa Sen Thuần Việt',
    colorName: 'Hồng sen · Xanh ngọc',
    colorTags: ['hong', 'xanh-la'],
    description: 'Đóa sen hồng nở trên mặt hồ, lá sen xanh ngọc và khung vòm ánh kim – thanh khiết, đậm chất Việt.',
    isPremium: true,
    motif: { id: 'lien-hoa', ground: '#F8E4E6', ink: '#C24D6E', metal: '#B48A4C', soft: '#6E9C86', text: '#4A2A33' },
    page: { primary: '#A83B5B', secondary: '#F1CFD8', background: '#FDF6F6', surface: '#FBEFF1', text: '#3F2A30', accent: '#C24D6E' },
    fontHeading: CORMORANT,
    ornamentStyle: 'botanical',
    envelope: ['#F3D2DA', '#FDF6F6'],
    seal: '#C24D6E',
    invitation: 'Như đóa sen vươn lên thanh khiết, tình yêu của chúng tôi đã nở hoa. Trân trọng kính mời quý khách.',
    thanks: 'Xin chân thành cảm ơn tấm lòng của quý khách.',
    sortOrder: 301,
    featured: true,
    status: 'published',
  },
  {
    id: 'tpl-lux-vuon-kinh-xanh',
    name: 'Vườn Kính – Xanh',
    slug: 'vuon-kinh-xanh',
    collection: 'hoa-la',
    category: 'floral',
    style: 'Glasshouse Garden',
    colorName: 'Xanh lục bảo · Kem',
    colorTags: ['xanh-la', 'trung-tinh'],
    description: 'Khung nhà kính vòm sắt xanh lục bảo, dây leo và hoa nhỏ – vườn cổ tích hiện đại.',
    isPremium: true,
    motif: { id: 'vuon-kinh', ground: '#FBF7EE', ink: '#1F5C4A', metal: '#C7975A', soft: '#CFE3D8', text: '#22362F' },
    page: { primary: '#1F5C4A', secondary: '#CFE3D8', background: '#F6F8F3', surface: '#EEF4EF', text: '#22302B', accent: '#2E7A62' },
    fontHeading: PLAYFAIR,
    ornamentStyle: 'botanical',
    envelope: ['#CFE3D8', '#FBF7EE'],
    seal: '#1F5C4A',
    invitation: 'Trong khu vườn của yêu thương, chúng tôi trân trọng mời bạn cùng chứng kiến lời hẹn ước.',
    thanks: 'Cảm ơn bạn đã đến và làm khu vườn của chúng tôi thêm rộn ràng.',
    sortOrder: 302,
    status: 'published',
  },

  /* ============ NHÓM 4: HOÀNG GIA ============ */
  {
    id: 'tpl-lux-baroque-vang',
    name: 'Baroque – Vàng',
    slug: 'baroque-vang',
    collection: 'hoang-gia',
    category: 'champagne',
    style: 'Baroque Hoàng Gia',
    colorName: 'Vàng champagne · Trắng ngà',
    colorTags: ['vang', 'trung-tinh'],
    description: 'Khung cartouche Baroque đối xứng, lá ô-rô và hoa góc dập nổi ánh champagne trên nền giấy mỹ thuật.',
    isPremium: true,
    motif: { id: 'baroque', ground: '#F4ECDD', ink: '#5B4421', metal: '#B8934A', text: '#3E3020' },
    page: { primary: '#7A5A22', secondary: '#EAD9B6', background: '#FAF6EE', surface: '#F7F0E2', text: '#2F271C', accent: '#A07B35' },
    fontHeading: CORMORANT,
    ornamentStyle: 'vintage-flourish',
    envelope: ['#EAD9B6', '#FAF6EE'],
    seal: '#A07B35',
    invitation: 'Trân trọng kính mời quý khách đến dự tiệc cưới và chung vui cùng gia đình chúng tôi.',
    thanks: 'Sự hiện diện của quý khách là món quà quý giá nhất.',
    sortOrder: 401,
    featured: true,
    status: 'published',
  },
  {
    id: 'tpl-lux-santorini-lam',
    name: 'Santorini – Lam',
    slug: 'santorini-lam',
    collection: 'hoang-gia',
    category: 'modern',
    style: 'Địa Trung Hải',
    colorName: 'Xanh sapphire · Trắng',
    colorTags: ['xanh-duong', 'trung-tinh'],
    description: 'Khung cửa vòm trắng nhìn ra làng mái vòm xanh sapphire và biển chiều – lãng mạn kiểu Địa Trung Hải.',
    isPremium: true,
    motif: { id: 'santorini', ground: '#DCE9F5', ink: '#1F4E8C', metal: '#E3B25B', soft: '#C2457A', text: '#1E2F45' },
    page: { primary: '#1F4E8C', secondary: '#D2E2F2', background: '#F5F8FC', surface: '#EDF3FA', text: '#1E2A3A', accent: '#2C64AD' },
    fontHeading: PLAYFAIR,
    ornamentStyle: 'minimal-lines',
    envelope: ['#D2E2F2', '#FFFFFF'],
    seal: '#1F4E8C',
    invitation: 'Bên bờ biển xanh và những mái vòm trắng, chúng tôi muốn có bạn cùng chung vui ngày hạnh phúc.',
    thanks: 'Cảm ơn bạn đã cùng chúng tôi viết nên kỷ niệm đẹp nhất.',
    sortOrder: 402,
    status: 'published',
  },

  /* ============ NHÓM 5: CỔ PHỤC ============ */
  {
    id: 'tpl-lux-bach-su-lam',
    name: 'Bạch Sứ – Lam',
    slug: 'bach-su-lam',
    collection: 'co-phuc',
    category: 'traditional',
    style: 'Gốm Lam Trắng',
    colorName: 'Lam gốm sứ · Trắng ngà',
    colorTags: ['xanh-duong', 'trung-tinh'],
    description: 'Đĩa sứ men lam với dải cánh sen, hồi văn và mẫu đơn vẽ tay – cảm hứng gốm cổ Việt.',
    isPremium: false,
    motif: { id: 'bach-su', ground: '#F3F5F7', ink: '#1E3F8A', metal: '#1E3F8A', text: '#1B2A4E' },
    page: { primary: '#1E3F8A', secondary: '#D6DEEE', background: '#F6F8FB', surface: '#EEF2F9', text: '#1B2438', accent: '#2C57B0' },
    fontHeading: CORMORANT,
    ornamentStyle: 'vintage-flourish',
    envelope: ['#D6DEEE', '#FFFFFF'],
    seal: '#1E3F8A',
    invitation: MSG_TRAD,
    thanks: THANK_TRAD,
    sortOrder: 501,
    featured: true,
    status: 'published',
  },
  {
    id: 'tpl-lux-nhat-binh-do',
    name: 'Nhật Bình – Đỏ',
    slug: 'nhat-binh-do',
    collection: 'co-phuc',
    category: 'traditional',
    style: 'Cổ Phục Cung Đình',
    colorName: 'Đỏ trầm · Vàng kim',
    colorTags: ['do', 'vang'],
    description: 'Hai vạt cổ áo Nhật Bình thêu hoa văn ánh kim trên nền đỏ trầm – tôn vinh cổ phục cung đình triều Nguyễn.',
    isPremium: true,
    motif: { id: 'nhat-binh', ground: '#8E1B22', ink: '#8E1B22', metal: '#D6AE5C', soft: '#6E1218', text: '#FBEBD0' },
    page: { primary: '#8E1B22', secondary: '#EBCDA3', background: '#FBF4EA', surface: '#FCF1EC', text: '#3A2220', accent: '#B4863A' },
    fontHeading: CORMORANT,
    ornamentStyle: 'traditional-knot',
    envelope: ['#8E1B22', '#F4DFC0'],
    seal: '#B4863A',
    invitation: MSG_TRAD,
    thanks: THANK_TRAD,
    sortOrder: 502,
    status: 'published',
  },

  /* ============ NHÓM 6: NGHỆ THUẬT ============ */
  {
    id: 'tpl-lux-chibi-do',
    name: 'Chibi – Đỏ',
    slug: 'chibi-do',
    collection: 'nghe-thuat',
    category: 'modern',
    style: 'Chibi Áo Dài',
    colorName: 'Đỏ san hô · Kem',
    colorTags: ['do', 'hong'],
    description: 'Cặp đôi chibi áo dài khăn đóng, má hồng và trái tim bay – vui tươi, đáng yêu cho đám cưới trẻ.',
    isPremium: false,
    motif: { id: 'chibi', ground: '#FFF4EA', ink: '#D2453E', metal: '#E2A93B', soft: '#FBD9CF', text: '#4A2723' },
    page: { primary: '#C23B35', secondary: '#FBD9CF', background: '#FFF8F2', surface: '#FFF0E8', text: '#3F2522', accent: '#D2453E' },
    fontHeading: 'Dancing Script, cursive',
    fontScript: 'Dancing Script, cursive',
    ornamentStyle: 'sparkle',
    envelope: ['#FBD9CF', '#FFF4EA'],
    seal: '#D2453E',
    invitation: 'Sau bao ngày thương nhau, tụi mình quyết định về chung một nhà! Đến chung vui với tụi mình nhé!',
    thanks: 'Cảm ơn bạn thật nhiều vì đã đến chung vui cùng tụi mình!',
    sortOrder: 601,
    featured: true,
    status: 'published',
  },
  {
    id: 'tpl-lux-hoa-kho-cam',
    name: 'Hoa Khô – Cam',
    slug: 'hoa-kho-cam',
    collection: 'nghe-thuat',
    category: 'vintage',
    style: 'Boho Hoa Khô',
    colorName: 'Cam đất · Kraft',
    colorTags: ['cam', 'trung-tinh'],
    description: 'Bó lau sậy, lúa mì và cúc khô buộc nơ cam đất trên giấy kraft – mộc mạc, ấm áp kiểu boho.',
    isPremium: false,
    motif: { id: 'hoa-kho', ground: '#EADCC6', ink: '#B4532A', metal: '#A4834F', soft: '#8E9A7A', text: '#4A3022' },
    page: { primary: '#9C4624', secondary: '#EADCC6', background: '#FAF5EC', surface: '#F5EDE0', text: '#3A2A20', accent: '#B4532A' },
    fontHeading: 'Dancing Script, cursive',
    fontScript: 'Dancing Script, cursive',
    ornamentStyle: 'vintage-flourish',
    envelope: ['#EADCC6', '#FAF5EC'],
    seal: '#B4532A',
    invitation: 'Một chút nắng, một chút gió và rất nhiều yêu thương. Mời bạn đến chung vui cùng chúng mình.',
    thanks: 'Cảm ơn bạn đã mang niềm vui đến ngày đặc biệt của chúng mình.',
    sortOrder: 602,
    status: 'published',
  },
];

/* ================================================================== */
/* GIAI ĐOẠN 2 – Biến thể màu trên cùng ngôn ngữ thiết kế              */
/* Mỗi biến thể chọn bảng màu riêng (kiểm tra tương phản) và, khi phù  */
/* hợp, đổi chi tiết trang trí qua motif.variant.                       */
/* ================================================================== */
const byId = (id: string) => SPECS.find((s) => s.id === id)!;
type VariantOverride = Partial<Omit<Spec, 'motif'>> & { motif: Partial<TemplateMotif> } & Pick<Spec, 'id' | 'name' | 'slug' | 'colorName' | 'colorTags' | 'description' | 'sortOrder' | 'page' | 'envelope' | 'seal'>;
const variantOf = (baseId: string, o: VariantOverride): Spec => {
  const base = byId(baseId);
  return { ...base, featured: false, ...o, motif: { ...base.motif, ...o.motif } as TemplateMotif };
};

const VARIANTS: Spec[] = [
  variantOf('tpl-lux-song-hy-do', {
    id: 'tpl-lux-song-hy-xanh',
    name: 'Song Hỷ – Xanh',
    slug: 'song-hy-xanh',
    colorName: 'Xanh lục bảo · Vàng champagne',
    colorTags: ['xanh-la', 'vang'],
    description: 'Biến thể xanh lục bảo của Song Hỷ: huy chương champagne, gấm hoa thị và mây cuộn – trang trọng mà tươi mới.',
    motif: { ground: '#0F5A47', ink: '#0F5A47', metal: '#D8BE7A', text: '#F4EBD3' },
    page: { primary: '#0F5A47', secondary: '#D9E6DC', background: '#F4F7F2', surface: '#EDF3EE', text: '#1F2E28', accent: '#9C8340' },
    envelope: ['#0F5A47', '#EFE4C6'],
    seal: '#9C8340',
    sortOrder: 103,
  }),
  variantOf('tpl-lux-song-hy-do', {
    id: 'tpl-lux-song-hy-v2-do',
    name: 'Song Hỷ V2 – Đỏ',
    slug: 'song-hy-v2-do',
    colorName: 'Đỏ ruby · Vàng kim',
    colorTags: ['do', 'vang'],
    description: 'Phiên bản V2: chữ Hỷ lớn trong ô trám, dải hồi văn viền trên dưới và mây cuộn hai bên trên nền đỏ ruby.',
    motif: { variant: 'v2', ground: '#B0122E', ink: '#B0122E', metal: '#E0BC6A', text: '#FFF1DA' },
    page: { primary: '#A3122B', secondary: '#F0CFC0', background: '#FCF4EE', surface: '#FDF0EC', text: '#3B2124', accent: '#B8892F' },
    envelope: ['#B0122E', '#F7E3C3'],
    seal: '#B8892F',
    sortOrder: 104,
  }),
  variantOf('tpl-lux-long-phung-huyen', {
    id: 'tpl-lux-long-phung-do',
    name: 'Long Phụng – Đỏ',
    slug: 'long-phung-do',
    colorName: 'Đỏ trầm · Vàng kim',
    colorTags: ['do', 'vang'],
    isPremium: true,
    description: 'Rồng phụng chầu chữ Hỷ trên nền đỏ trầm dệt gấm – sắc đỏ hỷ sự truyền thống.',
    motif: { ground: '#7E1018', ink: '#7E1018', metal: '#DDB45E', text: '#FBEAD0' },
    page: { primary: '#7E1018', secondary: '#EBCDA3', background: '#FBF4EA', surface: '#FCF1EC', text: '#3A2220', accent: '#B4863A' },
    envelope: ['#7E1018', '#F4DFC0'],
    seal: '#B4863A',
    sortOrder: 105,
  }),
  variantOf('tpl-lux-long-phung-huyen', {
    id: 'tpl-lux-long-phung-lam',
    name: 'Long Phụng – Lam',
    slug: 'long-phung-lam',
    colorName: 'Xanh lam đậm · Vàng champagne',
    colorTags: ['xanh-duong', 'vang'],
    isPremium: true,
    description: 'Bản tối giản: bỏ nền gấm, giữ nét rồng phụng vàng champagne trên nền lam đậm như men lam cung đình.',
    motif: { variant: 'minimal', ground: '#13284F', ink: '#13284F', metal: '#D9BF82', text: '#EFE6CF' },
    page: { primary: '#1A3466', secondary: '#D3DCEC', background: '#F4F6FA', surface: '#ECF0F7', text: '#1A2233', accent: '#9C8345' },
    envelope: ['#13284F', '#E9DDBE'],
    seal: '#9C8345',
    sortOrder: 106,
  }),
  variantOf('tpl-lux-minimal-do-dam', {
    id: 'tpl-lux-minimal-nau',
    name: 'Minimalism – Nâu',
    slug: 'minimalism-nau',
    colorName: 'Nâu cacao · Kem',
    colorTags: ['trung-tinh'],
    description: 'Khung vòm chỉ mảnh, chữ nâu cacao trên nền kem – ấm áp, tối giản.',
    motif: { variant: 'arch', ground: '#F6EEE3', ink: '#5A3A2A', metal: '#B39069', text: '#3B2A22' },
    page: { primary: '#5A3A2A', secondary: '#E8D9C6', background: '#FAF5EE', surface: '#F5ECE1', text: '#30241E', accent: '#7C5640' },
    envelope: ['#EADBC8', '#F6EEE3'],
    seal: '#5A3A2A',
    sortOrder: 203,
  }),
  variantOf('tpl-lux-minimal-do-dam', {
    id: 'tpl-lux-minimal-lam-dam',
    name: 'Minimalism – Lam đậm',
    slug: 'minimalism-lam-dam',
    colorName: 'Xanh navy · Trắng ngà',
    colorTags: ['xanh-duong'],
    description: 'Phiên bản nền tối: navy sâu, chữ trắng ngà tương phản cao và khung chỉ champagne.',
    motif: { ground: '#14213D', ink: '#F4EEE2', metal: '#C9A96E', text: '#E9E3D6' },
    page: { primary: '#14213D', secondary: '#D5DAE6', background: '#F4F5F8', surface: '#ECEEF4', text: '#1A1F2B', accent: '#9C8455' },
    envelope: ['#14213D', '#F4EEE2'],
    seal: '#C9A96E',
    sortOrder: 204,
  }),
  variantOf('tpl-lux-minimal-do-dam', {
    id: 'tpl-lux-minimal-tim',
    name: 'Minimalism – Tím',
    slug: 'minimalism-tim',
    colorName: 'Tím mận · Trắng ngà',
    colorTags: ['tim'],
    description: 'Khung vòm thanh mảnh, monogram và chữ tím mận trên nền trắng ngà.',
    motif: { variant: 'arch', ground: '#FAF6F4', ink: '#5B2A57', metal: '#A98C9E', text: '#382234' },
    page: { primary: '#5B2A57', secondary: '#E6D6E2', background: '#FAF6F8', surface: '#F4ECF2', text: '#2E2230', accent: '#7A3F75' },
    envelope: ['#E9DCE6', '#FAF6F4'],
    seal: '#5B2A57',
    sortOrder: 205,
  }),
  variantOf('tpl-lux-vuon-kinh-xanh', {
    id: 'tpl-lux-vuon-kinh-hong',
    name: 'Vườn Kính – Hồng',
    slug: 'vuon-kinh-hong',
    colorName: 'Hồng đất · Kem',
    colorTags: ['hong', 'trung-tinh'],
    description: 'Nhà kính khung sắt hồng đất, kính phớt hồng phấn và dây leo – ngọt ngào kiểu vườn Anh.',
    motif: { ground: '#FCF6F1', ink: '#9E4A5C', metal: '#C98F6B', soft: '#F5D9DC', text: '#432A2F' },
    page: { primary: '#8E3F51', secondary: '#F5D9DC', background: '#FDF7F6', surface: '#FAEEEF', text: '#3A2A2D', accent: '#B05A6E' },
    envelope: ['#F5D9DC', '#FCF6F1'],
    seal: '#9E4A5C',
    sortOrder: 303,
  }),
  variantOf('tpl-lux-vuon-kinh-xanh', {
    id: 'tpl-lux-vuon-kinh-lam',
    name: 'Vườn Kính – Lam',
    slug: 'vuon-kinh-lam',
    colorName: 'Xanh teal · Trắng',
    colorTags: ['xanh-duong', 'xanh-la'],
    description: 'Nhà kính khung xanh teal, kính phớt xanh nước biển – tươi mát cho tiệc cưới ban ngày.',
    motif: { ground: '#F7FAFA', ink: '#1F5F73', metal: '#D49A5A', soft: '#CFE6EC', text: '#1F3238' },
    page: { primary: '#1F5F73', secondary: '#CFE6EC', background: '#F5F9FA', surface: '#EBF4F6', text: '#1D2B30', accent: '#2C7C93' },
    envelope: ['#CFE6EC', '#F7FAFA'],
    seal: '#1F5F73',
    sortOrder: 304,
  }),
  variantOf('tpl-lux-baroque-vang', {
    id: 'tpl-lux-baroque-lam',
    name: 'Baroque – Lam',
    slug: 'baroque-lam',
    colorName: 'Xanh sapphire · Vàng kim',
    colorTags: ['xanh-duong', 'vang'],
    description: 'Cartouche Baroque ánh kim trên nền giấy lam nhạt, chữ xanh sapphire – cổ điển và thanh lịch.',
    motif: { ground: '#E6ECF4', ink: '#1D3A6E', metal: '#B48F45', text: '#1E2A40' },
    page: { primary: '#1D3A6E', secondary: '#D7E0EE', background: '#F5F7FB', surface: '#EDF1F8', text: '#1C2333', accent: '#9C7B37' },
    envelope: ['#D7E0EE', '#F5F7FB'],
    seal: '#9C7B37',
    sortOrder: 403,
  }),
  variantOf('tpl-lux-baroque-vang', {
    id: 'tpl-lux-baroque-v2-do-dam',
    name: 'Baroque V2 – Đỏ đậm',
    slug: 'baroque-v2-do-dam',
    colorName: 'Đỏ rượu vang · Vàng kim',
    colorTags: ['do', 'vang'],
    description: 'Phiên bản V2 nền tối: khung Baroque dày, dập nổi vàng kim trên nền đỏ rượu vang và hoa văn damask.',
    motif: { variant: 'v2', ground: '#5E1220', ink: '#F1DDB0', metal: '#D4AE62', text: '#F3E4CB' },
    page: { primary: '#6E1423', secondary: '#EAD5C0', background: '#FAF4EF', surface: '#F7EEE8', text: '#2E2224', accent: '#A8823A' },
    envelope: ['#5E1220', '#F1DDB0'],
    seal: '#A8823A',
    sortOrder: 404,
  }),
  variantOf('tpl-lux-bach-su-lam', {
    id: 'tpl-lux-bach-su-nau',
    name: 'Bạch Sứ – Nâu',
    slug: 'bach-su-nau',
    colorName: 'Nâu men gốm · Trắng ngà',
    colorTags: ['trung-tinh'],
    description: 'Đĩa sứ men nâu trên nền trắng ngà, cánh sen và hồi văn – gợi gốm men nâu cổ.',
    motif: { ground: '#F6F0E6', ink: '#6B3F22', metal: '#6B3F22', text: '#3D2617' },
    page: { primary: '#6B3F22', secondary: '#E8DAC6', background: '#FAF6EF', surface: '#F4EDE2', text: '#2F2219', accent: '#8A5530' },
    envelope: ['#E8DAC6', '#FAF6EF'],
    seal: '#6B3F22',
    sortOrder: 503,
  }),
  variantOf('tpl-lux-bach-su-lam', {
    id: 'tpl-lux-bach-su-v2-xanh',
    name: 'Bạch Sứ V2 – Xanh',
    slug: 'bach-su-v2-xanh',
    colorName: 'Xanh cổ vịt · Trắng',
    colorTags: ['xanh-la', 'xanh-duong'],
    isPremium: true,
    description: 'Phiên bản V2: vành cánh sen nhạt kiểu men rạn, ít họa tiết góc, sắc xanh cổ vịt hiện đại.',
    motif: { variant: 'v2', ground: '#F2F6F5', ink: '#0F5E63', metal: '#0F5E63', text: '#173436' },
    page: { primary: '#0F5E63', secondary: '#CFE4E3', background: '#F4F8F8', surface: '#EAF3F2', text: '#1A2B2C', accent: '#17787E' },
    envelope: ['#CFE4E3', '#F4F8F8'],
    seal: '#0F5E63',
    sortOrder: 504,
  }),
  variantOf('tpl-lux-hoa-kho-cam', {
    id: 'tpl-lux-hoa-kho-v2-xanh',
    name: 'Hoa Khô V2 – Xanh',
    slug: 'hoa-kho-v2-xanh',
    colorName: 'Xanh sage · Kraft',
    colorTags: ['xanh-la', 'trung-tinh'],
    description: 'Phiên bản V2: bó hoa khô nhỏ gọn, nơ và cúc khô xanh sage trên giấy kraft sáng.',
    motif: { variant: 'v2', ground: '#EEE6D6', ink: '#56715C', metal: '#9A8456', soft: '#B08A6A', text: '#2F3A30' },
    page: { primary: '#4A6550', secondary: '#E3E6D6', background: '#F8F6EF', surface: '#F0EEE4', text: '#2A3129', accent: '#56715C' },
    envelope: ['#E3E6D6', '#F8F6EF'],
    seal: '#56715C',
    sortOrder: 603,
  }),
];

export const PREMIUM_COLLECTION_ALL: WeddingTemplate[] = [...SPECS, ...VARIANTS].map(build).sort(
  (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
);

/** Chỉ các mẫu đã sẵn sàng (đủ ảnh, đã kiểm thử). */
export const PREMIUM_COLLECTION: WeddingTemplate[] = PREMIUM_COLLECTION_ALL.filter((t) => t.status === 'published');
