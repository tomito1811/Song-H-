import React from 'react';
import { Film, Check } from 'lucide-react';
import { GalleryEffect } from '../types/wedding';
import { GALLERY_EFFECTS, GallerySlideshow, defaultEffectForTemplate } from './GallerySlideshow';

interface GalleryEffectPickerProps {
  value?: GalleryEffect;
  templateId?: string;
  sampleImages?: string[];
  onChange: (effect: GalleryEffect) => void;
}

const FALLBACK_SAMPLES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=70',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=600&q=70',
];

/** Chọn hiệu ứng trình chiếu album, xem trước trực tiếp bằng ảnh của cặp đôi. */
export const GalleryEffectPicker: React.FC<GalleryEffectPickerProps> = ({
  value,
  templateId,
  sampleImages,
  onChange,
}) => {
  const current = value || defaultEffectForTemplate(templateId);
  const samples = sampleImages && sampleImages.length >= 2 ? sampleImages.slice(0, 6) : FALLBACK_SAMPLES;

  return (
    <div className="space-y-2.5 pt-2">
      <label className="text-xs font-semibold text-[#453C45] flex items-center gap-1.5">
        <Film className="w-3.5 h-3.5 text-[#C76A82]" /> Hiệu Ứng Trình Chiếu Album
      </label>
      <div className="grid grid-cols-2 gap-1.5">
        {GALLERY_EFFECTS.map((e) => {
          const active = current === e.id;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onChange(e.id)}
              title={e.hint}
              className={`text-left px-2.5 py-2 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                active ? 'border-[#C76A82] bg-[#F6DCE5]/40 text-[#C76A82] font-semibold' : 'border-neutral-200 text-[#453C45] hover:bg-neutral-50'
              }`}
            >
              <span className="flex items-center gap-1">
                {active && <Check className="w-3 h-3 shrink-0" />}
                {e.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="max-w-[220px] mx-auto">
        <GallerySlideshow images={samples} effect={current} intervalMs={2600} aspect="4 / 5" />
      </div>
      {!value && (
        <p className="text-[10px] text-[#827580] text-center">Đang dùng hiệu ứng mặc định của mẫu thiệp này.</p>
      )}
    </div>
  );
};
