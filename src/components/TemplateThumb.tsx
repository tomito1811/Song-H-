import React from 'react';
import { WeddingTemplate } from '../types/wedding';
import { InvitationArtCard } from './templateArt/InvitationArtCard';
import { eventConfig } from '../data/eventTypes';

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
