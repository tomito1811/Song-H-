import { WeddingTemplate } from '../types/wedding';

/**
 * Album ảnh cưới mẫu (cô dâu chú rể thật) dùng cho trang demo & thẻ mẫu nổi bật.
 * Ảnh nằm trong public/assets/sample-album (WebP đã nén).
 */
export interface SamplePhoto {
  id: string;
  style: 'traditional' | 'modern';
}

const PHOTOS: SamplePhoto[] = [
  { id: 'co-phuc-do', style: 'traditional' },
  { id: 'vest-hoa-hong', style: 'modern' },
  { id: 'studio-hoa-hong-1', style: 'modern' },
  { id: 'studio-gang-tay', style: 'modern' },
  { id: 'studio-hoa-hong-2', style: 'modern' },
];

const base = () => `${import.meta.env.BASE_URL}assets/sample-album/`;
export const samplePhotoUrl = (id: string, thumb = false) => `${base()}${id}${thumb ? '-thumb' : ''}.webp`;

const TRADITIONAL_COLLECTIONS = ['truyen-thong', 'co-phuc', 'hoang-gia'];

function isTraditional(t: WeddingTemplate): boolean {
  return (
    t.category === 'traditional' ||
    (t.collection ? TRADITIONAL_COLLECTIONS.includes(t.collection) : false) ||
    (t.colorTags || []).includes('do')
  );
}

/** Thứ tự ảnh phù hợp phong cách mẫu (truyền thống → ảnh cổ phục lên đầu). */
export function sampleAlbumIds(t: WeddingTemplate): string[] {
  const trad = isTraditional(t);
  const sorted = [...PHOTOS].sort((a, b) => {
    const sa = a.style === (trad ? 'traditional' : 'modern') ? 0 : 1;
    const sb = b.style === (trad ? 'traditional' : 'modern') ? 0 : 1;
    return sa - sb;
  });
  // Xoay vòng theo mẫu để mỗi mẫu nổi bật có ảnh đầu khác nhau
  let h = 0;
  for (const c of t.id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const head = sorted.filter((p) => p.style === sorted[0].style);
  const rest = sorted.filter((p) => p.style !== sorted[0].style);
  const shift = h % head.length;
  return [...head.slice(shift), ...head.slice(0, shift), ...rest].map((p) => p.id);
}

export function sampleAlbumFor(t: WeddingTemplate, thumb = false): string[] {
  return sampleAlbumIds(t).map((id) => samplePhotoUrl(id, thumb));
}
