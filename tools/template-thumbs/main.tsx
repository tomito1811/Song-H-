/**
 * Công cụ nội bộ: hiển thị mọi mẫu trong bộ sưu tập cao cấp bằng InvitationArtCard với dữ liệu mẫu,
 * để render ảnh thumbnail/preview (tools/template-thumbs/render.mjs). Không nằm trong bản build.
 */
import { createRoot } from 'react-dom/client';
import '../../src/index.css';
import { PREMIUM_COLLECTION_ALL } from '../../src/data/premiumTemplates';
import { InvitationArtCard } from '../../src/components/templateArt/InvitationArtCard';

const SAMPLE = {
  groomName: 'Minh Quân',
  brideName: 'Thảo Vy',
  weddingDate: '2026-12-20',
  weddingTime: '10:30',
  lunarDate: 'Nhằm ngày 12 tháng 11 năm Bính Ngọ',
  venueName: 'Trung Tâm Tiệc Cưới Hoa Sen',
  venueAddress: '123 Nguyễn Văn Linh, Quận 7, TP. Hồ Chí Minh',
};

const only = new URLSearchParams(location.search).get('slug');

createRoot(document.getElementById('root')!).render(
  <div className="grid">
    {PREMIUM_COLLECTION_ALL.filter((t) => !only || t.slug === only).map((t) => (
      <div key={t.slug} className="cell" data-slug={t.slug}>
        <InvitationArtCard motif={t.design.motif!} {...SAMPLE} />
      </div>
    ))}
  </div>
);
