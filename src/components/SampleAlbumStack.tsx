import React from 'react';
import { Camera } from 'lucide-react';
import { WeddingTemplate } from '../types/wedding';
import { sampleAlbumFor } from '../data/sampleAlbum';

/** Chồng 3 ảnh cưới mẫu đặt ở góc thẻ mẫu nổi bật — cho thấy thiệp có album ảnh thật. */
export const SampleAlbumStack: React.FC<{ template: WeddingTemplate; className?: string }> = ({ template, className = '' }) => {
  const photos = sampleAlbumFor(template, true).slice(0, 3);
  return (
    <div className={`pointer-events-none ${className}`}>
      <div className="relative w-[92px] h-[112px]">
        {photos
          .slice()
          .reverse()
          .map((src, i) => {
            const idx = photos.length - 1 - i;
            const rot = [-2, 9, -11][idx];
            const shift = [0, 14, -14][idx];
            return (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute bottom-0 right-2 w-[70px] h-[96px] object-cover rounded-md border-[3px] border-white shadow-lg transition-transform duration-500 group-hover:scale-105"
                style={{ transform: `translateX(${shift}px) rotate(${rot}deg)` }}
              />
            );
          })}
      </div>
      <span className="mt-1 ml-auto w-max flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
        <Camera className="w-3 h-3" /> Album ảnh cưới mẫu
      </span>
    </div>
  );
};
