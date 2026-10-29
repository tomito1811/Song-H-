import { WeddingInvitation, WeddingTemplate } from '../types/wedding';
import { WEDDING_TRACKS } from '../data/music';
import { sampleAlbumFor } from '../data/sampleAlbum';
import { eventConfig } from '../data/eventTypes';

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
  const evType = template.eventType || 'wedding';
  const isWedding = evType === 'wedding';
  const ev = eventConfig(evType);

  return {
    id: sample ? `demo-${template.slug}` : `draft-${Date.now()}`,
    slug: sample ? `demo-${template.slug}` : '',
    userId,
    title: sample ? `Demo — ${template.name}` : isWedding ? 'Thiệp Cưới Mới' : `${ev.label} mới`,
    status: sample ? 'published' : 'draft',
    templateId: template.id,
    ...(isWedding ? {} : { eventType: evType }),
    brideName: sample ? ev.sample.subtitle : '',
    groomName: sample ? ev.sample.name : '',
    brideTitle: 'Cô Dâu',
    groomTitle: 'Chú Rể',
    brideParents: sample ? { father: 'Ông Trần Văn Bình', mother: 'Bà Lê Thị Mai' } : { father: '', mother: '' },
    groomParents: sample ? { father: 'Ông Nguyễn Văn Hùng', mother: 'Bà Phạm Thị Lan' } : { father: '', mother: '' },
    weddingDate: sample ? demoDate : '',
    weddingTime: isWedding ? '11:00' : ev.timeline[0]?.time || '18:00',
    lunarDate: '',
    venueName: sample ? ev.sample.venue : '',
    venueAddress: sample ? ev.sample.address : '',
    mapUrl: '',
    invitationMessage: template.defaultInvitationMessage,
    thankYouMessage: template.defaultThankYouMessage,
    // Mẫu minh họa (design.motif) tự vẽ thiệp từ dữ liệu thật, không cần ảnh bìa mẫu.
    coverImage: isArt ? '' : template.preview,
    galleryImages: sample && isWedding ? [...sampleAlbumFor(template), ...SAMPLE_GALLERY.slice(0, 2)] : isArt ? [] : [template.preview],
    musicUrl: isWedding ? WEDDING_TRACKS[0].url : '',
    design: { ...template.design, musicTitle: isWedding ? WEDDING_TRACKS[0].title : '' },
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
      ...ev.sections,
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
    timelineEvents: ev.timeline.map((t, i) => ({ id: `time-${i + 1}`, ...t })),
    giftBank: {
      enabled: sample,
      bankName: 'TPBank',
      accountNumber: sample ? '0000000000' : '',
      accountHolder: sample ? 'NGUYEN VAN A' : '',
      note: isWedding ? 'Mừng cưới' : `Mừng ${ev.short.toLowerCase()}`,
    },
    viewsCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}
