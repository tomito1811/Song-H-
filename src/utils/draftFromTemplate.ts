import { WeddingInvitation, WeddingTemplate } from '../types/wedding';
import { WEDDING_TRACKS } from '../data/music';
import { sampleAlbumFor } from '../data/sampleAlbum';

const SAMPLE_GALLERY = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=75',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=75',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1000&q=75',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1000&q=75',
  'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1000&q=75',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1000&q=75',
];

/** Tạo thiệp nháp từ mẫu. `sample = true` điền sẵn dữ liệu mẫu để làm trang demo. */
export function draftFromTemplate(
  template: WeddingTemplate,
  userId = '',
  sample = false
): WeddingInvitation {
  const now = new Date().toISOString();
  const demoDate = new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const isArt = Boolean(template.design.motif);

  return {
    id: sample ? `demo-${template.slug}` : `draft-${Date.now()}`,
    slug: sample ? `demo-${template.slug}` : '',
    userId,
    title: sample ? `Demo — ${template.name}` : 'Thiệp Cưới Mới',
    status: sample ? 'published' : 'draft',
    templateId: template.id,
    brideName: sample ? 'Thu Hà' : '',
    groomName: sample ? 'Minh Khang' : '',
    brideTitle: 'Cô Dâu',
    groomTitle: 'Chú Rể',
    brideParents: sample ? { father: 'Ông Trần Văn Bình', mother: 'Bà Lê Thị Mai' } : { father: '', mother: '' },
    groomParents: sample ? { father: 'Ông Nguyễn Văn Hùng', mother: 'Bà Phạm Thị Lan' } : { father: '', mother: '' },
    weddingDate: sample ? demoDate : '',
    weddingTime: '11:00',
    lunarDate: '',
    venueName: sample ? 'Trung tâm Tiệc cưới Hoa Hồng' : '',
    venueAddress: sample ? '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh' : '',
    mapUrl: '',
    invitationMessage: template.defaultInvitationMessage,
    thankYouMessage: template.defaultThankYouMessage,
    // Mẫu minh họa (design.motif) tự vẽ thiệp từ dữ liệu thật, không cần ảnh bìa mẫu.
    coverImage: isArt ? '' : template.preview,
    galleryImages: sample ? [...sampleAlbumFor(template), ...SAMPLE_GALLERY.slice(0, 2)] : isArt ? [] : [template.preview],
    musicUrl: WEDDING_TRACKS[0].url,
    design: { ...template.design, musicTitle: WEDDING_TRACKS[0].title },
    sectionsVisibility: {
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
    loveStories: [
      {
        id: 'story-1',
        yearOrDate: sample ? '2021' : '',
        title: 'Lần Đầu Gặp Gỡ',
        description: 'Những ánh mắt đầu tiên trao nhau và bắt đầu một hành trình yêu thương.',
      },
      {
        id: 'story-2',
        yearOrDate: sample ? '2025' : '',
        title: 'Lời Hứa Nguyện Ước',
        description: 'Khoảnh khắc trao chiếc nhẫn ước định ngày về chung một mái nhà.',
      },
    ],
    timelineEvents: [
      { id: 'time-1', time: '10:30', title: 'Đón Khách', description: 'Đón tiếp quý khách và chụp hình lưu niệm.' },
      { id: 'time-2', time: '11:30', title: 'Làm Lễ', description: 'Nghi thức trao nhẫn và cắt bánh cưới.' },
      { id: 'time-3', time: '12:00', title: 'Khai Tiệc', description: 'Bữa tiệc mừng hạnh phúc cùng gia đình hai bên.' },
    ],
    giftBank: {
      enabled: sample,
      bankName: 'TPBank',
      accountNumber: sample ? '0000000000' : '',
      accountHolder: sample ? 'NGUYEN MINH KHANG' : '',
      note: 'Mừng cưới',
    },
    viewsCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}
