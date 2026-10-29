import React from 'react';
import { WeddingTemplate } from '../types/wedding';
import { InvitationArtCard } from './templateArt/InvitationArtCard';
import { eventConfig } from '../data/eventTypes';
import { HOT_THEME_MAP } from '../data/hotThemes';

/**
 * Ảnh đại diện mẫu thiệp: dùng ảnh thumbnail nếu có, nếu không (mẫu sự kiện vẽ bằng SVG)
 * thì hiển thị trực tiếp tấm thiệp minh họa với dữ liệu mẫu.
 */
export const TemplateThumb: React.FC<{ template: WeddingTemplate; className?: string; large?: boolean }> = ({
  template,
  className = '',
  large,
}) => {
  const src = large ? template.preview || template.thumbnail : template.thumbnail;
  const hot = template.design.hotTheme ? HOT_THEME_MAP[template.design.hotTheme] : undefined;
  if (hot) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`} style={{ background: hot.c.deep }}>
        <img src={hot.photos.hero} alt={template.name} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 40%, ${hot.c.deep}f0 100%)` }} />
        <div className="absolute inset-x-0 bottom-0 p-4 text-center" style={{ color: hot.c.onDeep }}>
          <p className="text-2xl leading-tight" style={{ fontFamily: hot.script, fontWeight: 700 }}>
            Hải Nam <span style={{ fontFamily: hot.serif }}>&</span> Khánh Linh
          </p>
          <p className="text-[10px] uppercase tracking-[0.3em] mt-1">{hot.kicker}</p>
        </div>
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-black tracking-wider shadow">HOT</span>
      </div>
    );
  }
  if (!src && template.design.motif) {
    const ev = eventConfig(template.eventType);
    return (
      <div className={`w-full h-full ${className}`} style={{ background: template.design.motif.ground }}>
        <InvitationArtCard
          motif={template.design.motif}
          groomName={ev.sample.name}
          brideName={ev.sample.subtitle}
          weddingDate="2026-12-20"
          weddingTime={ev.timeline[0]?.time}
          venueName={ev.sample.venue}
          className="w-full h-full"
        />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={template.name}
      loading="lazy"
      decoding="async"
      className={`w-full h-full object-cover ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
