/**
 * Bộ mẫu thiệp sự kiện (ngoài thiệp cưới): sinh nhật, tân gia, đầy tháng/thôi nôi,
 * khai trương & sự kiện, tốt nghiệp. Mỗi loại 11 mẫu, vẽ bằng SVG (design.motif).
 */
import { WeddingTemplate, EventType, MotifId, ColorTag, TemplateCategory } from '../types/wedding';
import { lighten, darken, isDark } from '../components/templateArt/artUtils';

interface EvSpec {
  key: string;
  name: string;
  motif: MotifId;
  variant?: string;
  kicker?: string;
  colors: { ground: string; ink: string; metal: string; soft: string; text?: string };
  colorName: string;
  colorTags: ColorTag[];
  premium?: boolean;
  description: string;
}

const MESSAGES: Record<Exclude<EventType, 'wedding'>, { invite: string; thanks: string; category: TemplateCategory; style: string }> = {
  birthday: {
    invite: 'Một tuổi mới, một hành trình mới! Rất mong bạn đến chung vui và thổi nến cùng mình trong bữa tiệc ấm áp này.',
    thanks: 'Cảm ơn bạn đã đến và làm cho ngày đặc biệt này thêm trọn vẹn!',
    category: 'modern',
    style: 'Sinh Nhật',
  },
  housewarming: {
    invite: 'Gia đình chúng tôi vừa về tổ ấm mới. Trân trọng kính mời quý khách đến chung vui, chúc phúc cho ngôi nhà thêm ấm áp.',
    thanks: 'Cảm ơn quý khách đã ghé thăm và gửi những lời chúc an cư lạc nghiệp.',
    category: 'modern',
    style: 'Tân Gia',
  },
  baby: {
    invite: 'Bé yêu nhà mình đã lớn thêm một chặng đường! Bố mẹ trân trọng kính mời cô dì chú bác đến chung vui cùng bé.',
    thanks: 'Cảm ơn mọi người đã yêu thương và chúc phúc cho bé!',
    category: 'pastel',
    style: 'Đầy Tháng · Thôi Nôi',
  },
  opening: {
    invite: 'Trân trọng kính mời quý khách đến tham dự lễ khai trương, chung vui và nhận những ưu đãi đặc biệt trong ngày đầu tiên.',
    thanks: 'Sự hiện diện của quý khách là niềm vinh hạnh và khởi đầu may mắn cho chúng tôi.',
    category: 'classic',
    style: 'Khai Trương · Sự Kiện',
  },
  graduation: {
    invite: 'Sau những năm tháng nỗ lực, mình đã chính thức tốt nghiệp! Rất mong bạn đến chia vui trong khoảnh khắc đáng nhớ này.',
    thanks: 'Cảm ơn bạn đã đồng hành và chia vui cùng mình!',
    category: 'classic',
    style: 'Tốt Nghiệp',
  },
};

const SPECS: Record<Exclude<EventType, 'wedding'>, EvSpec[]> = {
  birthday: [
    { key: 'bong-bay-hong', name: 'Bóng Bay – Hồng Pastel', motif: 'balloons', variant: 'pastel', colors: { ground: '#FFF4F6', ink: '#E7739A', metal: '#F2B84B', soft: '#9FD6E6' }, colorName: 'Hồng · Vàng · Xanh', colorTags: ['hong'], description: 'Chùm bóng bay pastel, cờ đuôi nheo vui tươi cho tiệc sinh nhật ngọt ngào.' },
    { key: 'bong-bay-xanh', name: 'Bóng Bay – Xanh Biển', motif: 'balloons', colors: { ground: '#F1F8FC', ink: '#2F7FB8', metal: '#F0A73A', soft: '#7CCBC2' }, colorName: 'Xanh biển · Cam', colorTags: ['xanh-duong'], description: 'Bóng bay xanh biển tươi mát, hợp tiệc sinh nhật bé trai hoặc người lớn.' },
    { key: 'bong-bay-vang', name: 'Bóng Bay – Vàng Kim', motif: 'balloons', colors: { ground: '#1E1B2E', ink: '#E9C46A', metal: '#F4F1DE', soft: '#C77DFF', text: '#F4F1DE' }, colorName: 'Đen tím · Vàng kim', colorTags: ['den', 'vang'], premium: true, description: 'Nền đêm sang trọng, bóng bay ánh kim — tiệc sinh nhật tuổi trưởng thành.' },
    { key: 'bong-bay-cau-vong', name: 'Bóng Bay – Cầu Vồng', motif: 'balloons', variant: 'pastel', colors: { ground: '#FFFBEF', ink: '#FF8A5B', metal: '#7B6CF6', soft: '#4CC9A6' }, colorName: 'Nhiều màu', colorTags: ['cam', 'tim'], description: 'Bóng bay nhiều sắc màu rực rỡ, hợp tiệc sinh nhật bé.' },
    { key: 'banh-kem-dau', name: 'Bánh Kem – Dâu Tây', motif: 'cake', colors: { ground: '#FFF6F2', ink: '#E85D75', metal: '#F4B942', soft: '#FDE2E4' }, colorName: 'Hồng dâu · Kem', colorTags: ['hong', 'do'], description: 'Bánh kem ba tầng phủ kem dâu, nến lung linh và ánh sao.' },
    { key: 'banh-kem-socola', name: 'Bánh Kem – Socola', motif: 'cake', colors: { ground: '#FBF3EA', ink: '#6B3E26', metal: '#D9A441', soft: '#F3DFC1' }, colorName: 'Nâu socola · Vàng', colorTags: ['trung-tinh'], description: 'Bánh socola ấm áp, tông nâu kem thanh lịch.' },
    { key: 'banh-kem-mini', name: 'Bánh Kem Mini – Bạc Hà', motif: 'cake', variant: 'mini', colors: { ground: '#F0FAF6', ink: '#2A9D8F', metal: '#E9A23B', soft: '#CDEDE3' }, colorName: 'Bạc hà · Cam', colorTags: ['xanh-la'], description: 'Bánh kem hai tầng xinh xắn, sắc bạc hà dịu mát.' },
    { key: 'banh-kem-hoang-gia', name: 'Bánh Kem – Hoàng Gia', motif: 'cake', colors: { ground: '#1B2340', ink: '#E7C873', metal: '#FFFFFF', soft: '#2E3A66', text: '#F5EEDC' }, colorName: 'Xanh navy · Vàng', colorTags: ['xanh-duong', 'vang'], premium: true, description: 'Nền navy, bánh kem viền vàng sang trọng cho tiệc sinh nhật đẳng cấp.' },
    { key: 'phao-giay-ruc-ro', name: 'Pháo Giấy – Rực Rỡ', motif: 'confetti', colors: { ground: '#FFFDF7', ink: '#EF476F', metal: '#FFB703', soft: '#118AB2' }, colorName: 'Nhiều màu', colorTags: ['cam', 'hong'], description: 'Pháo giấy bung tỏa khắp thiệp — năng lượng tiệc tùng.' },
    { key: 'phao-giay-dem', name: 'Pháo Giấy – Đêm Tiệc', motif: 'confetti', variant: 'night', colors: { ground: '#14141F', ink: '#FF5DA2', metal: '#FFD166', soft: '#5EEAD4', text: '#F8F8F8' }, colorName: 'Đen · Neon', colorTags: ['den'], premium: true, description: 'Nền tối, pháo giấy neon — phong cách party hiện đại.' },
    { key: 'phao-giay-tim', name: 'Pháo Giấy – Tím Mộng Mơ', motif: 'confetti', colors: { ground: '#F7F3FF', ink: '#7B5CD6', metal: '#E8A87C', soft: '#B8E0D2' }, colorName: 'Tím · Đào', colorTags: ['tim'], description: 'Pháo giấy tím pastel nhẹ nhàng, dễ thương.' },
  ],
  housewarming: [
    { key: 'nha-am-xanh', name: 'Ngôi Nhà – Xanh Lá', motif: 'house', colors: { ground: '#F3F8EF', ink: '#C0603C', metal: '#F2C14E', soft: '#8DBF7A' }, colorName: 'Xanh lá · Gạch', colorTags: ['xanh-la'], description: 'Ngôi nhà mái ngói giữa đồi xanh, ấm áp và bình yên.' },
    { key: 'nha-am-dem', name: 'Ngôi Nhà – Đêm Trăng', motif: 'house', variant: 'night', colors: { ground: '#1F2A44', ink: '#D9825B', metal: '#F6D365', soft: '#3E5C76', text: '#F5EBDD' }, colorName: 'Xanh đêm · Vàng', colorTags: ['xanh-duong', 'den'], premium: true, description: 'Ngôi nhà sáng đèn dưới trăng sao — lãng mạn và ấm cúng.' },
    { key: 'nha-hien-dai', name: 'Nhà Phố – Hiện Đại', motif: 'house', variant: 'modern', colors: { ground: '#F5F2EC', ink: '#3D4A5C', metal: '#F0C987', soft: '#A9C2A6' }, colorName: 'Ghi xám · Vàng', colorTags: ['trung-tinh'], description: 'Nhà phố hiện đại tối giản, tông ghi xám tinh tế.' },
    { key: 'nha-pastel', name: 'Ngôi Nhà – Hồng Pastel', motif: 'house', colors: { ground: '#FFF5F3', ink: '#D67B8A', metal: '#F4B860', soft: '#B9D8C2' }, colorName: 'Hồng · Xanh mint', colorTags: ['hong'], description: 'Ngôi nhà hồng pastel dễ thương cho tổ ấm mới.' },
    { key: 'nha-can-ho', name: 'Căn Hộ – Xanh Navy', motif: 'house', variant: 'modern', colors: { ground: '#EEF2F7', ink: '#1F3B5B', metal: '#E9B44C', soft: '#9DB4C0' }, colorName: 'Navy · Vàng', colorTags: ['xanh-duong'], description: 'Căn hộ hiện đại, tông navy sang trọng.' },
    { key: 'nha-dong-que', name: 'Ngôi Nhà – Đồng Quê', motif: 'house', colors: { ground: '#FBF6E9', ink: '#8C5A3C', metal: '#E3B04B', soft: '#B5C99A' }, colorName: 'Nâu · Kem', colorTags: ['trung-tinh', 'vang'], description: 'Phong cách đồng quê mộc mạc, gần gũi.' },
    { key: 'chia-khoa-monstera', name: 'Chìa Khóa – Monstera', motif: 'keys-plant', colors: { ground: '#F6F3EA', ink: '#B5543C', metal: '#C9A227', soft: '#4F7A5A' }, colorName: 'Xanh lá · Vàng đồng', colorTags: ['xanh-la', 'vang'], description: 'Chìa khóa vàng buộc nơ giữa lá monstera xanh mát.' },
    { key: 'chia-khoa-toi-gian', name: 'Chìa Khóa – Tối Giản', motif: 'keys-plant', variant: 'minimal', colors: { ground: '#FAF8F4', ink: '#2F2F2F', metal: '#B8935A', soft: '#CFC6B8' }, colorName: 'Trắng · Vàng đồng', colorTags: ['trung-tinh'], description: 'Tối giản thanh lịch: chỉ chìa khóa và đường viền mảnh.' },
    { key: 'chia-khoa-luc-bao', name: 'Chìa Khóa – Lục Bảo', motif: 'keys-plant', colors: { ground: '#0F3D3E', ink: '#E7C873', metal: '#F3E3B5', soft: '#1F6F5C', text: '#F1EAD8' }, colorName: 'Lục bảo · Vàng', colorTags: ['xanh-la', 'den'], premium: true, description: 'Nền lục bảo, chìa khóa ánh kim — sang trọng và may mắn.' },
    { key: 'chia-khoa-dao', name: 'Chìa Khóa – Đào Ấm', motif: 'keys-plant', colors: { ground: '#FFF4EC', ink: '#D8572A', metal: '#E09F3E', soft: '#7BA05B' }, colorName: 'Cam đào · Xanh', colorTags: ['cam'], description: 'Tông cam đào ấm áp, tượng trưng cho khởi đầu hưng thịnh.' },
    { key: 'chia-khoa-do', name: 'Chìa Khóa – Đỏ May Mắn', motif: 'keys-plant', colors: { ground: '#FFF7EE', ink: '#B3202A', metal: '#D4A017', soft: '#5E8C61' }, colorName: 'Đỏ · Vàng', colorTags: ['do', 'vang'], description: 'Sắc đỏ vàng may mắn theo phong tục nhập trạch.' },
  ],
  baby: [
    { key: 'may-xanh', name: 'Mây Trời – Xanh Baby', motif: 'baby-cloud', colors: { ground: '#E8F3FB', ink: '#5A8DBE', metal: '#F2C14E', soft: '#C7DDF0' }, colorName: 'Xanh baby · Vàng', colorTags: ['xanh-duong'], description: 'Mây trắng, trăng sao lơ lửng — dịu dàng cho bé trai.' },
    { key: 'may-hong', name: 'Mây Trời – Hồng Baby', motif: 'baby-cloud', colors: { ground: '#FDEEF2', ink: '#D9779A', metal: '#F2B84B', soft: '#F7CAD6' }, colorName: 'Hồng baby · Vàng', colorTags: ['hong'], description: 'Mây hồng ngọt ngào, sao vàng lấp lánh cho bé gái.' },
    { key: 'may-vang', name: 'Mây Trời – Vàng Nắng', motif: 'baby-cloud', colors: { ground: '#FFF8E1', ink: '#E09F3E', metal: '#E07A5F', soft: '#FFE8A3' }, colorName: 'Vàng nắng · Cam', colorTags: ['vang'], description: 'Tông vàng nắng ấm, trung tính cho mọi bé.' },
    { key: 'may-mint', name: 'Mây Trời – Xanh Mint', motif: 'baby-cloud', colors: { ground: '#E9F7F1', ink: '#3E9C7F', metal: '#F4A261', soft: '#BFE6D6' }, colorName: 'Mint · Đào', colorTags: ['xanh-la'], description: 'Xanh mint tươi mát, nhẹ nhàng.' },
    { key: 'may-tim', name: 'Mây Trời – Tím Lavender', motif: 'baby-cloud', colors: { ground: '#F2EEFB', ink: '#8C73C9', metal: '#F2C14E', soft: '#DCD3F2' }, colorName: 'Lavender · Vàng', colorTags: ['tim'], description: 'Lavender mơ màng như giấc ngủ của bé.' },
    { key: 'may-dem', name: 'Trăng Sao – Đêm Ngọt', motif: 'baby-cloud', colors: { ground: '#24305E', ink: '#F8E9A1', metal: '#F76C6C', soft: '#A8D0E6', text: '#F8F4E3' }, colorName: 'Xanh đêm · Vàng', colorTags: ['xanh-duong', 'den'], premium: true, description: 'Bầu trời đêm êm đềm với trăng khuyết và sao.' },
    { key: 'gau-be-xanh', name: 'Gấu Bông – Xanh', motif: 'baby-bear', colors: { ground: '#EEF6FB', ink: '#4D8FCB', metal: '#F2B84B', soft: '#D9B38C' }, colorName: 'Xanh · Nâu gấu', colorTags: ['xanh-duong'], description: 'Gấu bông đáng yêu ôm bóng bay, cờ đuôi nheo vui tươi.' },
    { key: 'gau-be-hong', name: 'Gấu Bông – Hồng', motif: 'baby-bear', colors: { ground: '#FFF0F3', ink: '#E07A9C', metal: '#F4B860', soft: '#D9B38C' }, colorName: 'Hồng · Nâu gấu', colorTags: ['hong'], description: 'Gấu bông hồng xinh xắn cho bé gái.' },
    { key: 'gau-be-kem', name: 'Gấu Bông – Kem Sữa', motif: 'baby-bear', colors: { ground: '#FBF5EC', ink: '#B07D62', metal: '#E3B04B', soft: '#E6C9A8' }, colorName: 'Kem · Nâu', colorTags: ['trung-tinh'], description: 'Tông kem sữa trung tính, ấm áp.' },
    { key: 'gau-be-mint', name: 'Gấu Bông – Mint', motif: 'baby-bear', colors: { ground: '#EDF8F3', ink: '#3E9C7F', metal: '#F4A261', soft: '#D9B38C' }, colorName: 'Mint · Cam', colorTags: ['xanh-la'], description: 'Gấu bông giữa sắc mint tươi mát.' },
    { key: 'gau-be-tim', name: 'Gấu Bông – Lavender', motif: 'baby-bear', colors: { ground: '#F4F0FC', ink: '#8C73C9', metal: '#F2C14E', soft: '#D9B38C' }, colorName: 'Lavender · Vàng', colorTags: ['tim'], premium: true, description: 'Gấu bông lavender ngọt ngào, mơ mộng.' },
  ],
  opening: [
    { key: 'cat-bang-do', name: 'Cắt Băng – Đỏ Vàng', motif: 'ribbon-cut', colors: { ground: '#FFF8EC', ink: '#C1121F', metal: '#D4A017', soft: '#F6E7C1' }, colorName: 'Đỏ · Vàng kim', colorTags: ['do', 'vang'], description: 'Dải lụa đỏ và nơ lớn, kéo vàng — khai trương hồng phát.' },
    { key: 'cat-bang-hoang-gia', name: 'Cắt Băng – Hoàng Gia', motif: 'ribbon-cut', colors: { ground: '#12161F', ink: '#C9A227', metal: '#F3E3B5', soft: '#2B3242', text: '#F3EAD3' }, colorName: 'Đen · Vàng', colorTags: ['den', 'vang'], premium: true, description: 'Nền đen sang trọng, nơ ánh kim cho sự kiện cao cấp.' },
    { key: 'cat-bang-xanh', name: 'Cắt Băng – Xanh Ngọc', motif: 'ribbon-cut', colors: { ground: '#F0F8F6', ink: '#0F766E', metal: '#D4A017', soft: '#CFE8E2' }, colorName: 'Xanh ngọc · Vàng', colorTags: ['xanh-la'], description: 'Xanh ngọc tươi mới cho cửa hàng, spa, café.' },
    { key: 'cat-bang-navy', name: 'Cắt Băng – Navy', motif: 'ribbon-cut', colors: { ground: '#F2F4F8', ink: '#1D3557', metal: '#E9B44C', soft: '#DCE3EE' }, colorName: 'Navy · Vàng', colorTags: ['xanh-duong'], description: 'Navy chuyên nghiệp cho văn phòng, doanh nghiệp.' },
    { key: 'cat-bang-hong', name: 'Cắt Băng – Hồng Boutique', motif: 'ribbon-cut', colors: { ground: '#FFF4F6', ink: '#D1497A', metal: '#C9A227', soft: '#F8D7E0' }, colorName: 'Hồng · Vàng', colorTags: ['hong'], description: 'Hồng boutique cho shop thời trang, mỹ phẩm.' },
    { key: 'cat-bang-tim', name: 'Cắt Băng – Tím Sang', motif: 'ribbon-cut', colors: { ground: '#F6F2FB', ink: '#5B3E96', metal: '#D4A017', soft: '#E3DAF2' }, colorName: 'Tím · Vàng', colorTags: ['tim'], description: 'Tím quý phái cho salon, studio.' },
    { key: 'phao-hoa-dem', name: 'Pháo Hoa – Đêm Gala', motif: 'firework', kicker: 'Gala · Year End Party', colors: { ground: '#0E1A33', ink: '#FF6B6B', metal: '#FFD166', soft: '#7BDFF2', text: '#F7F3E8' }, colorName: 'Xanh đêm · Vàng', colorTags: ['xanh-duong', 'den'], premium: true, description: 'Pháo hoa rực rỡ trên trời đêm — tiệc tất niên, gala công ty.' },
    { key: 'phao-hoa-tim', name: 'Pháo Hoa – Tím Neon', motif: 'firework', kicker: 'Trân trọng kính mời', colors: { ground: '#1A1033', ink: '#F72585', metal: '#FFD60A', soft: '#4CC9F0', text: '#F5F0FF' }, colorName: 'Tím đêm · Neon', colorTags: ['tim', 'den'], description: 'Pháo hoa neon cho sự kiện trẻ trung, sôi động.' },
    { key: 'phao-hoa-do', name: 'Pháo Hoa – Đỏ Tết', motif: 'firework', kicker: 'Tiệc Tất Niên', colors: { ground: '#5C0A0F', ink: '#FFD166', metal: '#FFE8A3', soft: '#FF8C61', text: '#FFF3DC' }, colorName: 'Đỏ đô · Vàng', colorTags: ['do', 'vang'], description: 'Đỏ đô và pháo hoa vàng — tất niên, tân niên.' },
    { key: 'phao-hoa-den', name: 'Pháo Hoa – Hội Nghị', motif: 'firework', kicker: 'Hội Nghị Khách Hàng', colors: { ground: '#111827', ink: '#60A5FA', metal: '#E5E7EB', soft: '#A78BFA', text: '#F3F4F6' }, colorName: 'Đen · Xanh', colorTags: ['den', 'xanh-duong'], premium: true, description: 'Phong cách doanh nghiệp cho hội nghị, ra mắt sản phẩm.' },
    { key: 'phao-giay-khai-truong', name: 'Pháo Giấy – Khai Trương', motif: 'confetti', kicker: 'Grand Opening', colors: { ground: '#FFFBF2', ink: '#D62828', metal: '#F77F00', soft: '#FCBF49' }, colorName: 'Đỏ · Cam · Vàng', colorTags: ['do', 'cam'], description: 'Pháo giấy đỏ cam vàng cho ngày khai trương náo nhiệt.' },
  ],
  graduation: [
    { key: 'mu-navy', name: 'Mũ Cử Nhân – Navy', motif: 'grad-cap', colors: { ground: '#F4F6FA', ink: '#1D2B53', metal: '#C9A227', soft: '#E6D7B0' }, colorName: 'Navy · Vàng', colorTags: ['xanh-duong', 'vang'], description: 'Mũ cử nhân, bằng cuộn và vòng nguyệt quế vàng — trang trọng.' },
    { key: 'mu-den-vang', name: 'Mũ Cử Nhân – Đen Vàng', motif: 'grad-cap', colors: { ground: '#141414', ink: '#2B2B2B', metal: '#D4AF37', soft: '#8A7A55', text: '#F2E9D0' }, colorName: 'Đen · Vàng kim', colorTags: ['den', 'vang'], premium: true, description: 'Nền đen ánh kim — lễ tốt nghiệp sang trọng.' },
    { key: 'mu-do-do', name: 'Mũ Cử Nhân – Đỏ Đô', motif: 'grad-cap', colors: { ground: '#FBF4F0', ink: '#7A1C24', metal: '#C9A227', soft: '#E9CFC0' }, colorName: 'Đỏ đô · Vàng', colorTags: ['do'], description: 'Đỏ đô truyền thống của lễ phục.' },
    { key: 'mu-xanh-la', name: 'Mũ Cử Nhân – Xanh Lá', motif: 'grad-cap', colors: { ground: '#F2F7F1', ink: '#1F4D3A', metal: '#C9A227', soft: '#CFE0C8' }, colorName: 'Xanh rêu · Vàng', colorTags: ['xanh-la'], description: 'Xanh rêu thanh lịch, gần gũi.' },
    { key: 'mu-hong', name: 'Mũ Cử Nhân – Hồng', motif: 'grad-cap', colors: { ground: '#FFF4F7', ink: '#3A2A3A', metal: '#E07A9C', soft: '#F6D3DE' }, colorName: 'Hồng · Đen', colorTags: ['hong'], description: 'Phong cách nữ tính, trẻ trung.' },
    { key: 'mu-xam', name: 'Mũ Cử Nhân – Tối Giản', motif: 'grad-cap', colors: { ground: '#F7F7F5', ink: '#333333', metal: '#9A8456', soft: '#DAD6CC' }, colorName: 'Xám · Vàng đồng', colorTags: ['trung-tinh'], description: 'Tối giản hiện đại, tập trung vào thông tin.' },
    { key: 'mu-tim', name: 'Mũ Cử Nhân – Tím', motif: 'grad-cap', colors: { ground: '#F5F1FB', ink: '#3F2A6B', metal: '#D4A017', soft: '#DCD0F0' }, colorName: 'Tím · Vàng', colorTags: ['tim'], description: 'Tím học thuật quý phái.' },
    { key: 'phao-giay-tot-nghiep', name: 'Pháo Giấy – Tốt Nghiệp', motif: 'confetti', kicker: 'Graduation Party', colors: { ground: '#FFFDF5', ink: '#1D3557', metal: '#E63946', soft: '#F4A261' }, colorName: 'Navy · Đỏ · Cam', colorTags: ['xanh-duong', 'do'], description: 'Pháo giấy tung bay mừng tân cử nhân.' },
    { key: 'phao-giay-dem-tn', name: 'Pháo Giấy – Đêm Tốt Nghiệp', motif: 'confetti', variant: 'night', kicker: 'Graduation Night', colors: { ground: '#101826', ink: '#FFD166', metal: '#EF476F', soft: '#06D6A0', text: '#F6F2E8' }, colorName: 'Đen · Neon', colorTags: ['den'], premium: true, description: 'Tiệc mừng tốt nghiệp phong cách party đêm.' },
    { key: 'phao-hoa-tot-nghiep', name: 'Pháo Hoa – Vinh Danh', motif: 'firework', kicker: 'Lễ Tốt Nghiệp', colors: { ground: '#0B1D3A', ink: '#E9C46A', metal: '#F4F1DE', soft: '#90E0EF', text: '#F4F1DE' }, colorName: 'Xanh đêm · Vàng', colorTags: ['xanh-duong', 'vang'], description: 'Pháo hoa vinh danh khoảnh khắc trưởng thành.' },
    { key: 'bong-bay-tot-nghiep', name: 'Bóng Bay – Mừng Tốt Nghiệp', motif: 'balloons', kicker: 'Mừng Tân Cử Nhân', colors: { ground: '#F6F8FC', ink: '#1D3557', metal: '#E9C46A', soft: '#A8DADC' }, colorName: 'Navy · Vàng · Xanh', colorTags: ['xanh-duong'], description: 'Bóng bay navy vàng tươi vui cho tiệc mừng tốt nghiệp.' },
  ],
};

function build(type: Exclude<EventType, 'wedding'>, s: EvSpec, index: number): WeddingTemplate {
  const m = MESSAGES[type];
  const dark = isDark(s.colors.ground);
  const primary = dark ? s.colors.ink : darken(s.colors.ink, 0.05);
  const page = {
    primary,
    secondary: lighten(s.colors.ink, 0.6),
    background: dark ? '#FBF8F3' : lighten(s.colors.ground, 0.3),
    surface: dark ? lighten(s.colors.ink, 0.85) : s.colors.ground,
    text: '#3A3238',
    accent: s.colors.metal,
  };
  const slug = `${type === 'housewarming' ? 'tan-gia' : type === 'baby' ? 'day-thang' : type === 'opening' ? 'khai-truong' : type === 'graduation' ? 'tot-nghiep' : 'sinh-nhat'}-${s.key}`;
  return {
    id: `tpl-ev-${slug}`,
    name: s.name,
    slug,
    category: m.category,
    style: m.style,
    colorPalette: page,
    thumbnail: '',
    preview: '',
    description: s.description,
    isPremium: Boolean(s.premium),
    design: {
      fontHeading: 'Playfair Display, Georgia, serif',
      fontBody: 'Plus Jakarta Sans, sans-serif',
      fontScript: 'Dancing Script, cursive',
      palette: page,
      ornamentStyle: 'sparkle',
      envelopeColor: s.colors.ground,
      envelopeLiningColor: page.background,
      sealColor: s.colors.ink,
      heroLayout: 'centered',
      backgroundPattern: 'none',
      motif: { id: s.motif, variant: s.variant, kicker: s.kicker, ...s.colors },
    },
    defaultInvitationMessage: m.invite,
    defaultThankYouMessage: m.thanks,
    colorTags: s.colorTags,
    colorName: s.colorName,
    status: 'published',
    sortOrder: 2000 + index,
    eventType: type,
  };
}

export const EVENT_TEMPLATES: WeddingTemplate[] = (Object.keys(SPECS) as Exclude<EventType, 'wedding'>[]).flatMap((type) =>
  SPECS[type].map((s, i) => build(type, s, i))
);

export function templatesOfType(list: WeddingTemplate[], type: EventType): WeddingTemplate[] {
  return list.filter((t) => (t.eventType || 'wedding') === type);
}
