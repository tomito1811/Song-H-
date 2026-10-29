import { EventType, SectionsVisibility } from '../types/wedding';

/** Nội dung & nhãn riêng của từng loại thiệp. */
export interface EventTypeConfig {
  id: EventType;
  label: string;
  short: string;
  emoji: string;
  description: string;
  /** Nhãn ô nhập tên chính (groomName) & dòng phụ (brideName) trong trình thiết kế. */
  nameLabel: string;
  namePlaceholder: string;
  subtitleLabel: string;
  subtitlePlaceholder: string;
  /** Chữ hiển thị trên thiệp công khai. */
  headline: string;
  openCta: string;
  eventInfoTitle: string;
  programTitle: string;
  albumTitle: string;
  hostsRef: string; // "cô dâu chú rể", "gia chủ", ...
  giftTitle: string;
  giftNote: string;
  wishPlaceholder: string;
  rsvpNote: string;
  sections: Partial<SectionsVisibility>;
  sample: { name: string; subtitle: string; venue: string; address: string };
  timeline: { time: string; title: string; description: string }[];
}

const BASE_SECTIONS: Partial<SectionsVisibility> = { parents: false, loveStory: false };

export const EVENT_TYPES: EventTypeConfig[] = [
  {
    id: 'wedding',
    label: 'Thiệp cưới',
    short: 'Cưới',
    emoji: '💍',
    description: 'Thiệp cưới online sang trọng, đầy đủ RSVP, sổ lưu bút, hộp mừng cưới.',
    nameLabel: 'Tên chú rể',
    namePlaceholder: 'Minh Khang',
    subtitleLabel: 'Tên cô dâu',
    subtitlePlaceholder: 'Thu Hà',
    headline: 'Wedding Invitation',
    openCta: 'Chạm để mở thiệp cưới',
    eventInfoTitle: 'Tiệc Cưới Thân Mật',
    programTitle: 'Chương Trình Hôn Lễ',
    albumTitle: 'Album Ảnh Cưới',
    hostsRef: 'cô dâu chú rể',
    giftTitle: 'Hộp Mừng Cưới',
    giftNote: 'Nếu không thể đến dự tiệc trực tiếp, quý khách có thể gửi quà mừng qua tài khoản ngân hàng dưới đây.',
    wishPlaceholder: 'Viết lời chúc ngọt ngào nhất gửi đến cô dâu chú rể...',
    rsvpNote: 'Để buổi tiệc được chuẩn bị chu đáo nhất, quý khách vui lòng xác nhận trước ngày cưới.',
    sections: {},
    sample: { name: 'Minh Khang', subtitle: 'Thu Hà', venue: 'Trung tâm Tiệc cưới Hoa Hồng', address: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh' },
    timeline: [
      { time: '10:30', title: 'Đón Khách', description: 'Đón tiếp quý khách và chụp hình lưu niệm.' },
      { time: '11:30', title: 'Làm Lễ', description: 'Nghi thức trao nhẫn và cắt bánh cưới.' },
      { time: '12:00', title: 'Khai Tiệc', description: 'Bữa tiệc mừng hạnh phúc cùng gia đình hai bên.' },
    ],
  },
  {
    id: 'birthday',
    label: 'Thiệp sinh nhật',
    short: 'Sinh nhật',
    emoji: '🎂',
    description: 'Mời tiệc sinh nhật người lớn & bé yêu: bóng bay, bánh kem, pháo giấy rực rỡ.',
    nameLabel: 'Tên người mừng sinh nhật',
    namePlaceholder: 'Bảo Ngọc',
    subtitleLabel: 'Dòng phụ (tuổi, lời nhắn ngắn)',
    subtitlePlaceholder: 'Tròn 25 tuổi',
    headline: 'Birthday Party',
    openCta: 'Chạm để mở thiệp sinh nhật',
    eventInfoTitle: 'Tiệc Sinh Nhật',
    programTitle: 'Chương Trình Bữa Tiệc',
    albumTitle: 'Khoảnh Khắc Đáng Nhớ',
    hostsRef: 'nhân vật chính',
    giftTitle: 'Gửi Quà Sinh Nhật',
    giftNote: 'Nếu không thể đến dự, bạn có thể gửi quà mừng sinh nhật qua tài khoản dưới đây.',
    wishPlaceholder: 'Gửi lời chúc mừng sinh nhật thật dễ thương...',
    rsvpNote: 'Xác nhận tham dự giúp bữa tiệc được chuẩn bị chu đáo nhé!',
    sections: { ...BASE_SECTIONS },
    sample: { name: 'Bảo Ngọc', subtitle: 'Tròn 25 tuổi', venue: 'Nhà hàng Sky Garden', address: '45 Lê Lợi, Quận 1, TP. Hồ Chí Minh' },
    timeline: [
      { time: '18:00', title: 'Đón Khách', description: 'Check-in, chụp ảnh cùng background tiệc.' },
      { time: '18:30', title: 'Thổi Nến & Cắt Bánh', description: 'Cùng hát mừng sinh nhật.' },
      { time: '19:00', title: 'Tiệc & Trò Chơi', description: 'Ăn uống, giao lưu, bốc thăm quà.' },
    ],
  },
  {
    id: 'housewarming',
    label: 'Thiệp tân gia',
    short: 'Tân gia',
    emoji: '🏡',
    description: 'Mừng nhà mới: ngôi nhà ấm áp, chìa khóa vàng, cây xanh may mắn.',
    nameLabel: 'Gia đình / gia chủ',
    namePlaceholder: 'Gia đình Anh Tuấn',
    subtitleLabel: 'Dòng phụ',
    subtitlePlaceholder: 'Mừng về nhà mới',
    headline: 'Housewarming',
    openCta: 'Chạm để mở thiệp tân gia',
    eventInfoTitle: 'Tiệc Mừng Nhà Mới',
    programTitle: 'Chương Trình Buổi Tiệc',
    albumTitle: 'Tổ Ấm Mới',
    hostsRef: 'gia chủ',
    giftTitle: 'Quà Mừng Tân Gia',
    giftNote: 'Nếu không thể ghé chơi, bạn có thể gửi quà mừng tân gia qua tài khoản dưới đây.',
    wishPlaceholder: 'Chúc gia chủ an cư lạc nghiệp, vạn sự như ý...',
    rsvpNote: 'Gia chủ rất mong được đón bạn — xác nhận giúp nhé!',
    sections: { ...BASE_SECTIONS },
    sample: { name: 'Gia đình Anh Tuấn', subtitle: 'Mừng về nhà mới', venue: 'Căn hộ 12A08 · The Sun Avenue', address: '28 Mai Chí Thọ, TP. Thủ Đức' },
    timeline: [
      { time: '17:30', title: 'Cúng Nhập Trạch', description: 'Nghi lễ về nhà mới.' },
      { time: '18:30', title: 'Tham Quan Nhà', description: 'Gia chủ dẫn khách tham quan tổ ấm.' },
      { time: '19:00', title: 'Tiệc Mừng', description: 'Dùng bữa, chúc tụng, giao lưu.' },
    ],
  },
  {
    id: 'baby',
    label: 'Đầy tháng / Thôi nôi',
    short: 'Đầy tháng',
    emoji: '👶',
    description: 'Mừng bé đầy tháng, thôi nôi: mây trời, gấu bông, sao trăng pastel.',
    nameLabel: 'Tên bé',
    namePlaceholder: 'Bé Su',
    subtitleLabel: 'Dòng phụ',
    subtitlePlaceholder: 'Tròn 1 tuổi',
    headline: 'Baby Celebration',
    openCta: 'Chạm để mở thiệp của bé',
    eventInfoTitle: 'Tiệc Mừng Bé Yêu',
    programTitle: 'Chương Trình Buổi Lễ',
    albumTitle: 'Bé Yêu Lớn Từng Ngày',
    hostsRef: 'bố mẹ bé',
    giftTitle: 'Quà Mừng Bé',
    giftNote: 'Nếu không thể đến dự, bạn có thể gửi quà mừng bé qua tài khoản của bố mẹ dưới đây.',
    wishPlaceholder: 'Chúc bé hay ăn chóng lớn, luôn khỏe mạnh...',
    rsvpNote: 'Bố mẹ bé mong được đón bạn — xác nhận giúp nhé!',
    sections: { ...BASE_SECTIONS },
    sample: { name: 'Bé Su', subtitle: 'Tròn 1 tuổi', venue: 'Nhà hàng Hương Sen', address: '10 Phan Xích Long, Phú Nhuận, TP. Hồ Chí Minh' },
    timeline: [
      { time: '10:00', title: 'Cúng Mụ', description: 'Lễ tạ ơn bà Mụ cho bé.' },
      { time: '10:45', title: 'Bé Bốc Đồ', description: 'Trò chơi chọn nghề vui nhộn.' },
      { time: '11:30', title: 'Tiệc Trưa', description: 'Dùng bữa cùng gia đình & bạn bè.' },
    ],
  },
  {
    id: 'opening',
    label: 'Khai trương & Sự kiện',
    short: 'Khai trương',
    emoji: '🎉',
    description: 'Khai trương cửa hàng, hội nghị, tiệc công ty, tất niên — chuyên nghiệp, sang trọng.',
    nameLabel: 'Tên cửa hàng / sự kiện',
    namePlaceholder: 'Mộc Café',
    subtitleLabel: 'Dòng phụ',
    subtitlePlaceholder: 'Chi nhánh Quận 3',
    headline: 'Grand Opening',
    openCta: 'Chạm để mở thư mời',
    eventInfoTitle: 'Thông Tin Sự Kiện',
    programTitle: 'Chương Trình Sự Kiện',
    albumTitle: 'Hình Ảnh Không Gian',
    hostsRef: 'ban tổ chức',
    giftTitle: 'Gửi Lẵng Hoa / Quà Mừng',
    giftNote: 'Quý khách có thể gửi quà mừng khai trương qua tài khoản dưới đây.',
    wishPlaceholder: 'Chúc khai trương hồng phát, buôn may bán đắt...',
    rsvpNote: 'Vui lòng xác nhận để ban tổ chức chuẩn bị chu đáo.',
    sections: { ...BASE_SECTIONS },
    sample: { name: 'Mộc Café', subtitle: 'Chi nhánh Quận 3', venue: 'Mộc Café', address: '88 Võ Văn Tần, Quận 3, TP. Hồ Chí Minh' },
    timeline: [
      { time: '08:30', title: 'Đón Khách', description: 'Đón tiếp quý khách mời.' },
      { time: '09:00', title: 'Cắt Băng Khai Trương', description: 'Nghi thức khai trương & múa lân.' },
      { time: '09:30', title: 'Tiệc Nhẹ & Trải Nghiệm', description: 'Thưởng thức & nhận ưu đãi khai trương.' },
    ],
  },
  {
    id: 'graduation',
    label: 'Thiệp tốt nghiệp',
    short: 'Tốt nghiệp',
    emoji: '🎓',
    description: 'Mời dự lễ tốt nghiệp: mũ cử nhân, vòng nguyệt quế, tông trang trọng.',
    nameLabel: 'Tên tân cử nhân',
    namePlaceholder: 'Nguyễn Hoàng Nam',
    subtitleLabel: 'Ngành / trường',
    subtitlePlaceholder: 'Cử nhân Kinh tế · ĐH Kinh tế TP.HCM',
    headline: 'Graduation',
    openCta: 'Chạm để mở thiệp tốt nghiệp',
    eventInfoTitle: 'Lễ Tốt Nghiệp',
    programTitle: 'Chương Trình Buổi Lễ',
    albumTitle: 'Hành Trình Thanh Xuân',
    hostsRef: 'tân cử nhân',
    giftTitle: 'Quà Mừng Tốt Nghiệp',
    giftNote: 'Nếu không thể đến dự, bạn có thể gửi quà chúc mừng qua tài khoản dưới đây.',
    wishPlaceholder: 'Chúc mừng tân cử nhân, chúc bạn vững bước tương lai...',
    rsvpNote: 'Xác nhận tham dự để mình chuẩn bị chỗ ngồi nhé!',
    sections: { ...BASE_SECTIONS },
    sample: { name: 'Hoàng Nam', subtitle: 'Cử nhân Kinh tế', venue: 'Hội trường A · ĐH Kinh tế TP.HCM', address: '59C Nguyễn Đình Chiểu, Quận 3, TP. Hồ Chí Minh' },
    timeline: [
      { time: '07:30', title: 'Check-in', description: 'Nhận lễ phục, chụp ảnh cùng bạn bè.' },
      { time: '08:30', title: 'Lễ Trao Bằng', description: 'Nghi thức trao bằng tốt nghiệp.' },
      { time: '10:30', title: 'Chụp Ảnh Lưu Niệm', description: 'Cùng gia đình & thầy cô.' },
    ],
  },
];

export const EVENT_TYPE_MAP: Record<EventType, EventTypeConfig> = Object.fromEntries(
  EVENT_TYPES.map((e) => [e.id, e])
) as Record<EventType, EventTypeConfig>;

export function eventConfig(t?: EventType | null): EventTypeConfig {
  return EVENT_TYPE_MAP[t || 'wedding'] || EVENT_TYPE_MAP.wedding;
}
