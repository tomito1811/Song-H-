import { WeddingTemplate } from '../types/wedding';
import { HOT_THEMES } from './hotThemes';

/** 8 mẫu thiệp cưới HOT (giao diện trang dài, ảnh thật, nhạc, bản đồ, RSVP, lời chúc, hộp mừng). */
export const HOT_TEMPLATES: WeddingTemplate[] = HOT_THEMES.map((t, i) => {
  const palette = {
    primary: t.c.deep,
    secondary: t.c.accent,
    background: t.c.bg,
    surface: t.c.card,
    text: t.dark ? '#3B2F2A' : t.c.text,
    accent: t.c.accent,
  };
  return {
    id: `tpl-hot-${t.id}`,
    name: `${t.name}`,
    slug: `hot-${t.id}`,
    category: 'classic',
    style: 'Mẫu HOT 2026',
    colorPalette: palette,
    thumbnail: t.photos.hero,
    preview: t.photos.hero,
    description: t.tagline,
    isPremium: true,
    design: {
      fontHeading: 'Cormorant Garamond, serif',
      fontBody: 'Plus Jakarta Sans, sans-serif',
      fontScript: 'Dancing Script, cursive',
      palette,
      ornamentStyle: 'botanical',
      envelopeColor: t.c.deep,
      envelopeLiningColor: t.c.card,
      sealColor: t.c.accent,
      heroLayout: 'centered',
      backgroundPattern: 'none',
      hotTheme: t.id,
    },
    defaultInvitationMessage:
      'Trân trọng kính mời quý khách đến chung vui cùng gia đình chúng tôi trong ngày trọng đại. Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình.',
    defaultThankYouMessage: 'Cảm ơn bạn đã là một phần trong ngày đặc biệt của chúng tôi!',
    status: 'published',
    sortOrder: -100 + i,
    featured: true,
    hot: true,
  };
});
