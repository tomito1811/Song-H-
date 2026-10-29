import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Volume2,
  VolumeX,
  Gift,
  Send,
  CheckCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  Copy,
  Users,
  Gem,
  Camera,
  Utensils,
  Music2,
  GlassWater,
  X,
} from 'lucide-react';
import { WeddingInvitation, Wish, Guest } from '../types/wedding';
import { HotTheme } from '../data/hotThemes';
import { calculateCountdown, generateQrDataUrl } from '../utils/formatters';
import { submitRsvp, fetchWishes, submitWish } from '../utils/api';
import { submitGift } from '../utils/engagement';
import { SignaturePad } from './SignaturePad';
import { findTrackByUrl } from '../data/music';
import { WatermarkOverlay } from './WatermarkOverlay';

interface Props {
  invitation: WeddingInvitation;
  theme: HotTheme;
  guest: Guest | null;
  noWrite: boolean;
  isPreviewMode?: boolean;
  sandboxLabel?: string;
}

const WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function parts(date?: string) {
  const [y, m, d] = (date || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return { d: String(d).padStart(2, '0'), m: String(m).padStart(2, '0'), y: String(y), wd: WD[dt.getDay()], dt };
}

const initialOf = (n: string) => (n.trim().split(/\s+/).pop() || '').charAt(0).toUpperCase();

/* ---------- Hoa văn trang trí (SVG nhẹ, tô theo màu theme) ---------- */
const Deco: React.FC<{ kind: HotTheme['deco']; color: string; accent: string; className?: string; style?: React.CSSProperties; flip?: boolean }> = ({
  kind,
  color,
  accent,
  className = '',
  style,
  flip,
}) => {
  const t = flip ? 'scale(-1,1) translate(-120,0)' : undefined;
  return (
    <svg viewBox="0 0 120 160" className={`pointer-events-none ${className}`} style={style} aria-hidden>
      <g transform={t}>
        {kind === 'rose' && (
          <>
            <path d="M20 160 C30 120 40 90 70 60" stroke="#5E7A4E" strokeWidth="2.5" fill="none" />
            <path d="M44 112 c-14 -6 -24 4 -24 14 c12 2 22 -2 24 -14z M58 84 c14 -8 26 0 26 10 c-12 4 -22 0 -26 -10z" fill="#6E8B5A" />
            {[
              [70, 52, 22],
              [36, 92, 14],
              [88, 96, 11],
            ].map(([x, y, r], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r={r} fill={color} />
                <path d={`M${x - r * 0.6} ${y} a${r * 0.6} ${r * 0.6} 0 1 1 ${r * 1.2} 0`} stroke="#fff" strokeOpacity=".25" strokeWidth="2" fill="none" />
                <circle cx={x} cy={y} r={r * 0.45} fill="#000" fillOpacity=".15" />
              </g>
            ))}
          </>
        )}
        {kind === 'leaf' && (
          <>
            <path d="M10 160 C40 110 60 70 100 20" stroke={color} strokeWidth="2" fill="none" />
            {Array.from({ length: 8 }).map((_, i) => {
              const x = 18 + i * 10;
              const y = 145 - i * 16;
              return <ellipse key={i} cx={x + (i % 2 ? 10 : -6)} cy={y} rx="12" ry="5" fill={color} fillOpacity={0.75} transform={`rotate(${i % 2 ? -35 : 35} ${x} ${y})`} />;
            })}
            <circle cx="98" cy="22" r="9" fill="#fff" stroke={accent} />
            <circle cx="40" cy="100" r="7" fill="#fff" stroke={accent} />
          </>
        )}
        {kind === 'lavender' && (
          <>
            {[30, 55, 80].map((x, k) => (
              <g key={k}>
                <path d={`M${x} 160 Q${x + 6} 100 ${x + 14 - k * 6} 30`} stroke="#7C9467" strokeWidth="1.6" fill="none" />
                {Array.from({ length: 9 }).map((_, i) => (
                  <ellipse key={i} cx={x + 12 - k * 6 - i * 0.6 + (i % 2 ? 4 : -4)} cy={36 + i * 8} rx="4" ry="6" fill={i % 3 ? color : accent} fillOpacity=".85" />
                ))}
              </g>
            ))}
          </>
        )}
        {kind === 'dried' && (
          <>
            <path d="M40 160 C44 110 52 70 70 20" stroke="#7A5A3A" strokeWidth="1.6" fill="none" />
            <path d="M60 160 C70 120 86 90 100 50" stroke="#7A5A3A" strokeWidth="1.4" fill="none" />
            {[
              [70, 20],
              [100, 50],
              [58, 70],
            ].map(([x, y], i) => (
              <g key={i}>
                {Array.from({ length: 7 }).map((_, k) => {
                  const a = (Math.PI * 2 * k) / 7;
                  return <ellipse key={k} cx={x + Math.cos(a) * 7} cy={y + Math.sin(a) * 7} rx="5" ry="2.5" fill={i === 1 ? accent : color} transform={`rotate(${(a * 180) / Math.PI} ${x + Math.cos(a) * 7} ${y + Math.sin(a) * 7})`} />;
                })}
                <circle cx={x} cy={y} r="3" fill="#7A5A3A" />
              </g>
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <ellipse key={i} cx={44 + i * 2} cy={140 - i * 16} rx="8" ry="3" fill="#8A8A5A" transform={`rotate(${i % 2 ? 30 : -30} ${44 + i * 2} ${140 - i * 16})`} />
            ))}
          </>
        )}
        {kind === 'star' && (
          <>
            {[
              [20, 30, 6],
              [90, 20, 4],
              [60, 80, 5],
              [100, 120, 3],
              [30, 130, 4],
            ].map(([x, y, s], i) => (
              <path key={i} d={`M${x} ${y - s * 2} Q${x + s * 0.4} ${y - s * 0.4} ${x + s * 2} ${y} Q${x + s * 0.4} ${y + s * 0.4} ${x} ${y + s * 2} Q${x - s * 0.4} ${y + s * 0.4} ${x - s * 2} ${y} Q${x - s * 0.4} ${y - s * 0.4} ${x} ${y - s * 2}Z`} fill={accent} />
            ))}
            <path d="M20 160 C30 130 50 120 60 100" stroke="#B9C2B0" strokeWidth="1.4" fill="none" />
            {[
              [60, 100],
              [44, 124],
            ].map(([x, y], i) => (
              <g key={i}>
                {Array.from({ length: 5 }).map((_, k) => {
                  const a = (Math.PI * 2 * k) / 5;
                  return <ellipse key={k} cx={x + Math.cos(a) * 7} cy={y + Math.sin(a) * 7} rx="6" ry="4" fill="#F4F1EA" />;
                })}
                <circle cx={x} cy={y} r="3" fill={accent} />
              </g>
            ))}
          </>
        )}
        {kind === 'blossom' && (
          <>
            <path d="M10 160 C30 120 50 90 90 40" stroke="#A3A98F" strokeWidth="1.6" fill="none" />
            {[
              [90, 40, 14],
              [50, 96, 10],
              [74, 70, 8],
            ].map(([x, y, r], i) => (
              <g key={i}>
                {Array.from({ length: 5 }).map((_, k) => {
                  const a = (Math.PI * 2 * k) / 5 - Math.PI / 2;
                  return <circle key={k} cx={x + Math.cos(a) * r * 0.75} cy={y + Math.sin(a) * r * 0.75} r={r * 0.6} fill={color} fillOpacity=".8" />;
                })}
                <circle cx={x} cy={y} r={r * 0.3} fill={accent} />
              </g>
            ))}
            {[0, 1, 2].map((i) => (
              <ellipse key={i} cx={30 + i * 10} cy={130 - i * 18} rx="10" ry="4" fill="#A3A98F" transform={`rotate(-35 ${30 + i * 10} ${130 - i * 18})`} />
            ))}
          </>
        )}
      </g>
    </svg>
  );
};

/** Viền chuyển tiếp giữa các mảng: sóng hoặc giấy xé. */
const Band: React.FC<{ kind: HotTheme['band']; color: string; top?: boolean }> = ({ kind, color, top }) => {
  if (kind === 'plain') return null;
  const d =
    kind === 'wave'
      ? 'M0 30 C120 0 240 60 360 28 S560 0 600 24 V60 H0Z'
      : 'M0 34 L30 22 L58 38 L90 18 L120 32 L160 14 L196 34 L230 20 L270 36 L300 16 L340 30 L372 12 L410 34 L446 18 L480 36 L520 20 L556 32 L600 18 V60 H0Z';
  return (
    <svg viewBox="0 0 600 60" preserveAspectRatio="none" className="block w-full h-8 sm:h-10" style={top ? { transform: 'rotate(180deg)' } : undefined} aria-hidden>
      <path d={d} fill={color} />
    </svg>
  );
};

export const HotInvitationView: React.FC<Props> = ({ invitation, theme: T, guest, noWrite, isPreviewMode, sandboxLabel }) => {
  const C = T.c;
  const groom = invitation.groomName || 'Chú Rể';
  const bride = invitation.brideName || 'Cô Dâu';
  const p = parts(invitation.weddingDate);
  const album = (invitation.galleryImages?.length ? invitation.galleryImages : T.photos.album).filter(Boolean);
  const hero = invitation.coverImage || album[0] || T.photos.hero;

  const [opened, setOpened] = useState(Boolean(isPreviewMode));
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [cd, setCd] = useState(calculateCountdown(invitation.weddingDate, invitation.weddingTime));
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [slide, setSlide] = useState(0);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  const [rsvp, setRsvp] = useState({ guestName: '', phone: '', isAttending: true, attendeesCount: 1, side: 'mutual' as 'groom' | 'bride' | 'mutual', message: '' });
  const [rsvpDone, setRsvpDone] = useState(false);
  const [rsvpBusy, setRsvpBusy] = useState(false);
  const [wish, setWish] = useState({ senderName: '', senderRelation: 'Bạn bè', message: '' });
  const [sig, setSig] = useState<string | null>(null);
  const [sigKey, setSigKey] = useState(0);
  const [wishBusy, setWishBusy] = useState(false);
  const [gift, setGift] = useState({ senderName: '', amount: '', message: '' });
  const [giftDone, setGiftDone] = useState(false);
  const [giftBusy, setGiftBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setCd(calculateCountdown(invitation.weddingDate, invitation.weddingTime)), 1000);
    return () => clearInterval(t);
  }, [invitation.weddingDate, invitation.weddingTime]);

  useEffect(() => {
    if (!noWrite && invitation.slug) fetchWishes(invitation.slug).then(setWishes).catch(() => {});
  }, [invitation.slug, noWrite]);

  useEffect(() => {
    if (!guest) return;
    setRsvp((r) => ({ ...r, guestName: r.guestName || guest.name, phone: r.phone || guest.phone || '' }));
    setWish((w) => ({ ...w, senderName: w.senderName || guest.name }));
    setGift((g) => ({ ...g, senderName: g.senderName || guest.name }));
    if (guest.rsvpStatus !== 'pending') setRsvpDone(true);
    if (guest.giftSent) setGiftDone(true);
  }, [guest]);

  useEffect(() => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    generateQrDataUrl(url, T.dark ? '#111111' : C.deep).then(setQr);
  }, [C.deep, T.dark]);

  // Album carousel tự chạy
  useEffect(() => {
    if (T.album !== 'carousel' || album.length < 2) return;
    const t = setTimeout(() => setSlide((s) => (s + 1) % album.length), 4200);
    return () => clearTimeout(t);
  }, [slide, album.length, T.album]);

  const open = () => {
    setOpened(true);
    if (invitation.musicUrl && audioRef.current) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  };
  const toggleMusic = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else a.play().then(() => setPlaying(true)).catch(() => {});
  };

  const mapsQuery = encodeURIComponent([invitation.venueName, invitation.venueAddress].filter(Boolean).join(', ') || 'Việt Nam');
  const mapsLink = invitation.mapUrl || `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;
  const calLink = useMemo(() => {
    if (!p) return '';
    const [hh, mm] = (invitation.weddingTime || '11:00').split(':').map(Number);
    const s = new Date(p.dt);
    s.setHours(hh || 11, mm || 0);
    const e = new Date(s.getTime() + 3 * 3600 * 1000);
    const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Lễ cưới ${groom} & ${bride}`)}&dates=${f(s)}/${f(e)}&location=${mapsQuery}`;
  }, [p, invitation.weddingTime, groom, bride, mapsQuery]);

  const timeline = invitation.timelineEvents?.length
    ? invitation.timelineEvents
    : [
        { id: '1', time: '17:00', title: 'Đón khách', description: '' },
        { id: '2', time: '18:00', title: 'Lễ thành hôn', description: '' },
        { id: '3', time: '19:00', title: 'Khai tiệc', description: '' },
      ];
  const tlIcon = (title: string) => {
    const s = title.toLowerCase();
    if (s.includes('đón')) return Users;
    if (s.includes('lễ') || s.includes('nhẫn')) return Gem;
    if (s.includes('ảnh')) return Camera;
    if (s.includes('tiệc') || s.includes('ăn')) return Utensils;
    if (s.includes('nhạc') || s.includes('văn nghệ') || s.includes('giao lưu')) return Music2;
    if (s.includes('kết')) return Heart;
    return GlassWater;
  };

  const submitRsvpForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvp.guestName.trim()) return;
    setRsvpBusy(true);
    try {
      if (!noWrite && invitation.slug) await submitRsvp(invitation.slug, rsvp, guest?.id);
      setRsvpDone(true);
    } catch {
      alert('Không gửi được xác nhận. Vui lòng thử lại!');
    } finally {
      setRsvpBusy(false);
    }
  };

  const submitWishForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wish.senderName.trim() || !wish.message.trim()) return;
    setWishBusy(true);
    try {
      if (!noWrite && invitation.slug) {
        const w = await submitWish(invitation.slug, { ...wish, signature: sig || undefined }, guest?.id);
        setWishes((l) => [w, ...l]);
      } else {
        setWishes((l) => [
          { id: `tmp-${Date.now()}`, invitationId: invitation.id, ...wish, signature: sig || undefined, isApproved: true, createdAt: new Date().toISOString() },
          ...l,
        ]);
      }
      setWish({ senderName: guest?.name || '', senderRelation: 'Bạn bè', message: '' });
      setSig(null);
      setSigKey((k) => k + 1);
    } catch {
      alert('Không gửi được lời chúc.');
    } finally {
      setWishBusy(false);
    }
  };

  const submitGiftForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gift.senderName.trim()) return;
    setGiftBusy(true);
    try {
      if (!noWrite) {
        await submitGift(invitation, { senderName: gift.senderName, amount: Number(gift.amount.replace(/\D/g, '')) || undefined, message: gift.message }, guest?.id);
      }
      setGiftDone(true);
    } catch {
      alert('Không gửi được xác nhận quà mừng.');
    } finally {
      setGiftBusy(false);
    }
  };

  const vis = invitation.sectionsVisibility;
  const pageText = T.dark ? C.text : C.text;
  const onCard = T.dark ? '#3B2F2A' : C.text;
  /** Chữ phụ trên nền thẻ sáng (dark theme có muted sáng nên cần màu riêng). */
  const cm = T.dark ? '#7A6A60' : C.muted;
  const pm = C.muted;
  const H2: React.FC<{ children: React.ReactNode; light?: boolean; sub?: string; card?: boolean }> = ({ children, light, sub, card }) => (
    <div className="text-center mb-6">
      <h2 className="text-xl sm:text-2xl tracking-[0.12em] uppercase" style={{ fontFamily: T.serif, fontWeight: 600, color: light ? C.onDeep : card ? C.deep : T.dark ? C.accent : C.deep }}>
        {children}
      </h2>
      <div className="flex items-center justify-center gap-2 mt-1.5" aria-hidden>
        <span className="h-px w-10" style={{ background: light ? C.onDeep : C.accent }} />
        <Heart className="w-3 h-3" style={{ color: light ? C.onDeep : C.accent, fill: 'currentColor' }} />
        <span className="h-px w-10" style={{ background: light ? C.onDeep : C.accent }} />
      </div>
      {sub && <p className="text-[11px] uppercase tracking-widest mt-1.5" style={{ color: light ? C.onDeep : C.muted }}>{sub}</p>}
    </div>
  );

  const inputCls = 'w-full px-3.5 py-2 text-sm rounded-xl border bg-white text-[#3A3238] focus:outline-none focus:ring-2';
  const btnStyle: React.CSSProperties = { backgroundColor: T.dark ? C.accent : C.deep, color: T.dark ? '#1B1B1B' : C.onDeep };

  /* ===================== HERO ===================== */
  const NamesScript = ({ size = 'text-4xl sm:text-5xl', color = C.deep }: { size?: string; color?: string }) => (
    <h1 className={`${size} leading-tight`} style={{ fontFamily: T.script, color, fontWeight: 700 }}>
      {groom}
      <span className="block text-2xl my-0.5" style={{ fontFamily: T.serif }}>&</span>
      {bride}
    </h1>
  );

  const DateLine = ({ color = C.deep }: { color?: string }) =>
    p ? (
      <div className="flex items-center justify-center gap-3" style={{ color, fontFamily: T.serif }}>
        <span className="text-[11px] uppercase tracking-widest">{p.wd}</span>
        <span className="h-6 w-px opacity-50" style={{ background: color }} />
        <span className="text-3xl sm:text-4xl font-semibold tracking-wider">
          {p.d} / {p.m} / {p.y}
        </span>
        <span className="h-6 w-px opacity-50" style={{ background: color }} />
        <span className="text-[11px] uppercase tracking-widest">{invitation.weddingTime}</span>
      </div>
    ) : null;

  const renderHero = () => {
    switch (T.hero) {
      case 'full-overlay':
        return (
          <section className="relative min-h-[88vh] flex items-end overflow-hidden" style={{ background: C.deep }}>
            <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${C.deep}cc 0%, transparent 38%, transparent 55%, ${C.deep}f2 100%)` }} />
            <Deco kind={T.deco} color={T.dark ? '#EDE7DA' : C.primary} accent={C.accent} className="absolute -left-3 bottom-24 w-24 opacity-90" />
            <Deco kind={T.deco} color={T.dark ? '#EDE7DA' : C.primary} accent={C.accent} className="absolute -right-3 bottom-32 w-20 opacity-90" flip />
            <div className="absolute top-6 inset-x-0 text-center px-6" style={{ color: C.onDeep }}>
              <p className="text-3xl tracking-[0.25em]" style={{ fontFamily: T.serif }}>
                {initialOf(groom)}&{initialOf(bride)}
              </p>
              <p className="text-[10px] uppercase tracking-[0.4em] mt-1">{T.kicker}</p>
            </div>
            <div className="relative w-full text-center px-6 pb-12 space-y-3" style={{ color: C.onDeep }}>
              <p className="text-xs uppercase tracking-[0.3em]">Lễ Thành Hôn</p>
              <NamesScript color={C.onDeep} />
              <p className="text-xs opacity-90">{T.sideNote}</p>
              <DateLine color={C.onDeep} />
            </div>
          </section>
        );
      case 'arch-center':
        return (
          <section className="relative pt-10 pb-8 px-6 text-center overflow-hidden" style={{ background: T.dark ? C.bg : C.bg }}>
            <Deco kind={T.deco} color={T.dark ? '#F2E3C9' : C.primary} accent={C.accent} className="absolute -left-4 top-10 w-24" />
            <Deco kind={T.deco} color={T.dark ? '#F2E3C9' : C.primary} accent={C.accent} className="absolute -right-4 top-24 w-20" flip />
            <p className="text-3xl tracking-[0.25em]" style={{ fontFamily: T.serif, color: T.dark ? C.accent : C.deep }}>
              {initialOf(groom)}&nbsp;{initialOf(bride)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.4em] mb-5" style={{ color: T.dark ? C.onDeep : C.muted }}>
              {T.kicker}
            </p>
            <div className="relative mx-auto w-[78%] max-w-xs aspect-[3/4] rounded-t-full overflow-hidden border-4 shadow-2xl" style={{ borderColor: T.dark ? C.accent : '#fff' }}>
              <img src={hero} alt="" className="w-full h-full object-cover" fetchPriority="high" />
            </div>
            <div className="mt-6 space-y-3" style={{ color: T.dark ? C.onDeep : C.text }}>
              <p className="text-xs uppercase tracking-[0.35em]" style={{ fontFamily: T.serif }}>
                Lễ Thành Hôn
              </p>
              <NamesScript color={T.dark ? C.onDeep : C.deep} />
              <p className="text-xs italic opacity-90" style={{ fontFamily: T.serif }}>
                “{T.quote}”
              </p>
              <DateLine color={T.dark ? C.accent : C.deep} />
            </div>
          </section>
        );
      case 'arch-split':
        return (
          <section className="relative pt-10 pb-6 px-5 overflow-hidden" style={{ background: C.bg }}>
            <Deco kind={T.deco} color={C.primary} accent={C.accent} className="absolute -left-4 top-24 w-24" />
            <div className="grid grid-cols-[1fr_1.15fr] gap-4 items-center">
              <div className="text-center">
                <p className="text-5xl leading-[0.9]" style={{ fontFamily: T.script, color: C.deep }}>
                  Save
                  <span className="block text-2xl">the</span>
                  Date
                </p>
                {p && (
                  <p className="mt-3 text-lg tracking-widest" style={{ fontFamily: T.serif, color: C.deep }}>
                    {p.d} . {p.m} . {p.y}
                  </p>
                )}
                <p className="text-[10px] uppercase tracking-widest mt-2" style={{ color: cm }}>
                  {T.sideNote}
                </p>
              </div>
              <div className="relative aspect-[3/4] rounded-t-full overflow-hidden border-4 border-white shadow-xl">
                <img src={hero} alt="" className="w-full h-full object-cover" fetchPriority="high" />
              </div>
            </div>
            <div className="mt-7 text-center space-y-2" style={{ color: C.text }}>
              <p className="text-[11px] uppercase tracking-[0.3em]" style={{ color: cm }}>
                Chúng tôi kết hôn
              </p>
              <h1 className="text-3xl sm:text-4xl" style={{ fontFamily: T.serif, color: C.deep, fontWeight: 500 }}>
                {groom}
                <span className="block text-2xl my-0.5" style={{ fontFamily: T.script }}>
                  &
                </span>
                {bride}
              </h1>
              <p className="text-xs italic" style={{ fontFamily: T.serif, color: cm }}>
                “{T.quote}”
              </p>
            </div>
          </section>
        );
      case 'torn':
        return (
          <section className="relative pt-8 px-5 overflow-hidden" style={{ background: C.bg }}>
            <Deco kind={T.deco} color={C.primary} accent={C.accent} className="absolute right-0 top-6 w-20" flip />
            <p className="text-[11px] uppercase tracking-[0.4em] mb-3" style={{ color: C.text }}>
              {T.kicker}
            </p>
            <div className="relative mx-auto w-[74%] aspect-[3/4] rounded-t-full overflow-hidden shadow-2xl border-[6px]" style={{ borderColor: C.card }}>
              <img src={hero} alt="" className="w-full h-full object-cover" fetchPriority="high" />
            </div>
            <p className="absolute left-3 top-[45%] -rotate-6 text-base" style={{ fontFamily: T.script, color: C.text }}>
              {T.sideNote}
            </p>
            <div className="relative -mt-6 mx-1 p-5 text-center shadow-lg" style={{ background: C.card, clipPath: 'polygon(0 6%,8% 0,22% 5%,38% 1%,55% 6%,70% 0,86% 5%,100% 1%,100% 95%,90% 100%,74% 95%,58% 100%,40% 94%,24% 100%,10% 95%,0 100%)' }}>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: cm }}>
                Trân trọng kính mời đến dự lễ thành hôn của
              </p>
              <h1 className="text-3xl my-2" style={{ fontFamily: T.serif, color: C.text, fontWeight: 600 }}>
                {groom}
                <span className="block text-2xl" style={{ fontFamily: T.script }}>
                  &
                </span>
                {bride}
              </h1>
              {p && (
                <p className="text-2xl tracking-wider" style={{ fontFamily: T.serif, color: C.primary }}>
                  {p.d} / {p.m} / {p.y}
                </p>
              )}
            </div>
            <p className="text-center italic text-sm py-5" style={{ fontFamily: T.script, color: C.text }}>
              “{T.quote}”
            </p>
          </section>
        );
      case 'wave':
      default:
        return (
          <section className="relative overflow-hidden" style={{ background: C.bg }}>
            <div className="relative h-[62vh] min-h-[380px]">
              <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
              <div className="absolute inset-0" style={{ background: `linear-gradient(200deg, ${C.deep}ee 0%, ${C.deep}55 45%, transparent 70%)` }} />
              <div className="absolute top-5 left-5" style={{ color: C.onDeep }}>
                <p className="text-3xl" style={{ fontFamily: T.serif }}>
                  {initialOf(groom)}
                  {initialOf(bride)}
                </p>
              </div>
              <p className="absolute top-6 right-5 text-[10px] uppercase tracking-[0.3em] text-right" style={{ color: C.onDeep }}>
                {T.kicker}
              </p>
              <div className="absolute bottom-16 inset-x-0 text-center" style={{ color: C.onDeep }}>
                <NamesScript color={C.onDeep} />
                {p && <p className="mt-2 tracking-[0.3em] text-sm">{p.d}.{p.m}.{p.y}</p>}
              </div>
              <svg viewBox="0 0 600 80" preserveAspectRatio="none" className="absolute bottom-0 w-full h-14" aria-hidden>
                <path d="M0 50 C150 0 300 90 600 20 V80 H0Z" fill={C.bg} />
              </svg>
            </div>
            <p className="text-center text-sm px-6 pt-2 pb-4" style={{ color: C.text, fontFamily: T.serif }}>
              {T.sideNote}
            </p>
          </section>
        );
    }
  };

  /* ===================== ALBUM ===================== */
  const renderAlbum = () => {
    const imgs = album.slice(0, 8);
    if (imgs.length === 0) return null;
    const Img = ({ src, cls = '', i }: { src: string; cls?: string; i: number }) => (
      <button type="button" onClick={() => setLightbox(src)} className={`overflow-hidden cursor-zoom-in ${cls}`} aria-label={`Xem ảnh ${i + 1}`}>
        <img src={src} alt={`Ảnh cưới ${i + 1}`} loading={T.album === 'carousel' ? 'eager' : 'lazy'} decoding="async" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
      </button>
    );
    switch (T.album) {
      case 'collage':
        return (
          <div className="grid grid-cols-5 grid-rows-2 gap-2 h-80">
            <Img src={imgs[0]} i={0} cls="col-span-3 row-span-2 rounded-lg border-4 border-white shadow-lg -rotate-1" />
            {imgs[1] && <Img src={imgs[1]} i={1} cls="col-span-2 rounded-lg border-4 border-white shadow-lg rotate-1" />}
            {imgs[2] && <Img src={imgs[2]} i={2} cls="col-span-1 rounded-lg border-4 border-white shadow-lg" />}
            {imgs[3] && <Img src={imgs[3]} i={3} cls="col-span-1 rounded-lg border-4 border-white shadow-lg rotate-2" />}
          </div>
        );
      case 'carousel':
        return (
          <div className="relative">
            <div className="flex items-center justify-center gap-2 h-64">
              {[-1, 0, 1].map((o) => {
                const i = (slide + o + imgs.length) % imgs.length;
                return (
                  <div key={o} className={`transition-all duration-500 rounded-lg overflow-hidden shadow-lg ${o === 0 ? 'w-[46%] h-full z-10' : 'w-[26%] h-[80%] opacity-80'}`}>
                    <Img src={imgs[i]} i={i} cls="w-full h-full block" />
                  </div>
                );
              })}
            </div>
            <button onClick={() => setSlide((s) => (s - 1 + imgs.length) % imgs.length)} className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer" aria-label="Ảnh trước">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setSlide((s) => (s + 1) % imgs.length)} className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center cursor-pointer" aria-label="Ảnh sau">
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex justify-center gap-1.5 mt-3">
              {imgs.map((_, i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === slide ? C.deep : `${C.deep}40` }} />
              ))}
            </div>
          </div>
        );
      case 'polaroid':
        return (
          <div className="flex flex-wrap justify-center gap-3">
            {imgs.slice(0, 4).map((src, i) => (
              <div key={i} className="bg-white p-2 pb-7 shadow-lg w-[44%] sm:w-[22%]" style={{ transform: `rotate(${[-4, 3, -2, 4][i % 4]}deg)` }}>
                <Img src={src} i={i} cls="block aspect-square w-full" />
                <p className="text-center text-xs mt-1.5 text-[#5A4A3A]" style={{ fontFamily: T.script }}>
                  {['Thanh xuân có nhau', '…và sau này cũng vậy', 'Cùng nhau đi hết', 'Một chương mới'][i % 4]}
                </p>
              </div>
            ))}
          </div>
        );
      case 'film':
        return (
          <div className="relative -rotate-2 py-3 px-2" style={{ background: '#1A0A0C' }}>
            <div className="absolute inset-x-0 top-1 flex justify-between px-2" aria-hidden>
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="w-2.5 h-1.5 rounded-sm bg-white/80" />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 my-2">
              {imgs.slice(0, 3).map((src, i) => (
                <Img key={i} src={src} i={i} cls="aspect-[4/3] block" />
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-1 flex justify-between px-2" aria-hidden>
              {Array.from({ length: 16 }).map((_, i) => (
                <span key={i} className="w-2.5 h-1.5 rounded-sm bg-white/80" />
              ))}
            </div>
          </div>
        );
      case 'grid':
      default:
        return (
          <div className="grid grid-cols-3 gap-2">
            <Img src={imgs[0]} i={0} cls="col-span-3 aspect-[16/9] rounded-xl" />
            {imgs.slice(1, 4).map((src, i) => (
              <Img key={i} src={src} i={i + 1} cls="aspect-square rounded-xl" />
            ))}
          </div>
        );
    }
  };

  const giftBank = invitation.giftBank;
  const track = findTrackByUrl(invitation.musicUrl);
  const deepBg = T.dark ? C.deep : C.deep;

  return (
    <div className="min-h-screen" style={{ background: T.dark ? C.bg : '#E9E4DE', colorScheme: 'light' }}>
      {invitation.status !== 'published' && !sandboxLabel && <WatermarkOverlay showBadge={true} />}
      {sandboxLabel && (
        <div className="fixed top-0 inset-x-0 z-50 text-center text-[11px] font-semibold py-1.5" style={{ background: C.deep, color: C.onDeep }}>
          {sandboxLabel}
        </div>
      )}
      {invitation.musicUrl && <audio ref={audioRef} src={invitation.musicUrl} loop preload="none" />}

      <div className="relative max-w-[480px] mx-auto shadow-2xl overflow-hidden" style={{ background: C.bg, color: pageText }}>
        {/* Màn mở thiệp */}
        {!opened && (
          <button type="button" onClick={open} className="fixed inset-0 z-40 w-full flex items-center justify-center cursor-pointer" style={{ background: `${C.deep}e6` }} aria-label="Mở thiệp cưới">
            <div className="text-center px-8" style={{ color: C.onDeep }}>
              <div className="mx-auto w-44 aspect-[3/4] rounded-t-full overflow-hidden border-4 shadow-2xl mb-6" style={{ borderColor: C.accent }}>
                <img src={hero} alt="" className="w-full h-full object-cover" fetchPriority="high" />
              </div>
              {guest && (
                <p className="text-sm mb-2">
                  Trân trọng kính mời <strong>{guest.name}</strong>
                </p>
              )}
              <p className="text-4xl" style={{ fontFamily: T.script }}>
                {groom} & {bride}
              </p>
              <p className="mt-5 text-[11px] uppercase tracking-[0.35em] animate-pulse">Chạm để mở thiệp</p>
            </div>
          </button>
        )}

        {renderHero()}

        {/* Lời mời + ngày */}
        <section className="relative px-6 py-10 text-center overflow-hidden" style={{ background: T.dark ? C.card : C.card, color: onCard }}>
          <Deco kind={T.deco} color={T.dark ? C.deep : C.primary} accent={C.accent} className="absolute -right-4 -top-2 w-20 opacity-80" flip />
          <p className="text-sm" style={{ fontFamily: T.serif }}>
            {guest ? (
              <>
                Trân trọng kính mời <strong style={{ color: C.deep }}>{guest.name}</strong>
              </>
            ) : (
              'Trân trọng kính mời Quý khách & Gia đình'
            )}
            <br />
            đến dự lễ thành hôn của chúng tôi
          </p>
          {p && (
            <div className="my-5" style={{ fontFamily: T.serif, color: C.deep }}>
              <p className="text-[11px] uppercase tracking-[0.3em]">{p.wd}</p>
              <p className="text-4xl font-semibold tracking-wider my-1">
                {p.d} / {p.m} / {p.y}
              </p>
              <p className="text-[11px] uppercase tracking-[0.3em]">Vào lúc {invitation.weddingTime}</p>
              {invitation.lunarDate && <p className="text-xs italic mt-1" style={{ color: cm }}>{invitation.lunarDate}</p>}
            </div>
          )}
          <p className="text-sm italic max-w-sm mx-auto leading-relaxed" style={{ color: cm, fontFamily: T.serif }}>
            {invitation.invitationMessage}
          </p>
          {calLink && (
            <a href={calLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-5 px-5 py-2 rounded-full text-xs font-semibold shadow" style={btnStyle}>
              <Calendar className="w-3.5 h-3.5" /> Lưu ngày này nhé
            </a>
          )}
        </section>

        {/* Đếm ngược */}
        {vis.countdown && !cd.isPassed && (
          <section className="px-6 py-8 text-center" style={{ background: deepBg, color: C.onDeep }}>
            <p className="text-[11px] uppercase tracking-[0.3em] mb-3">Cùng đếm ngược thời gian</p>
            <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
              {[
                [cd.days, 'Ngày'],
                [cd.hours, 'Giờ'],
                [cd.minutes, 'Phút'],
                [cd.seconds, 'Giây'],
              ].map(([n, l]) => (
                <div key={l as string} className="rounded-xl py-2 border" style={{ borderColor: `${C.onDeep}55` }}>
                  <p className="text-2xl tabular-nums" style={{ fontFamily: T.serif }}>
                    {String(n).padStart(2, '0')}
                  </p>
                  <p className="text-[10px] uppercase opacity-80">{l}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Gia đình hai bên */}
        {vis.parents && (invitation.groomParents?.father || invitation.brideParents?.father) && (
          <section className="px-6 py-8" style={{ background: C.card, color: onCard }}>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-center text-sm" style={{ fontFamily: T.serif }}>
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: cm }}>
                  Nhà Trai
                </p>
                <p>{invitation.groomParents?.father}</p>
                <p>{invitation.groomParents?.mother}</p>
              </div>
              <span className="text-4xl" style={{ color: C.deep }} aria-hidden>
                {T.id === 'ruby-film' ? '囍' : '❦'}
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: cm }}>
                  Nhà Gái
                </p>
                <p>{invitation.brideParents?.father}</p>
                <p>{invitation.brideParents?.mother}</p>
              </div>
            </div>
          </section>
        )}

        {/* Album */}
        {vis.gallery && album.length > 0 && (
          <section className="relative" style={{ background: T.band === 'wave' ? deepBg : C.bg }}>
            <Band kind={T.band} color={T.band === 'wave' ? deepBg : C.bg} top />
            <div className="px-5 pb-10 pt-2">
              <H2 light={T.band === 'wave'}>Album Ảnh</H2>
              {renderAlbum()}
            </div>
            {T.band === 'torn' && <Band kind="torn" color={C.card} />}
          </section>
        )}

        {/* Thông tin tiệc cưới + bản đồ */}
        {vis.eventInfo && (
          <section className="relative px-5 py-10 overflow-hidden" style={{ background: C.card, color: onCard }}>
            <Deco kind={T.deco} color={T.dark ? C.deep : C.primary} accent={C.accent} className="absolute -left-5 bottom-4 w-20 opacity-80" />
            <H2 card>Thông Tin Tiệc Cưới</H2>
            <div className="space-y-3 text-sm max-w-sm mx-auto">
              {p && (
                <p className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 shrink-0" style={{ color: C.deep }} /> {p.wd}, {p.d}/{p.m}/{p.y}
                </p>
              )}
              <p className="flex items-center gap-3">
                <Clock className="w-5 h-5 shrink-0" style={{ color: C.deep }} /> {invitation.weddingTime}
                {timeline[0] && ` — ${timeline[0].title.toLowerCase()} từ ${timeline[0].time}`}
              </p>
              <p className="flex items-start gap-3">
                <MapPin className="w-5 h-5 shrink-0 mt-0.5" style={{ color: C.deep }} />
                <span>
                  <strong className="block" style={{ fontFamily: T.serif, fontSize: '1.05rem' }}>{invitation.venueName}</strong>
                  <span style={{ color: cm }}>{invitation.venueAddress}</span>
                </span>
              </p>
            </div>
            {T.photos.venue && (
              <img src={T.photos.venue} alt="" loading="lazy" className="mt-5 mx-auto w-full max-w-sm h-40 object-cover rounded-xl shadow" />
            )}
            {vis.map && (
              <div className="mt-6 max-w-sm mx-auto">
                <div className="rounded-2xl overflow-hidden shadow border-4 border-white aspect-[16/10] bg-neutral-100">
                  <iframe
                    title="Bản đồ địa điểm"
                    src={`https://www.google.com/maps?q=${mapsQuery}&output=embed`}
                    className="w-full h-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <a href={mapsLink} target="_blank" rel="noreferrer" className="mt-3 mx-auto w-max flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold shadow" style={btnStyle}>
                  <MapPin className="w-3.5 h-3.5" /> Xem chỉ đường
                </a>
              </div>
            )}
          </section>
        )}

        {/* Dress code + Lịch trình */}
        <section className="px-5 py-10" style={{ background: C.bg, color: pageText }}>
          <H2 sub={T.dressNote}>Dress Code</H2>
          <div className="flex justify-center gap-4 mb-10">
            {T.dress.map((d) => (
              <div key={d.label} className="text-center">
                <span className="block w-11 h-11 rounded-full shadow border-2 border-white mx-auto" style={{ background: d.color }} />
                <span className="text-[10px] mt-1 block" style={{ color: T.dark ? C.muted : C.muted }}>
                  {d.label}
                </span>
              </div>
            ))}
          </div>
          {vis.timeline && (
            <>
              <H2>Lịch Trình Ngày Cưới</H2>
              <div className="relative">
                <div className="absolute left-0 right-0 top-6 h-px" style={{ background: `${C.accent}99` }} aria-hidden />
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(timeline.length, 6)}, minmax(0,1fr))` }}>
                  {timeline.slice(0, 6).map((t) => {
                    const Icon = tlIcon(t.title);
                    return (
                      <div key={t.id} className="text-center">
                        <span className="relative z-10 mx-auto w-12 h-12 rounded-full flex items-center justify-center border" style={{ background: C.card, borderColor: C.accent, color: C.deep }}>
                          <Icon className="w-5 h-5" />
                        </span>
                        <p className="text-sm font-semibold mt-1.5" style={{ fontFamily: T.serif, color: T.dark ? C.accent : C.deep }}>
                          {t.time}
                        </p>
                        <p className="text-[10px] leading-tight" style={{ color: pm }}>
                          {t.title}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>

        {/* RSVP */}
        {vis.rsvp && (
          <section className="relative" style={{ background: deepBg, color: C.onDeep }}>
            <Band kind={T.band === 'plain' ? 'wave' : T.band} color={deepBg} top />
            <div className="px-5 pb-10 pt-2">
              <H2 light>Xác Nhận Tham Dự</H2>
              {rsvpDone ? (
                <div className="max-w-sm mx-auto rounded-2xl p-5 text-center" style={{ background: C.card, color: onCard }}>
                  <CheckCircle className="w-10 h-10 mx-auto mb-2" style={{ color: C.deep }} />
                  <p className="text-sm">Cảm ơn bạn đã phản hồi! Hẹn gặp bạn trong ngày vui.</p>
                </div>
              ) : (
                <form onSubmit={submitRsvpForm} className="max-w-sm mx-auto rounded-2xl p-5 space-y-3" style={{ background: C.card, color: onCard }}>
                  <input required placeholder="Họ và tên của bạn *" value={rsvp.guestName} onChange={(e) => setRsvp({ ...rsvp, guestName: e.target.value })} className={inputCls} />
                  <input placeholder="Số điện thoại (tùy chọn)" value={rsvp.phone} onChange={(e) => setRsvp({ ...rsvp, phone: e.target.value })} className={inputCls} />
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[true, false].map((v) => (
                      <button
                        key={String(v)}
                        type="button"
                        onClick={() => setRsvp({ ...rsvp, isAttending: v })}
                        className="py-2 rounded-xl border font-semibold cursor-pointer"
                        style={rsvp.isAttending === v ? { ...btnStyle, borderColor: 'transparent' } : { borderColor: '#ddd' }}
                      >
                        {v ? 'Tôi sẽ tham dự' : 'Rất tiếc, tôi bận'}
                      </button>
                    ))}
                  </div>
                  {rsvp.isAttending && (
                    <div className="grid grid-cols-2 gap-2">
                      <select value={rsvp.attendeesCount} onChange={(e) => setRsvp({ ...rsvp, attendeesCount: Number(e.target.value) })} className={inputCls}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} người
                          </option>
                        ))}
                      </select>
                      <select value={rsvp.side} onChange={(e) => setRsvp({ ...rsvp, side: e.target.value as any })} className={inputCls}>
                        <option value="mutual">Bạn chung</option>
                        <option value="groom">Khách nhà trai</option>
                        <option value="bride">Khách nhà gái</option>
                      </select>
                    </div>
                  )}
                  <button type="submit" disabled={rsvpBusy} className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-60" style={btnStyle}>
                    {rsvpBusy ? 'Đang gửi…' : 'Gửi xác nhận'}
                  </button>
                </form>
              )}
              {qr && (
                <div className="flex items-center justify-center gap-3 mt-5">
                  <img src={qr} alt="Mã QR thiệp" className="w-20 h-20 rounded-lg bg-white p-1" />
                  <p className="text-[11px] max-w-[160px] opacity-90">Quét mã để mở thiệp & gửi lời chúc trên điện thoại khác</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Sổ lưu bút */}
        {vis.wishes && (
          <section className="px-5 py-10" style={{ background: C.bg, color: pageText }}>
            <H2>Lời Chúc Từ Những Người Thân Yêu</H2>
            <form onSubmit={submitWishForm} className="max-w-sm mx-auto rounded-2xl p-4 space-y-2 shadow" style={{ background: C.card, color: onCard }}>
              <div className="grid grid-cols-2 gap-2">
                <input required placeholder="Tên của bạn *" value={wish.senderName} onChange={(e) => setWish({ ...wish, senderName: e.target.value })} className={inputCls} />
                <input placeholder="Mối quan hệ" value={wish.senderRelation} onChange={(e) => setWish({ ...wish, senderRelation: e.target.value })} className={inputCls} />
              </div>
              <textarea required rows={3} placeholder="Viết lời chúc gửi đến cô dâu chú rể…" value={wish.message} onChange={(e) => setWish({ ...wish, message: e.target.value })} className={`${inputCls} resize-none`} />
              <p className="text-[11px] font-semibold">Ký tên lưu niệm (tùy chọn)</p>
              <SignaturePad key={sigKey} onChange={setSig} height={110} />
              <button type="submit" disabled={wishBusy} className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60" style={btnStyle}>
                <Send className="w-3.5 h-3.5" /> {wishBusy ? 'Đang gửi…' : 'Gửi lời chúc'}
              </button>
            </form>
            <div className="mt-5 grid gap-3 max-w-sm mx-auto">
              {(wishes.length
                ? wishes
                : [
                    { id: 's1', senderName: 'Nguyễn Minh Anh', senderRelation: 'Bạn thân', message: 'Chúc hai bạn trăm năm hạnh phúc, luôn yêu thương và đồng hành cùng nhau!' },
                    { id: 's2', senderName: 'Trần Hoàng Long', senderRelation: 'Đồng nghiệp', message: 'Một hành trình mới thật tuyệt vời! Chúc hai bạn luôn hạnh phúc nhé!' },
                  ].filter(() => noWrite)
              )
                .slice(0, 12)
                .map((w: any) => (
                  <div key={w.id} className="rounded-xl p-3 shadow-sm" style={{ background: C.card, color: onCard }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: `${C.deep}22`, color: C.deep }}>
                        {initialOf(w.senderName)}
                      </span>
                      <span className="text-xs font-semibold">{w.senderName}</span>
                      <span className="text-[10px] ml-auto" style={{ color: cm }}>
                        {w.senderRelation}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{w.message}</p>
                    {w.signature && <img src={w.signature} alt={`Chữ ký ${w.senderName}`} className="max-h-12 w-auto ml-auto mt-1" />}
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Hộp quà mừng */}
        {vis.giftBox && giftBank?.enabled && (
          <section className="relative px-5 py-10 overflow-hidden" style={{ background: C.card, color: onCard }}>
            <Deco kind={T.deco} color={T.dark ? C.deep : C.primary} accent={C.accent} className="absolute -right-4 bottom-2 w-20 opacity-80" flip />
            <H2 card>Hộp Quà Mừng</H2>
            <p className="text-xs text-center max-w-xs mx-auto mb-5" style={{ color: cm }}>
              Sự hiện diện của bạn là món quà quý giá nhất dành cho chúng tôi.
            </p>
            <div className="max-w-xs mx-auto rounded-2xl border p-4 text-center space-y-2" style={{ borderColor: `${C.accent}88` }}>
              {giftBank.accountNumber && (
                <img
                  src={`https://img.vietqr.io/image/${encodeURIComponent(giftBank.bankName)}-${giftBank.accountNumber}-compact2.png?accountName=${encodeURIComponent(giftBank.accountHolder)}&addInfo=${encodeURIComponent(giftBank.note || 'Mung cuoi')}`}
                  alt="Mã VietQR mừng cưới"
                  loading="lazy"
                  className="w-40 h-40 mx-auto object-contain bg-white rounded-lg"
                  onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                />
              )}
              <p className="text-xs" style={{ color: cm }}>{giftBank.bankName}</p>
              <p className="font-mono text-lg font-bold tracking-wider" style={{ color: C.deep }}>
                {giftBank.accountNumber}
              </p>
              <p className="text-xs font-semibold uppercase">{giftBank.accountHolder}</p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(giftBank.accountNumber);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-[11px] inline-flex items-center gap-1 underline cursor-pointer"
              >
                <Copy className="w-3 h-3" /> {copied ? 'Đã sao chép' : 'Sao chép số tài khoản'}
              </button>
            </div>
            <div className="max-w-xs mx-auto mt-4">
              {giftDone ? (
                <p className="text-xs text-center flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" style={{ color: C.deep }} /> Cô dâu chú rể đã nhận được xác nhận của bạn. Xin cảm ơn!
                </p>
              ) : (
                <form onSubmit={submitGiftForm} className="space-y-2">
                  <input required placeholder="Tên của bạn *" value={gift.senderName} onChange={(e) => setGift({ ...gift, senderName: e.target.value })} className={inputCls} />
                  <input
                    inputMode="numeric"
                    placeholder="Số tiền (không bắt buộc)"
                    value={gift.amount}
                    onChange={(e) => {
                      const d = e.target.value.replace(/\D/g, '');
                      setGift({ ...gift, amount: d ? new Intl.NumberFormat('vi-VN').format(Number(d)) : '' });
                    }}
                    className={inputCls}
                  />
                  <button type="submit" disabled={giftBusy} className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60" style={btnStyle}>
                    <Gift className="w-3.5 h-3.5" /> {giftBusy ? 'Đang gửi…' : 'Tôi đã gửi quà mừng'}
                  </button>
                </form>
              )}
            </div>
          </section>
        )}

        {/* Cảm ơn */}
        <section className="px-6 py-12 text-center" style={{ background: deepBg, color: C.onDeep }}>
          <p className="text-4xl" style={{ fontFamily: T.script }}>
            Thank you
          </p>
          <p className="text-sm italic mt-2 max-w-sm mx-auto" style={{ fontFamily: T.serif }}>
            {invitation.thankYouMessage}
          </p>
          <p className="mt-4 text-xs tracking-[0.3em] uppercase">
            {groom} & {bride}
          </p>
          {track && (
            <p className="mt-6 text-[10px] opacity-70">
              Nhạc nền: {track.title} — {track.credit}
            </p>
          )}
        </section>
      </div>

      {/* Nút nhạc */}
      {opened && invitation.musicUrl && (
        <button
          onClick={toggleMusic}
          className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full shadow-xl flex items-center justify-center cursor-pointer"
          style={{ background: C.deep, color: C.onDeep }}
          aria-label={playing ? 'Tắt nhạc' : 'Bật nhạc'}
        >
          {playing ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
        </button>
      )}

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 text-white p-2 rounded-full bg-white/20" aria-label="Đóng">
            <X className="w-5 h-5" />
          </button>
          <img src={lightbox} alt="" className="max-w-full max-h-[88vh] rounded-lg" />
        </div>
      )}
    </div>
  );
};

export default HotInvitationView;
