import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface WatermarkOverlayProps {
  showBadge?: boolean;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({ showBadge = true }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {/* Top sticky banner indicator */}
      {showBadge && (
        <div className="sticky top-0 z-40 bg-neutral-900/80 backdrop-blur-md text-white py-1.5 px-3 flex items-center justify-center gap-2 text-[11px] font-medium shadow-sm">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Bản xem trước chưa xuất bản • THIEPONL</span>
        </div>
      )}

      {/* Diagonal repeating pattern of watermark text */}
      <div className="absolute inset-0 flex flex-col justify-around opacity-15 rotate-[-25deg] scale-125">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-around whitespace-nowrap text-neutral-800 font-serif font-black tracking-widest text-lg sm:text-2xl"
          >
            <span>THIEPONL — BẢN XEM TRƯỚC</span>
            <span>•</span>
            <span>THIEPONL — BẢN XEM TRƯỚC</span>
            <span>•</span>
            <span>THIEPONL — BẢN XEM TRƯỚC</span>
          </div>
        ))}
      </div>
    </div>
  );
};
