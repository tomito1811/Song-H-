/**
 * 8 giao diện thiệp cưới HOT dạng trang dài (website thiệp), dựng theo bộ thiết kế tham khảo.
 * Mỗi theme quy định màu, font, kiểu hero, kiểu album, hoa văn trang trí, dress code & ảnh mẫu.
 */
export type HotThemeId = 'rose' | 'ivory' | 'lavender' | 'rustic' | 'starry' | 'blush' | 'ruby-film' | 'ocean';

export interface HotTheme {
  id: HotThemeId;
  name: string;
  tagline: string;
  /** nền trang, nền thẻ, màu chủ đạo, chữ, chữ phụ, nhấn kim loại */
  c: { bg: string; card: string; primary: string; deep: string; text: string; muted: string; accent: string; onDeep: string };
  dark?: boolean;
  hero: 'arch-split' | 'arch-center' | 'full-overlay' | 'torn' | 'wave';
  album: 'collage' | 'carousel' | 'polaroid' | 'film' | 'grid';
  band: 'wave' | 'torn' | 'plain';
  deco: 'rose' | 'leaf' | 'lavender' | 'dried' | 'star' | 'blossom';
  script: string;
  serif: string;
  kicker: string;
  sideNote: string;
  quote: string;
  dress: { color: string; label: string }[];
  dressNote: string;
  photos: { hero: string; album: string[]; venue?: string };
  musicId: string;
}

const P = (n: string) => `${import.meta.env.BASE_URL}assets/hot/${n}.webp`;

const SCRIPT = "'Dancing Script', cursive";
const GARAMOND = "'Cormorant Garamond', Georgia, serif";
const PLAYFAIR = "'Playfair Display', Georgia, serif";

export const HOT_THEMES: HotTheme[] = [
  {
    id: 'rose',
    name: 'Hồng Đỏ Rose',
    tagline: 'Đỏ rượu vang & hoa hồng, các mảng sóng mềm mại',
    c: { bg: '#FBF1EA', card: '#FFF8F3', primary: '#8E1B2C', deep: '#7A1424', text: '#4A2A2E', muted: '#8C6B6E', accent: '#C9A46A', onDeep: '#FBEFE6' },
    hero: 'full-overlay',
    album: 'collage',
    band: 'wave',
    deco: 'rose',
    script: SCRIPT,
    serif: GARAMOND,
    kicker: 'Save the date',
    sideNote: 'Cùng nhau viết tiếp câu chuyện yêu thương.',
    quote: 'Cùng nhau viết tiếp những ngày hạnh phúc.',
    dress: [
      { color: '#7A1424', label: 'Đỏ đô' },
      { color: '#E9A9B4', label: 'Hồng phấn' },
      { color: '#F3E6D3', label: 'Kem' },
      { color: '#D8BF96', label: 'Champagne' },
    ],
    dressNote: 'Trang trọng · Tinh tế',
    photos: { hero: P('rose-hero'), album: [P('rose-1'), P('rose-2'), P('rose-3'), P('rose-4')] },
    musicId: 'canon-strings',
  },
  {
    id: 'ivory',
    name: 'Ivory Garden',
    tagline: 'Kem ngà & xanh rừng, vòm hoa trắng cổ điển',
    c: { bg: '#FBF6EA', card: '#FFFCF4', primary: '#2F4A33', deep: '#25402B', text: '#3E3A2F', muted: '#7D7562', accent: '#B49A5E', onDeep: '#F6F1E2' },
    hero: 'arch-center',
    album: 'carousel',
    band: 'plain',
    deco: 'leaf',
    script: SCRIPT,
    serif: GARAMOND,
    kicker: 'Save our date',
    sideNote: 'Two hearts · One journey',
    quote: 'Cảm ơn vì đã xuất hiện, cùng nhau viết tiếp những ngày hạnh phúc.',
    dress: [
      { color: '#2F4A33', label: 'Xanh lá' },
      { color: '#9BB089', label: 'Xanh sage' },
      { color: '#FFFFFF', label: 'Trắng' },
      { color: '#E3CFA8', label: 'Be champagne' },
    ],
    dressNote: 'Thanh lịch · Nhẹ nhàng',
    photos: { hero: P('ivory-hero'), album: [P('ivory-1'), P('ivory-2'), P('ivory-3'), P('garden-hero')], venue: P('ivory-venue') },
    musicId: 'air-bach',
  },
  {
    id: 'lavender',
    name: 'Lavender Provence',
    tagline: 'Màu nước tím oải hương, giấy xé & polaroid',
    c: { bg: '#F6F0F8', card: '#FFFBFF', primary: '#6B4E8E', deep: '#5A3F7A', text: '#463A55', muted: '#887A96', accent: '#B79BCF', onDeep: '#F7F1FB' },
    hero: 'arch-split',
    album: 'polaroid',
    band: 'torn',
    deco: 'lavender',
    script: SCRIPT,
    serif: GARAMOND,
    kicker: 'Save the date',
    sideNote: 'Một hành trình mới bắt đầu…',
    quote: 'Cảm ơn vì đã xuất hiện, để những ngày bình thường cũng trở nên đặc biệt.',
    dress: [
      { color: '#B9A3D3', label: 'Tím lavender' },
      { color: '#CDBEDF', label: 'Tím pastel' },
      { color: '#EFD9E1', label: 'Hồng phấn' },
      { color: '#F7F1E8', label: 'Kem' },
    ],
    dressNote: 'Dịu dàng · Mơ mộng',
    photos: { hero: P('lav-hero'), album: [P('lav-1'), P('lav-2'), P('lav-3'), P('pink-1')] },
    musicId: 'clair-de-lune',
  },
  {
    id: 'rustic',
    name: 'Rustic Kraft',
    tagline: 'Giấy kraft xé tay, hoa khô & ảnh polaroid vintage',
    c: { bg: '#F3E6D2', card: '#FBF3E6', primary: '#A2512F', deep: '#4E5B3C', text: '#4A3A2C', muted: '#86705A', accent: '#C78C5B', onDeep: '#F6EEDD' },
    hero: 'torn',
    album: 'polaroid',
    band: 'torn',
    deco: 'dried',
    script: SCRIPT,
    serif: GARAMOND,
    kicker: 'Save the date',
    sideNote: 'Chúng mình cưới nhé!',
    quote: 'Có anh, mỗi ngày đều là một ngày thật đặc biệt.',
    dress: [
      { color: '#A2512F', label: 'Đất nung' },
      { color: '#D9C2A3', label: 'Be nhạt' },
      { color: '#7C8A5A', label: 'Xanh olive' },
      { color: '#F1E6D4', label: 'Trắng kem' },
    ],
    dressNote: 'Mộc mạc · Ấm áp',
    photos: { hero: P('rus-hero'), album: [P('rus-1'), P('rus-2'), P('rus-3')], venue: P('rus-venue') },
    musicId: 'gymnopedie',
  },
  {
    id: 'starry',
    name: 'Starry Night',
    tagline: 'Đêm xanh huyền bí, nến lung linh bên biển',
    dark: true,
    c: { bg: '#0E1A33', card: '#F8F6F1', primary: '#D8C7A0', deep: '#0B1530', text: '#E9E6DF', muted: '#A7B0C4', accent: '#CDB98C', onDeep: '#F4F1EA' },
    hero: 'full-overlay',
    album: 'polaroid',
    band: 'wave',
    deco: 'star',
    script: SCRIPT,
    serif: GARAMOND,
    kicker: 'Save our date',
    sideNote: 'Cùng chúng tôi viết tiếp câu chuyện tình yêu',
    quote: 'Có những hành trình đẹp nhất ta cùng nhau đi hết quãng đời còn lại.',
    dress: [
      { color: '#0E1A33', label: 'Xanh navy' },
      { color: '#B8BEC8', label: 'Bạc' },
      { color: '#7FA2C8', label: 'Xanh biển' },
      { color: '#FFFFFF', label: 'Trắng' },
    ],
    dressNote: 'Thanh lịch · Sang trọng',
    photos: { hero: P('nav-hero'), album: [P('nav-1'), P('nav-2'), P('nav-3'), P('nav-4')] },
    musicId: 'clair-de-lune',
  },
  {
    id: 'blush',
    name: 'Blush Romance',
    tagline: 'Hồng phấn nhẹ nhàng, vòm ảnh & hoa màu nước',
    c: { bg: '#FBF0EE', card: '#FFF9F8', primary: '#B4636F', deep: '#9E4F5C', text: '#5A3C42', muted: '#9A7C80', accent: '#D9A5A9', onDeep: '#FFF4F3' },
    hero: 'arch-split',
    album: 'carousel',
    band: 'plain',
    deco: 'blossom',
    script: SCRIPT,
    serif: GARAMOND,
    kicker: 'Save the date',
    sideNote: 'Cho hành trình yêu thương của chúng tôi',
    quote: 'Cảm ơn vì đã xuất hiện, để những ngày bình thường cũng trở nên đặc biệt.',
    dress: [
      { color: '#D4939A', label: 'Hồng đất' },
      { color: '#EDB8BE', label: 'Hồng phấn' },
      { color: '#F6EBDD', label: 'Kem' },
      { color: '#A9B59A', label: 'Xanh sage' },
    ],
    dressNote: 'Thanh lịch · Cùng tỏa sáng',
    photos: { hero: P('pink-hero'), album: [P('pink-1'), P('pink-2'), P('pink-3'), P('ivory-1')], venue: P('pink-venue') },
    musicId: 'canon-piano',
  },
  {
    id: 'ruby-film',
    name: 'Ruby Song Hỷ',
    tagline: 'Đỏ nhung truyền thống, chữ Hỷ & dải phim kỷ niệm',
    c: { bg: '#6E0F1A', card: '#FBF3EA', primary: '#7A1222', deep: '#5E0B16', text: '#FBEBD6', muted: '#E2C4A8', accent: '#D8B26A', onDeep: '#FBEBD6' },
    dark: true,
    hero: 'arch-center',
    album: 'film',
    band: 'plain',
    deco: 'rose',
    script: SCRIPT,
    serif: GARAMOND,
    kicker: 'Save the date',
    sideNote: 'Trân trọng kính mời',
    quote: 'Cùng nhau viết tiếp những ngày hạnh phúc.',
    dress: [
      { color: '#B0121F', label: 'Đỏ' },
      { color: '#E9D8C4', label: 'Kem' },
      { color: '#111111', label: 'Đen' },
    ],
    dressNote: 'Trang trọng · Tinh tế',
    photos: { hero: P('film-hero'), album: [P('film-1'), P('film-2'), P('film-3'), P('rose-1')] },
    musicId: 'wedding-march-sousa',
  },
  {
    id: 'ocean',
    name: 'Ocean Wave',
    tagline: 'Xanh biển & trắng, sóng lượn hiện đại',
    c: { bg: '#F3F6FA', card: '#FFFFFF', primary: '#1D3A63', deep: '#1B3459', text: '#26344A', muted: '#6E7D92', accent: '#8FB3D9', onDeep: '#F2F6FB' },
    hero: 'wave',
    album: 'grid',
    band: 'wave',
    deco: 'blossom',
    script: SCRIPT,
    serif: PLAYFAIR,
    kicker: 'Our wedding day',
    sideNote: 'Trân trọng kính mời đến tham dự lễ thành hôn của chúng tôi',
    quote: 'Cảm ơn bạn vì đã là một phần trong ngày đặc biệt của chúng tôi!',
    dress: [
      { color: '#1B3459', label: 'Navy' },
      { color: '#B6C7DA', label: 'Xanh nhạt' },
      { color: '#FFFFFF', label: 'Trắng' },
    ],
    dressNote: 'Thanh lịch · Sang trọng',
    photos: { hero: P('ocean-hero'), album: [P('nav-2'), P('nav-4'), P('nav-1'), P('nav-3')] },
    musicId: 'jesu-joy',
  },
];

export const HOT_THEME_MAP: Record<HotThemeId, HotTheme> = Object.fromEntries(HOT_THEMES.map((t) => [t.id, t])) as Record<
  HotThemeId,
  HotTheme
>;

/** Ảnh mẫu của theme (dùng để nhận biết & thay thế khi cặp đôi tải ảnh thật). */
export const isSamplePhoto = (url: string) =>
  url.includes('/assets/hot/') || url.includes('/assets/sample-album/') || url.includes('images.unsplash.com');
