import React, { useId } from 'react';
import type { MotifId, TemplateMotif } from '../../types/wedding';
import type { ArtColors, MotifLayout, MotifProps } from './motifTypes';
import { contrastRatio, isDark, safeId, lighten, darken, mix } from './artUtils';
import { SongHyArt, LongPhungArt, BachSuArt, NhatBinhArt } from './motifsTraditional';
import { MinimalArt, ThanhDiepArt, LienHoaArt, VuonKinhArt, HoaKhoArt, ChibiArt } from './motifsBotanical';
import { BaroqueArt, SantoriniArt } from './motifsLuxury';

const SERIF = "'Playfair Display', Georgia, serif";
const GARAMOND = "'Cormorant Garamond', Georgia, serif";
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const SCRIPT = "'Great Vibes', cursive";
const BRUSH = "'Alex Brush', cursive";
const DANCING = "'Dancing Script', cursive";
const ROUNDED = "'Quicksand', system-ui, sans-serif";

export const MOTIF_ART: Record<MotifId, React.FC<MotifProps>> = {
  'song-hy': SongHyArt,
  'long-phung': LongPhungArt,
  'minimal-monogram': MinimalArt,
  'thanh-diep': ThanhDiepArt,
  'lien-hoa': LienHoaArt,
  'vuon-kinh': VuonKinhArt,
  baroque: BaroqueArt,
  santorini: SantoriniArt,
  'bach-su': BachSuArt,
  'nhat-binh': NhatBinhArt,
  chibi: ChibiArt,
  'hoa-kho': HoaKhoArt,
};

export const MOTIF_LAYOUT: Record<MotifId, MotifLayout> = {
  'song-hy': {
    box: { top: 34, bottom: 14, left: 12, right: 12 },
    kicker: 'Lễ Thành Hôn',
    kickerFont: GARAMOND,
    nameFont: GARAMOND,
    nameWeight: 700,
    nameSize: 9.6,
    nameCase: 'upper',
    ampFont: SCRIPT,
    metaFont: GARAMOND,
    nameColor: 'metal',
    accentColor: 'metal',
    divider: 'diamond',
  },
  'long-phung': {
    box: { top: 50, bottom: 9, left: 11, right: 11 },
    kicker: 'Lễ Thành Hôn',
    kickerFont: GARAMOND,
    nameFont: GARAMOND,
    nameWeight: 700,
    nameSize: 7.6,
    nameCase: 'upper',
    ampFont: GARAMOND,
    ampText: '·  ❖  ·',
    metaFont: GARAMOND,
    nameColor: 'metal',
    accentColor: 'metal',
    divider: 'none',
  },
  'minimal-monogram': {
    box: { top: 30, bottom: 14, left: 12, right: 12 },
    kicker: 'Trân trọng kính mời',
    kickerFont: SANS,
    nameFont: SERIF,
    nameWeight: 500,
    nameSize: 9.4,
    ampFont: SCRIPT,
    metaFont: SANS,
    nameColor: 'ink',
    accentColor: 'metal',
    monogram: true,
    divider: 'line',
  },
  'thanh-diep': {
    box: { top: 36, bottom: 12, left: 18, right: 18 },
    kicker: 'Save the date · Lễ Thành Hôn',
    kickerFont: SANS,
    nameFont: GARAMOND,
    nameWeight: 600,
    nameSize: 9,
    ampFont: BRUSH,
    metaFont: SANS,
    nameColor: 'ink',
    accentColor: 'ink',
    divider: 'leaf',
  },
  'lien-hoa': {
    box: { top: 22, bottom: 42, left: 14, right: 14 },
    kicker: 'Lễ Thành Hôn',
    kickerFont: GARAMOND,
    nameFont: GARAMOND,
    nameWeight: 600,
    nameSize: 9.2,
    ampFont: SCRIPT,
    metaFont: GARAMOND,
    nameColor: 'ink',
    accentColor: 'metal',
    divider: 'dots',
  },
  'vuon-kinh': {
    box: { top: 41.5, bottom: 11.5, left: 21, right: 21 },
    kicker: 'Trân trọng kính mời',
    kickerFont: SANS,
    nameFont: SERIF,
    nameWeight: 600,
    nameSize: 7.6,
    ampFont: SCRIPT,
    metaFont: SANS,
    nameColor: 'ink',
    accentColor: 'metal',
    divider: 'leaf',
  },
  baroque: {
    box: { top: 22, bottom: 18, left: 14, right: 14 },
    kicker: 'Trân trọng kính mời',
    kickerFont: GARAMOND,
    nameFont: SCRIPT,
    nameWeight: 400,
    nameSize: 12.5,
    ampFont: GARAMOND,
    ampText: '&',
    metaFont: GARAMOND,
    nameColor: 'ink',
    accentColor: 'metal',
    divider: 'diamond',
  },
  santorini: {
    box: { top: 26, bottom: 32, left: 15, right: 15 },
    kicker: 'Chúng mình về chung một nhà',
    kickerFont: SANS,
    nameFont: SERIF,
    nameWeight: 600,
    nameSize: 8.4,
    ampFont: SCRIPT,
    metaFont: SANS,
    nameColor: 'ink',
    accentColor: 'ink',
    divider: 'line',
  },
  'bach-su': {
    box: { top: 24.5, bottom: 39.5, left: 21, right: 21 },
    venueBox: { top: 77, bottom: 9, left: 14, right: 14 },
    gap: 1.1,
    kicker: 'Lễ Thành Hôn',
    kickerFont: GARAMOND,
    nameFont: GARAMOND,
    nameWeight: 700,
    nameSize: 7.4,
    ampFont: SCRIPT,
    metaFont: GARAMOND,
    nameColor: 'ink',
    accentColor: 'ink',
    divider: 'diamond',
  },
  'nhat-binh': {
    box: { top: 43, bottom: 10, left: 10, right: 10 },
    kicker: 'Lễ Tân Hôn',
    kickerFont: GARAMOND,
    nameFont: GARAMOND,
    nameWeight: 700,
    nameSize: 9.4,
    nameCase: 'upper',
    ampFont: SCRIPT,
    metaFont: GARAMOND,
    nameColor: 'metal',
    accentColor: 'metal',
    divider: 'diamond',
  },
  chibi: {
    box: { top: 7, bottom: 45, left: 12, right: 12 },
    kicker: 'Tụi mình cưới nhau rồi!',
    kickerFont: ROUNDED,
    nameFont: DANCING,
    nameWeight: 700,
    nameSize: 9,
    ampFont: DANCING,
    metaFont: ROUNDED,
    nameColor: 'ink',
    accentColor: 'ink',
    divider: 'heart',
  },
  'hoa-kho': {
    box: { top: 7, bottom: 43, left: 12, right: 12 },
    kicker: 'Mời bạn đến chung vui',
    kickerFont: GARAMOND,
    nameFont: DANCING,
    nameWeight: 700,
    nameSize: 9.6,
    ampFont: GARAMOND,
    ampText: '&',
    metaFont: GARAMOND,
    nameColor: 'ink',
    accentColor: 'ink',
    divider: 'dots',
  },
};

export function resolveArtColors(m: TemplateMotif): ArtColors {
  const dark = isDark(m.ground);
  const fallbackText = dark ? lighten(m.metal, 0.55) : darken(m.ink, 0.35);
  let text = m.text || fallbackText;
  if (contrastRatio(text, m.ground) < 4.5) text = dark ? '#FFF8EC' : '#2A2022';
  return { ground: m.ground, ink: m.ink, metal: m.metal, soft: m.soft || lighten(m.ink, 0.75), text };
}

function ensureContrast(color: string, bg: string, min: number): string {
  const toward = isDark(bg) ? '#ffffff' : '#000000';
  let out = color;
  for (let i = 1; i <= 10 && contrastRatio(out, bg) < min; i++) out = mix(color, toward, i * 0.08);
  return out;
}

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function dateParts(dateStr?: string) {
  if (!dateStr) return null;
  const [y, mo, d] = dateStr.split('-').map(Number);
  if (!y || !mo || !d) return null;
  const dt = new Date(y, mo - 1, d);
  return { weekday: WEEKDAYS[dt.getDay()], d: String(d).padStart(2, '0'), m: String(mo).padStart(2, '0'), y: String(y) };
}

const initial = (name: string) => {
  const parts = name.trim().split(/\s+/);
  return (parts[parts.length - 1] || '').charAt(0).toUpperCase();
};

export interface InvitationArtCardProps {
  motif: TemplateMotif;
  groomName?: string;
  brideName?: string;
  weddingDate?: string;
  weddingTime?: string;
  lunarDate?: string;
  venueName?: string;
  venueAddress?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Tấm thiệp minh họa: lớp SVG trang trí + lớp chữ HTML (đảm bảo tiếng Việt hiển thị chuẩn
 * bằng font web, chữ tự co theo độ dài tên). Tỷ lệ cố định 3:4.
 */
export const InvitationArtCard: React.FC<InvitationArtCardProps> = ({
  motif,
  groomName,
  brideName,
  weddingDate,
  weddingTime,
  lunarDate,
  venueName,
  venueAddress,
  className = '',
  style,
  onClick,
}) => {
  const uid = 'a' + safeId(useId());
  const Art = MOTIF_ART[motif.id];
  const L = MOTIF_LAYOUT[motif.id];
  if (!Art || !L) return null;
  const c = resolveArtColors(motif);
  const pick = (k: 'ink' | 'metal' | 'text') => (k === 'ink' ? c.ink : k === 'metal' ? c.metal : c.text);
  // Bảo đảm chữ luôn đủ tương phản (≥ 3:1 cho chữ lớn / nhãn in hoa) với nền thiệp.
  const nameColor = ensureContrast(pick(L.nameColor), c.ground, 3);
  const accent = ensureContrast(pick(L.accentColor), c.ground, 3);

  const groom = groomName?.trim() || 'Tên Chú Rể';
  const bride = brideName?.trim() || 'Tên Cô Dâu';
  const longest = Math.max(groom.length, bride.length);
  const fit = Math.min(1, 12 / Math.max(longest, 1));
  const nameSize = `${(L.nameSize * Math.max(fit, 0.62)).toFixed(2)}cqw`;
  const dp = dateParts(weddingDate);
  const upper = L.nameCase === 'upper';

  const Divider = () => {
    const w = '22cqw';
    switch (L.divider) {
      case 'diamond':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.6cqw', justifyContent: 'center' }} aria-hidden>
            <span style={{ width: w, height: 1, background: accent, opacity: 0.8 }} />
            <span style={{ width: '1.6cqw', height: '1.6cqw', background: accent, transform: 'rotate(45deg)' }} />
            <span style={{ width: w, height: 1, background: accent, opacity: 0.8 }} />
          </div>
        );
      case 'dots':
        return (
          <div style={{ display: 'flex', gap: '1.4cqw', justifyContent: 'center' }} aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: '1cqw', height: '1cqw', borderRadius: 9, background: accent }} />
            ))}
          </div>
        );
      case 'heart':
        return (
          <div style={{ color: accent, fontSize: '3.6cqw', lineHeight: 1 }} aria-hidden>
            ♥
          </div>
        );
      case 'leaf':
        return (
          <svg viewBox="0 0 120 12" style={{ width: '26cqw', display: 'block', margin: '0 auto' }} aria-hidden>
            <path d="M0 6 H44 M76 6 H120" stroke={accent} strokeWidth="0.8" />
            <path d="M60 6 C54 0 48 0 44 6 C48 12 54 12 60 6 C66 0 72 0 76 6 C72 12 66 12 60 6 Z" fill={accent} />
          </svg>
        );
      case 'line':
        return <div style={{ width: '16cqw', height: 1, background: accent, margin: '0 auto', opacity: 0.8 }} aria-hidden />;
      default:
        return null;
    }
  };

  const venue =
    venueName || venueAddress ? (
      <div style={{ fontFamily: L.metaFont, lineHeight: 1.4 }}>
        {venueName && <p style={{ fontSize: '3.1cqw', fontWeight: 700, letterSpacing: '0.04em' }}>{venueName}</p>}
        {venueAddress && <p style={{ fontSize: '2.5cqw', opacity: 0.88 }}>{venueAddress}</p>}
      </div>
    ) : null;

  return (
    <div
      className={`relative overflow-hidden select-none ${className}`}
      style={{ aspectRatio: '3 / 4', containerType: 'inline-size', background: c.ground, ...style }}
      onClick={onClick}
      role="img"
      aria-label={`Thiệp cưới ${groom} và ${bride}`}
    >
      <svg viewBox="0 0 600 800" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <Art c={c} uid={uid} variant={motif.variant} />
      </svg>

      {L.monogram && (
        <div
          className="absolute flex items-center justify-center"
          style={{ left: '41.3%', width: '17.4%', top: `${(((motif.variant === 'arch' ? 190 : 150) - 46) / 800) * 100}%`, height: `${(92 / 800) * 100}%` }}
        >
          <span style={{ fontFamily: SERIF, fontSize: '5.6cqw', color: c.ink, letterSpacing: '0.04em' }}>
            {initial(groom)}
            <span style={{ fontFamily: SCRIPT, color: accent, fontSize: '4.4cqw', margin: '0 0.4cqw' }}>&</span>
            {initial(bride)}
          </span>
        </div>
      )}

      <div
        className="absolute flex flex-col items-center justify-center text-center"
        style={{
          top: `${L.box.top}%`,
          bottom: `${L.box.bottom}%`,
          left: `${L.box.left}%`,
          right: `${L.box.right}%`,
          color: c.text,
          gap: `${L.gap ?? 2.2}cqw`,
          fontVariantNumeric: 'lining-nums',
        }}
      >
        <p
          style={{
            fontFamily: L.kickerFont,
            fontSize: '2.7cqw',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: accent,
            fontWeight: 600,
            lineHeight: 1.35,
          }}
        >
          {L.kicker}
        </p>

        <div style={{ lineHeight: 1.08 }}>
          <p
            style={{
              fontFamily: L.nameFont,
              fontWeight: L.nameWeight,
              fontSize: nameSize,
              color: nameColor,
              textTransform: upper ? 'uppercase' : 'none',
              letterSpacing: upper ? '0.06em' : '0.01em',
              overflowWrap: 'anywhere',
            }}
          >
            {groom}
          </p>
          <p style={{ fontFamily: L.ampFont, fontSize: L.ampText && L.ampText.length > 2 ? '3cqw' : '7cqw', color: accent, lineHeight: 1.1, margin: '0.4cqw 0' }}>
            {L.ampText || '&'}
          </p>
          <p
            style={{
              fontFamily: L.nameFont,
              fontWeight: L.nameWeight,
              fontSize: nameSize,
              color: nameColor,
              textTransform: upper ? 'uppercase' : 'none',
              letterSpacing: upper ? '0.06em' : '0.01em',
              overflowWrap: 'anywhere',
            }}
          >
            {bride}
          </p>
        </div>

        <Divider />

        <div style={{ fontFamily: L.metaFont, lineHeight: 1.45 }}>
          {dp ? (
            <>
              <p style={{ fontSize: '2.9cqw', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                {dp.weekday}
                {weddingTime ? ` · ${weddingTime}` : ''}
              </p>
              <p style={{ fontSize: '6.2cqw', fontWeight: 600, color: nameColor, letterSpacing: '0.06em', lineHeight: 1.15 }}>
                {dp.d}
                <span style={{ opacity: 0.6, margin: '0 1cqw' }}>.</span>
                {dp.m}
                <span style={{ opacity: 0.6, margin: '0 1cqw' }}>.</span>
                {dp.y}
              </p>
            </>
          ) : (
            <p style={{ fontSize: '3.2cqw', fontWeight: 600 }}>Ngày cưới</p>
          )}
          {lunarDate && <p style={{ fontSize: '2.6cqw', fontStyle: 'italic', opacity: 0.9 }}>{lunarDate}</p>}
        </div>

        {!L.venueBox && venue}
      </div>
      {L.venueBox && venue && (
        <div
          className="absolute flex flex-col items-center justify-center text-center"
          style={{ top: `${L.venueBox.top}%`, bottom: `${L.venueBox.bottom}%`, left: `${L.venueBox.left}%`, right: `${L.venueBox.right}%`, color: c.text }}
        >
          {venue}
        </div>
      )}
    </div>
  );
};

export default InvitationArtCard;
