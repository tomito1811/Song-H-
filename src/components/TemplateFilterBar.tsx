import React from 'react';
import type { ColorTag, TemplateCollection, WeddingTemplate } from '../types/wedding';
import { TEMPLATE_COLLECTIONS, COLOR_TAGS } from '../data/premiumTemplates';

export type CollectionFilter = 'all' | TemplateCollection;
export type ColorFilter = 'all' | ColorTag;

/** Mẫu được coi là đã xuất bản nếu không khai báo status (mẫu cũ) hoặc status = 'published'. */
export const isPublishedTemplate = (t: WeddingTemplate) => !t.status || t.status === 'published';

export function filterTemplates(list: WeddingTemplate[], collection: CollectionFilter, color: ColorFilter) {
  return list.filter(
    (t) =>
      isPublishedTemplate(t) &&
      (collection === 'all' || t.collection === collection) &&
      (color === 'all' || (t.colorTags || []).includes(color))
  );
}

interface Props {
  templates: WeddingTemplate[];
  collection: CollectionFilter;
  color: ColorFilter;
  onCollectionChange: (c: CollectionFilter) => void;
  onColorChange: (c: ColorFilter) => void;
  compact?: boolean;
}

/** Bộ lọc chủ đề + màu sắc dùng chung cho dải Soft Focus Ribbon và thư viện mẫu. */
export const TemplateFilterBar: React.FC<Props> = ({ templates, collection, color, onCollectionChange, onColorChange, compact }) => {
  const countFor = (c: CollectionFilter) => filterTemplates(templates, c, color).length;
  const colorCount = (k: ColorFilter) => filterTemplates(templates, collection, k).length;
  const chip =
    'shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#C76A82]';
  const on = 'bg-[#453C45] text-white border-[#453C45] dark:bg-[#F5EDE8] dark:text-[#1F1A1F] dark:border-[#F5EDE8]';
  const off =
    'bg-white dark:bg-[#2A232A] text-[#453C45] dark:text-[#F5EDE8] border-[#E8B7C8]/50 dark:border-[#3D333D] hover:border-[#C76A82]';

  return (
    <div className={`space-y-2.5 ${compact ? '' : 'mb-2'}`}>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap" role="group" aria-label="Lọc theo chủ đề">
        <button type="button" className={`${chip} ${collection === 'all' ? on : off}`} aria-pressed={collection === 'all'} onClick={() => onCollectionChange('all')}>
          Tất cả chủ đề
        </button>
        {TEMPLATE_COLLECTIONS.map((c) => {
          const n = countFor(c.id);
          return (
            <button
              key={c.id}
              type="button"
              disabled={n === 0}
              aria-pressed={collection === c.id}
              onClick={() => onCollectionChange(c.id)}
              title={c.label}
              className={`${chip} ${collection === c.id ? on : off} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {c.short} <span className="opacity-60 font-normal">({n})</span>
            </button>
          );
        })}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap items-center" role="group" aria-label="Lọc theo màu sắc">
        <span className="text-[11px] uppercase tracking-wider text-[#827580] dark:text-[#B9A9B4] shrink-0 mr-1">Màu</span>
        <button type="button" className={`${chip} ${color === 'all' ? on : off}`} aria-pressed={color === 'all'} onClick={() => onColorChange('all')}>
          Tất cả
        </button>
        {COLOR_TAGS.map((c) => {
          const n = colorCount(c.id);
          if (n === 0 && color !== c.id) return null;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={color === c.id}
              onClick={() => onColorChange(c.id)}
              className={`${chip} ${color === c.id ? on : off} inline-flex items-center gap-1.5`}
            >
              <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: c.swatch }} aria-hidden />
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/** 3 màu đại diện để hiển thị chấm màu: ưu tiên màu của thiệp minh họa. */
export function templateSwatches(t: WeddingTemplate): [string, string, string] {
  const m = t.design.motif;
  if (m) return [m.ground, m.ink === m.ground ? m.soft || m.text || m.ink : m.ink, m.metal];
  return [t.colorPalette.primary, t.colorPalette.secondary, t.colorPalette.background];
}
