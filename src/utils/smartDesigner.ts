/**
 * Trợ lý thiết kế chạy ngay trên trình duyệt (không cần máy chủ).
 * Dùng khi web chạy trên GitHub Pages hoặc máy chủ AI không phản hồi:
 * chọn 3 mẫu thiệp thật phù hợp phong cách & viết lời mời theo tông giọng, cá nhân hóa theo tên cặp đôi.
 */
import { AIDesignProposal, WeddingTemplate } from '../types/wedding';
import { WEDDING_TEMPLATES } from '../data/templates';

export interface DesignBrief {
  brideName: string;
  groomName: string;
  stylePreference: string;
  tone?: string;
  notes?: string;
}

/** Mỗi phong cách → danh sách mẫu ưu tiên (slug), ghép kèm ý tưởng thiết kế. */
const STYLE_MAP: Record<string, { slug: string; title: string; concept: string }[]> = {
  'Pastel Luxury': [
    { slug: 'hot-blush', title: 'Blush Romance — Hồng Phấn Vòm Hoa', concept: 'Vòm ảnh cưới giữa hoa màu nước hồng phấn, chữ serif thanh mảnh, cảm giác dịu dàng như một lá thư tình.' },
    { slug: 'hot-rose', title: 'Rose Bordeaux — Hoa Hồng Rượu Vang', concept: 'Ảnh bìa toàn màn hình, mảng sóng đỏ rượu vang xen kem, hoa hồng nở hai góc — sang trọng mà ngọt ngào.' },
    { slug: 'lien-hoa-hong', title: 'Liên Hoa — Sen Hồng Thuần Việt', concept: 'Đóa sen hồng nở trên mặt hồ, khung vòm ánh kim — thanh khiết, nhẹ nhàng, đậm chất Á Đông.' },
  ],
  'Korean Minimal': [
    { slug: 'hot-ivory', title: 'Ivory Garden — Kem Ngà Tối Giản', concept: 'Nền kem ngà, xanh rừng điểm xuyết, bố cục thoáng kiểu tạp chí Hàn Quốc, tập trung vào ảnh cưới.' },
    { slug: 'hot-ocean', title: 'Ocean Wave — Sóng Xanh Hiện Đại', concept: 'Đường sóng lượn chia mảng ảnh và chữ, xanh navy & trắng — hiện đại, gọn gàng, rất "Hàn".' },
    { slug: 'minimalism-nau', title: 'Monogram — Nâu Ấm Tối Giản', concept: 'Monogram chữ cái đầu hai bạn, khoảng trắng rộng, chữ serif nhỏ nhắn — tinh tế đến từng chi tiết.' },
  ],
  'Luxury Champagne': [
    { slug: 'hot-starry', title: 'Starry Night — Dạ Tiệc Ánh Sao', concept: 'Nền đêm xanh huyền bí, nến lung linh và chữ ánh champagne — dành cho tiệc tối sang trọng.' },
    { slug: 'baroque-vang', title: 'Baroque — Champagne Hoàng Gia', concept: 'Khung cartouche Baroque đối xứng, lá ô-rô dập nổi ánh champagne — đẳng cấp cổ điển châu Âu.' },
    { slug: 'hot-ruby-film', title: 'Ruby Song Hỷ — Đỏ Nhung & Vàng', concept: 'Đỏ nhung sâu lắng kết hợp chi tiết vàng, dải phim kỷ niệm — sang trọng và giàu cảm xúc.' },
  ],
  'Floral Garden': [
    { slug: 'hot-lavender', title: 'Lavender Provence — Vườn Oải Hương', concept: 'Màu nước tím oải hương, giấy xé tay và ảnh polaroid — mơ mộng như một buổi chiều ở Provence.' },
    { slug: 'hot-ivory', title: 'Ivory Garden — Vòm Hoa Trắng', concept: 'Vòm hoa trắng, lá xanh rừng và chữ viết tay — tiệc cưới sân vườn tươi mát, nhẹ nhàng.' },
    { slug: 'hot-rustic', title: 'Rustic Kraft — Hoa Khô Đồng Quê', concept: 'Giấy kraft xé tay, hoa khô và ảnh polaroid vintage — mộc mạc, ấm áp cho tiệc ngoài trời.' },
  ],
  'Traditional Heritage': [
    { slug: 'hot-ruby-film', title: 'Ruby Song Hỷ — Đỏ Nhung Truyền Thống', concept: 'Chữ Hỷ, sắc đỏ nhung và vàng kim, dải phim kỷ niệm — truyền thống mà vẫn hiện đại.' },
    { slug: 'song-hy-do', title: 'Song Hỷ — Đỏ Son Vàng Kim', concept: 'Chữ Hỷ khắc âm trên huy chương ánh kim, nền đỏ son dệt gấm — trang trọng, may mắn.' },
    { slug: 'long-phung-do', title: 'Long Phụng — Hòa Hợp Lứa Đôi', concept: 'Rồng phượng uốn lượn quanh khung vòm, tượng trưng cho hạnh phúc viên mãn hai họ.' },
  ],
};

const NOTE_HINTS: { re: RegExp; slug: string }[] = [
  { re: /biển|bãi biển|resort|beach|đà nẵng|nha trang|phú quốc|cam ranh/i, slug: 'hot-ocean' },
  { re: /đêm|tối|night|nến|gala/i, slug: 'hot-starry' },
  { re: /vintage|đồng quê|rustic|kraft|ngoài trời|outdoor/i, slug: 'hot-rustic' },
  { re: /lavender|oải hương|tím/i, slug: 'hot-lavender' },
  { re: /truyền thống|áo dài|ăn hỏi|vu quy|đỏ/i, slug: 'hot-ruby-film' },
  { re: /hoa hồng|rose|đỏ rượu/i, slug: 'hot-rose' },
];

type ToneKey = 'romantic' | 'formal' | 'fun' | 'poetic';

function toneOf(tone = ''): ToneKey {
  const t = tone.toLowerCase();
  if (/hóm|vui|dí dỏm|trẻ trung|năng động|funny/.test(t)) return 'fun';
  if (/trang trọng|lịch sự|truyền thống|sang trọng|formal/.test(t)) return 'formal';
  if (/thơ|thi vị|sâu lắng|văn chương/.test(t)) return 'poetic';
  return 'romantic';
}

const MESSAGES: Record<ToneKey, ((g: string, b: string) => string)[]> = {
  romantic: [
    (g, b) => `Từ hai con đường riêng, ${g} và ${b} đã tìm thấy nhau và quyết định cùng bước chung một lối. Trân trọng kính mời quý khách đến chung vui trong ngày hạnh phúc nhất của chúng tôi.`,
    (g, b) => `Có những cuộc gặp gỡ là định mệnh. ${g} & ${b} xin được mời bạn đến chứng kiến khoảnh khắc chúng tôi nói lời "đồng ý" trọn đời.`,
    (g, b) => `Tình yêu của ${g} và ${b} sẽ trọn vẹn hơn khi có bạn ở bên. Hãy cùng chúng tôi viết tiếp chương đẹp nhất của câu chuyện này nhé!`,
  ],
  formal: [
    (g, b) => `Gia đình hai họ trân trọng kính mời quý khách đến dự tiệc mừng lễ thành hôn của ${g} và ${b}. Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi.`,
    (g, b) => `Nhân duyên tiền định, hai họ kết giao. Trân trọng kính mời quý khách tới chung vui cùng ${g} & ${b} trong ngày trọng đại.`,
    (g, b) => `Thay mặt hai gia đình, ${g} và ${b} trân trọng kính mời quý vị đến dự hôn lễ và tiệc mừng của chúng tôi.`,
  ],
  fun: [
    (g, b) => `Sau bao ngày "tìm hiểu", ${g} chính thức được ${b} "duyệt" làm chồng! Mời bạn đến ăn cỗ, nâng ly và chụp thật nhiều ảnh cùng tụi mình nha!`,
    (g, b) => `Breaking news: ${g} ❤ ${b} quyết định về chung một nhà! Đừng quên mang theo nụ cười (và bụng đói) đến tiệc cưới của tụi mình nhé!`,
    (g, b) => `Chuyện tình ${g} – ${b} đã đến hồi "happy ending". Có bạn thì tiệc mới vui — hẹn gặp bạn trong ngày cưới nha!`,
  ],
  poetic: [
    (g, b) => `Gió đưa duyên thắm về chung lối, trăng sáng soi đôi bước chung đường. ${g} & ${b} kính mời quý khách đến chung vui trong ngày se duyên.`,
    (g, b) => `Mùa hoa nở, đôi ta về chung một mái. ${g} và ${b} mong được đón bạn trong buổi tiệc nhỏ, nơi tình yêu được viết thành lời hẹn ước.`,
    (g, b) => `Như sông tìm về biển, như mây tìm về trời — ${g} đã tìm thấy ${b}. Trân trọng kính mời bạn đến chung vui cùng chúng tôi.`,
  ],
};

const findTpl = (slug: string) => WEDDING_TEMPLATES.find((t) => t.slug === slug);

export function generateLocalProposals(brief: DesignBrief, variation = 0): AIDesignProposal[] {
  const groom = brief.groomName.trim() || 'Chú Rể';
  const bride = brief.brideName.trim() || 'Cô Dâu';
  const base = STYLE_MAP[brief.stylePreference] || STYLE_MAP['Pastel Luxury'];
  // Gợi ý từ ghi chú (vd. "tiệc cưới bãi biển") được ưu tiên lên đầu
  const hint = NOTE_HINTS.find((h) => h.re.test(`${brief.notes || ''} ${brief.tone || ''}`));
  let picks = [...base];
  if (hint && !picks.some((p) => p.slug === hint.slug)) {
    const all = Object.values(STYLE_MAP).flat();
    const extra = all.find((p) => p.slug === hint.slug);
    if (extra) picks = [extra, ...picks.slice(0, 2)];
  }
  const tone = toneOf(brief.tone);
  const bank = MESSAGES[tone];

  return picks
    .map((p, i): AIDesignProposal | null => {
      const tpl: WeddingTemplate | undefined = findTpl(p.slug);
      if (!tpl) return null;
      const pal = tpl.design.palette;
      return {
        id: `smart-${p.slug}-${variation}`,
        title: p.title,
        concept: `${p.concept} Dành riêng cho ${groom} & ${bride}.`,
        styleName: tpl.hot ? 'Mẫu HOT' : tpl.style,
        palette: pal,
        fontHeading: tpl.design.fontHeading,
        fontBody: tpl.design.fontBody,
        heroLayout: tpl.design.heroLayout,
        invitationMessage: bank[(i + variation) % bank.length](groom, bride),
        ornamentStyle: tpl.design.ornamentStyle,
        previewColor: pal.secondary,
        templateId: tpl.id,
        groomName: groom,
        brideName: bride,
      };
    })
    .filter((p): p is AIDesignProposal => Boolean(p));
}
