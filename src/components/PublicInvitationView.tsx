import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  Volume2,
  VolumeX,
  Share2,
  QrCode,
  CheckCircle,
  Copy,
  ChevronDown,
  Gift,
  Send,
  Sparkles,
  Camera,
  X,
  ExternalLink,
  Download
} from 'lucide-react';
import { WeddingInvitation, Wish } from '../types/wedding';
import { calculateCountdown, formatDateVN, generateQrDataUrl } from '../utils/formatters';
import { submitRsvp, fetchWishes, submitWish } from '../utils/api';
import { WatermarkOverlay } from './WatermarkOverlay';
import { InvitationArtCard } from './templateArt/InvitationArtCard';

interface PublicInvitationViewProps {
  invitation: WeddingInvitation;
  onBackToHome?: () => void;
  isPreviewMode?: boolean;
}

export const PublicInvitationView: React.FC<PublicInvitationViewProps> = ({
  invitation,
  onBackToHome,
  isPreviewMode = false,
}) => {
  const [isOpened, setIsOpened] = useState(isPreviewMode);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [countdown, setCountdown] = useState(calculateCountdown(invitation.weddingDate, invitation.weddingTime));
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // RSVP Form State
  const [rsvpData, setRsvpData] = useState({
    guestName: '',
    phone: '',
    isAttending: true,
    attendeesCount: 1,
    side: 'mutual' as 'groom' | 'bride' | 'mutual',
    dietaryNote: '',
    message: '',
  });
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  // Wish Form State
  const [wishData, setWishData] = useState({
    senderName: '',
    senderRelation: 'Bạn bè',
    message: '',
  });
  const [wishLoading, setWishLoading] = useState(false);
  const [wishSuccess, setWishSuccess] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Countdown Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(calculateCountdown(invitation.weddingDate, invitation.weddingTime));
    }, 1000);
    return () => clearInterval(timer);
  }, [invitation.weddingDate, invitation.weddingTime]);

  // Load Wishes
  useEffect(() => {
    if (!isPreviewMode && invitation.slug) {
      fetchWishes(invitation.slug).then(data => setWishes(data)).catch(() => {});
    }
  }, [invitation.slug, isPreviewMode]);

  // Generate QR code for sharing
  useEffect(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://thieponl.vn/invite/${invitation.slug}`;
    generateQrDataUrl(currentUrl, invitation.design.palette.primary, '#FFFFFF').then(url => setQrDataUrl(url));
  }, [invitation.slug, invitation.design.palette.primary]);

  // Music toggle handler
  const handleToggleMusic = () => {
    if (!audioRef.current) return;
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingMusic(true);
      }).catch(() => {
        setIsPlayingMusic(false);
      });
    }
  };

  // Open envelope
  const handleOpenEnvelope = () => {
    setIsOpened(true);
    if (invitation.musicUrl && audioRef.current) {
      audioRef.current.play().then(() => setIsPlayingMusic(true)).catch(() => {});
    }
  };

  // Submit RSVP
  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpData.guestName.trim()) return;
    setRsvpLoading(true);
    try {
      if (!isPreviewMode && invitation.slug) {
        await submitRsvp(invitation.slug, rsvpData);
        // Refresh wishes in case a message was attached
        const updatedWishes = await fetchWishes(invitation.slug);
        setWishes(updatedWishes);
      }
      setRsvpSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Không thể gửi xác nhận lúc này. Vui lòng thử lại!');
    } finally {
      setRsvpLoading(false);
    }
  };

  // Submit Wish
  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishData.senderName.trim() || !wishData.message.trim()) return;
    setWishLoading(true);
    try {
      if (!isPreviewMode && invitation.slug) {
        const newWish = await submitWish(invitation.slug, wishData);
        setWishes([newWish, ...wishes]);
      } else {
        // Preview dummy
        setWishes([
          {
            id: `temp-${Date.now()}`,
            invitationId: invitation.id,
            senderName: wishData.senderName,
            senderRelation: wishData.senderRelation,
            message: wishData.message,
            createdAt: new Date().toISOString(),
            isApproved: true,
          },
          ...wishes,
        ]);
      }
      setWishData({ senderName: '', senderRelation: 'Bạn bè', message: '' });
      setWishSuccess(true);
      setTimeout(() => setWishSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Không thể gửi lời chúc lúc này.');
    } finally {
      setWishLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : `https://thieponl.vn/invite/${invitation.slug}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
  };

  const { palette } = invitation.design;
  const motif = invitation.design.motif;
  const artCardProps = {
    groomName: invitation.groomName,
    brideName: invitation.brideName,
    weddingDate: invitation.weddingDate,
    weddingTime: invitation.weddingTime,
    lunarDate: invitation.lunarDate,
    venueName: invitation.venueName,
    venueAddress: invitation.venueAddress,
  };

  return (
    <div
      className="min-h-screen relative font-sans transition-colors duration-500 overflow-x-hidden theme-light"
      style={{
        backgroundColor: palette.background,
        color: palette.text,
        colorScheme: 'light',
      }}
    >
      {/* Unpaid / Draft Watermark overlay */}
      {invitation.status !== 'published' && <WatermarkOverlay showBadge={true} />}

      {/* Background Audio Player */}
      {invitation.musicUrl && (
        <audio ref={audioRef} src={invitation.musicUrl} loop preload="auto" />
      )}

      {/* Floating Audio & Action Controls (When opened) */}
      {isOpened && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
          {invitation.musicUrl && (
            <button
              onClick={handleToggleMusic}
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
              style={{
                backgroundColor: palette.primary,
                color: '#FFFFFF',
              }}
              title={isPlayingMusic ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
            >
              {isPlayingMusic ? <Volume2 className="w-5 h-5 animate-pulse" /> : <VolumeX className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={() => setQrModalOpen(true)}
            className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 cursor-pointer bg-white text-[#453C45] border border-[#E8B7C8]/40"
            title="Mã QR Thiệp"
          >
            <QrCode className="w-5 h-5 text-[#C76A82]" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. ENVELOPE OPENING CURTAIN (Wax seal + envelope animation) */}
      {/* ========================================================= */}
      {!isOpened ? (
        <div
          className={`min-h-screen flex items-center justify-center p-4 ${motif ? '' : 'bg-gradient-to-b from-[#FFFBF7] to-[#F6DCE5]/40'}`}
          style={motif ? { background: `linear-gradient(180deg, ${palette.background}, ${palette.surface})` } : undefined}
        >
          <div className="w-full max-w-md text-center">
            {motif ? (
              /* Thiệp minh họa (bộ sưu tập cao cấp): hiển thị chính tấm thiệp, chạm để mở */
              <button
                type="button"
                onClick={handleOpenEnvelope}
                className="group block w-full max-w-[380px] mx-auto cursor-pointer text-center focus-visible:outline-2 focus-visible:outline-offset-4"
                aria-label="Mở thiệp cưới"
              >
                <InvitationArtCard
                  motif={motif}
                  {...artCardProps}
                  className="rounded-2xl shadow-2xl transition-transform duration-300 group-hover:-translate-y-1.5"
                />
                <span className="mt-5 text-xs font-semibold uppercase tracking-wider block" style={{ color: palette.primary }}>
                  Chạm để mở thiệp cưới
                </span>
                <ChevronDown className="w-4 h-4 mx-auto mt-1 animate-bounce" style={{ color: palette.primary }} />
              </button>
            ) : (
            <>
            {/* Romantic Pre-Text */}
            <div className="mb-8">
              <span className="font-script text-3xl sm:text-4xl text-[#C76A82] block mb-2">
                Wedding Invitation
              </span>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[#453C45] tracking-tight">
                {invitation.groomName} & {invitation.brideName}
              </h1>
              <p className="text-sm text-[#827580] mt-2 tracking-widest uppercase">
                {formatDateVN(invitation.weddingDate)}
              </p>
            </div>

            {/* Realistic Envelope Card */}
            <div
              onClick={handleOpenEnvelope}
              className="group relative mx-auto w-72 sm:w-80 h-96 rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-between cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-3xl"
              style={{
                backgroundColor: invitation.design.envelopeColor || '#F6DCE5',
                border: '1px solid rgba(232, 183, 200, 0.4)',
              }}
            >
              {/* Envelope Flap Accent */}
              <div
                className="w-full h-28 rounded-t-xl rounded-b-3xl shadow-inner flex items-center justify-center transition-colors"
                style={{ backgroundColor: invitation.design.envelopeLiningColor || '#FFFBF7' }}
              >
                <div className="text-center px-4">
                  <span className="text-xs uppercase tracking-widest text-[#827580] font-medium block">
                    Trân trọng kính mời
                  </span>
                  <span className="font-script text-2xl text-[#C76A82]">
                    Quý Khách & Gia Đình
                  </span>
                </div>
              </div>

              {/* Wax Seal with Pulsing Initial */}
              <div className="my-auto relative">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-2 border-white/60 animate-seal"
                  style={{ backgroundColor: invitation.design.sealColor || '#C76A82' }}
                >
                  <span className="font-heading text-white font-bold text-xl tracking-wider">
                    {invitation.design.sealInitial || `${invitation.groomName[0]} & ${invitation.brideName[0]}`}
                  </span>
                </div>
              </div>

              {/* Click instruction */}
              <div className="text-center mt-2">
                <span className="text-xs font-semibold text-[#453C45] uppercase tracking-wider block group-hover:text-[#C76A82] transition-colors">
                  Chạm để mở thiệp cưới
                </span>
                <ChevronDown className="w-4 h-4 mx-auto mt-1 text-[#C76A82] animate-bounce" />
              </div>
            </div>

            </>
            )}

            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="mt-8 text-xs text-[#827580] hover:text-[#453C45] transition-colors underline cursor-pointer"
              >
                ← Quay lại trang chủ THIEPONL
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================= */
        /* 2. FULL WEDDING INVITATION WEBSITE CONTENT                */
        /* ========================================================= */
        <div className="max-w-2xl mx-auto shadow-2xl min-h-screen bg-white transition-all">
          {/* Top Floating Mini Bar */}
          <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-sm border-b border-[#E8B7C8]/25 px-4 py-2.5 flex items-center justify-between text-xs text-[#827580]">
            <span className="font-heading font-semibold text-[#453C45]">
              {invitation.groomName} & {invitation.brideName}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="hover:text-[#C76A82] transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copyFeedback ? 'Đã sao chép!' : 'Chia sẻ'}</span>
              </button>
              <button
                onClick={() => setQrModalOpen(true)}
                className="hover:text-[#C76A82] transition-colors cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section 1: Hero / Cover */}
          {invitation.sectionsVisibility.cover && (
            <div className="relative text-center px-6 pt-12 pb-16 overflow-hidden">
              {/* Subtle background ornament */}
              <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-[#F6DCE5]/30 to-transparent pointer-events-none" />

              <div className="relative z-10 space-y-4">
                {!motif && (
                  <span className="text-xs uppercase tracking-widest text-[#827580] font-semibold block">
                    Lễ Thành Hôn
                  </span>
                )}

                {motif ? (
                  <>
                    <InvitationArtCard
                      motif={motif}
                      {...artCardProps}
                      className="mx-auto w-full max-w-sm rounded-2xl shadow-xl"
                    />
                    {invitation.coverImage && (
                      <div className="relative mx-auto mt-6 w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border-4 border-white aspect-[3/4]">
                        <img
                          src={invitation.coverImage}
                          alt="Cô dâu và chú rể"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </>
                ) : (
                <>
                <h1
                  className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight"
                  style={{
                    fontFamily: invitation.design.fontHeading,
                    color: palette.primary,
                  }}
                >
                  {invitation.groomName}
                  <span className="block font-script text-3xl sm:text-4xl my-1 text-[#C76A82]">&</span>
                  {invitation.brideName}
                </h1>

                {/* Big Couple Photo */}
                <div className="relative mx-auto mt-6 w-full max-w-sm rounded-2xl overflow-hidden shadow-xl border-4 border-white aspect-[3/4]">
                  <img
                    src={invitation.coverImage || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80'}
                    alt="Cô dâu và chú rể"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end justify-center p-6 text-white text-center">
                    <div>
                      <p className="font-heading text-lg font-medium tracking-wide">
                        {formatDateVN(invitation.weddingDate)}
                      </p>
                      {invitation.lunarDate && (
                        <p className="text-xs text-white/80 mt-0.5">{invitation.lunarDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                </>
                )}

                {/* Romantic Message */}
                <div className="mt-8 max-w-md mx-auto px-4">
                  <p className="text-sm italic text-[#453C45] leading-relaxed">
                    "{invitation.invitationMessage}"
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Countdown Timer */}
          {invitation.sectionsVisibility.countdown && (
            <div
              className="py-10 px-6 text-center border-y border-[#E8B7C8]/25"
              style={{ backgroundColor: palette.surface }}
            >
              <span className="text-xs uppercase tracking-widest text-[#827580] font-medium block mb-4">
                Đếm Ngược Ngày Trọng Đại
              </span>
              <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xs mx-auto">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E8B7C8]/30">
                  <span className="font-heading text-2xl font-bold text-[#453C45] block tabular-nums">
                    {countdown.days}
                  </span>
                  <span className="text-[10px] uppercase text-[#827580]">Ngày</span>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E8B7C8]/30">
                  <span className="font-heading text-2xl font-bold text-[#453C45] block tabular-nums">
                    {countdown.hours}
                  </span>
                  <span className="text-[10px] uppercase text-[#827580]">Giờ</span>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E8B7C8]/30">
                  <span className="font-heading text-2xl font-bold text-[#453C45] block tabular-nums">
                    {countdown.minutes}
                  </span>
                  <span className="text-[10px] uppercase text-[#827580]">Phút</span>
                </div>
                <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E8B7C8]/30">
                  <span className="font-heading text-2xl font-bold text-[#C76A82] block tabular-nums">
                    {countdown.seconds}
                  </span>
                  <span className="text-[10px] uppercase text-[#827580]">Giây</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Family / Parents Information */}
          {invitation.sectionsVisibility.parents && (
            <div className="py-12 px-6 text-center">
              <span className="text-xs uppercase tracking-widest text-[#827580] font-medium block mb-2">
                Đại Diện Hai Bên Gia Đình
              </span>
              <h2
                className="text-2xl font-bold mb-8"
                style={{ fontFamily: invitation.design.fontHeading, color: palette.primary }}
              >
                Gia Đình Hai Nhà
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-lg mx-auto text-sm">
                {/* Nhà Trai */}
                <div className="p-5 rounded-2xl bg-[#FFFBF7] border border-[#E8B7C8]/30 shadow-sm">
                  <span className="text-xs uppercase font-semibold text-[#8A5A44] block mb-2">
                    Nhà Trai
                  </span>
                  <p className="font-heading text-base font-semibold text-[#453C45]">
                    {invitation.groomParents?.father || 'Ông: Trần Văn Toàn'}
                  </p>
                  <p className="font-heading text-base font-semibold text-[#453C45]">
                    {invitation.groomParents?.mother || 'Bà: Phạm Thị Lan'}
                  </p>
                  <span className="inline-block mt-3 px-2.5 py-0.5 rounded text-xs text-[#C76A82] bg-[#F6DCE5]/50">
                    Chú rể: {invitation.groomName}
                  </span>
                </div>

                {/* Nhà Gái */}
                <div className="p-5 rounded-2xl bg-[#FFFBF7] border border-[#E8B7C8]/30 shadow-sm">
                  <span className="text-xs uppercase font-semibold text-[#8A5A44] block mb-2">
                    Nhà Gái
                  </span>
                  <p className="font-heading text-base font-semibold text-[#453C45]">
                    {invitation.brideParents?.father || 'Ông: Nguyễn Văn Hùng'}
                  </p>
                  <p className="font-heading text-base font-semibold text-[#453C45]">
                    {invitation.brideParents?.mother || 'Bà: Lê Thị Thu Hà'}
                  </p>
                  <span className="inline-block mt-3 px-2.5 py-0.5 rounded text-xs text-[#C76A82] bg-[#F6DCE5]/50">
                    Cô dâu: {invitation.brideName}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Ceremony & Venue Event Info */}
          {invitation.sectionsVisibility.eventInfo && (
            <div
              className="py-12 px-6 text-center border-y border-[#E8B7C8]/25"
              style={{ backgroundColor: palette.surface }}
            >
              <span className="text-xs uppercase tracking-widest text-[#827580] font-medium block mb-2">
                Thời Gian & Địa Điểm
              </span>
              <h2
                className="text-2xl font-bold mb-6"
                style={{ fontFamily: invitation.design.fontHeading, color: palette.primary }}
              >
                Tiệc Cưới Thân Mật
              </h2>

              <div className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-md border border-[#E8B7C8]/30 space-y-5">
                <div className="flex items-center justify-center gap-3 text-sm text-[#453C45]">
                  <Calendar className="w-5 h-5 text-[#C76A82]" />
                  <span className="font-semibold">{formatDateVN(invitation.weddingDate)}</span>
                </div>

                <div className="flex items-center justify-center gap-3 text-sm text-[#453C45]">
                  <Clock className="w-5 h-5 text-[#C76A82]" />
                  <span>Vào lúc <strong>{invitation.weddingTime}</strong></span>
                </div>

                <div className="pt-3 border-t border-[#E8B7C8]/20">
                  <div className="flex items-start justify-center gap-3 text-sm text-[#453C45] mb-2">
                    <MapPin className="w-5 h-5 text-[#C76A82] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-heading font-bold text-base">{invitation.venueName}</h4>
                      <p className="text-xs text-[#827580] mt-1 leading-relaxed">{invitation.venueAddress}</p>
                    </div>
                  </div>

                  {invitation.mapUrl && (
                    <a
                      href={invitation.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-90 shadow-sm"
                      style={{ backgroundColor: palette.primary }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Xem chỉ đường Google Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Love Story */}
          {invitation.sectionsVisibility.loveStory && invitation.loveStories?.length > 0 && (
            <div className="py-14 px-6">
              <div className="text-center mb-10">
                <span className="text-xs uppercase tracking-widest text-[#827580] font-medium block mb-2">
                  Chuyện Tình Yêu
                </span>
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: invitation.design.fontHeading, color: palette.primary }}
                >
                  Our Love Story
                </h2>
              </div>

              <div className="relative border-l-2 border-[#E8B7C8]/40 ml-4 sm:ml-8 pl-6 sm:pl-8 space-y-10">
                {invitation.loveStories.map((story) => (
                  <div key={story.id} className="relative group">
                    {/* Timeline bullet */}
                    <div
                      className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: palette.primary }}
                    >
                      <Heart className="w-2.5 h-2.5 text-white fill-current" />
                    </div>

                    <span className="text-xs font-bold uppercase tracking-wider text-[#C76A82] block mb-1">
                      {story.yearOrDate}
                    </span>
                    <h3 className="font-heading text-lg font-bold text-[#453C45] mb-2">
                      {story.title}
                    </h3>
                    <p className="text-sm text-[#827580] leading-relaxed mb-3">
                      {story.description}
                    </p>
                    {story.imageUrl && (
                      <div className="rounded-xl overflow-hidden shadow-sm max-w-xs border border-[#E8B7C8]/20">
                        <img
                          src={story.imageUrl}
                          alt={story.title}
                          className="w-full h-44 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 6: Wedding Program / Timeline */}
          {invitation.sectionsVisibility.timeline && invitation.timelineEvents?.length > 0 && (
            <div
              className="py-14 px-6 border-y border-[#E8B7C8]/25"
              style={{ backgroundColor: palette.surface }}
            >
              <div className="text-center mb-8">
                <span className="text-xs uppercase tracking-widest text-[#827580] font-medium block mb-2">
                  Chương Trình Hôn Lễ
                </span>
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: invitation.design.fontHeading, color: palette.primary }}
                >
                  Lịch Trình Buổi Lễ
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                {invitation.timelineEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl bg-white shadow-sm border border-[#E8B7C8]/30 flex items-start gap-3"
                  >
                    <span
                      className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0 mt-0.5"
                      style={{ backgroundColor: palette.primary }}
                    >
                      {event.time}
                    </span>
                    <div>
                      <h4 className="font-heading font-semibold text-sm text-[#453C45]">
                        {event.title}
                      </h4>
                      <p className="text-xs text-[#827580] mt-0.5 leading-relaxed">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 7: Photo Album Gallery */}
          {invitation.sectionsVisibility.gallery && invitation.galleryImages?.length > 0 && (
            <div className="py-14 px-6 text-center">
              <span className="text-xs uppercase tracking-widest text-[#827580] font-medium block mb-2">
                Khoảnh Khắc Hạnh Phúc
              </span>
              <h2
                className="text-2xl font-bold mb-8"
                style={{ fontFamily: invitation.design.fontHeading, color: palette.primary }}
              >
                Album Ảnh Cưới
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {invitation.galleryImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxImg(imgUrl)}
                    className="group relative aspect-square rounded-xl overflow-hidden shadow-sm border border-[#E8B7C8]/20 cursor-pointer hover:shadow-md transition-all"
                  >
                    <img
                      src={imgUrl}
                      alt={`Kỷ niệm cưới ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <Camera className="w-6 h-6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 8: RSVP Form */}
          {invitation.sectionsVisibility.rsvp && (
            <div
              className="py-14 px-6 border-y border-[#E8B7C8]/25"
              style={{ backgroundColor: palette.surface }}
            >
              <div className="text-center mb-8">
                <span className="text-xs uppercase tracking-widest text-[#827580] font-medium block mb-2">
                  Xác Nhận Tham Dự
                </span>
                <h2
                  className="text-2xl font-bold"
                  style={{ fontFamily: invitation.design.fontHeading, color: palette.primary }}
                >
                  Gửi Lời Xác Nhận (RSVP)
                </h2>
                <p className="text-xs text-[#827580] mt-2 max-w-sm mx-auto">
                  Để buổi tiệc được chuẩn bị chu đáo nhất, quý khách vui lòng xác nhận trước ngày cưới.
                </p>
              </div>

              {rsvpSuccess ? (
                <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-[#607B64]/30 shadow-sm text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-[#607B64] mx-auto animate-bounce" />
                  <h3 className="font-heading text-lg font-bold text-[#453C45]">
                    Gửi Xác Nhận Thành Công!
                  </h3>
                  <p className="text-xs text-[#827580] leading-relaxed">
                    Cảm ơn bạn đã phản hồi. Sự hiện diện của bạn là niềm hạnh phúc to lớn đối với cô dâu chú rể.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleRsvpSubmit}
                  className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-md border border-[#E8B7C8]/30 space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1">
                      Họ và Tên của bạn <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ví dụ: Nguyễn Văn An"
                      value={rsvpData.guestName}
                      onChange={(e) => setRsvpData({ ...rsvpData, guestName: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1">
                      Số điện thoại (tùy chọn)
                    </label>
                    <input
                      type="tel"
                      placeholder="0912 345 678"
                      value={rsvpData.phone}
                      onChange={(e) => setRsvpData({ ...rsvpData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50"
                    />
                  </div>

                  {/* Attendance choice */}
                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1.5">
                      Bạn sẽ đến chung vui chứ?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRsvpData({ ...rsvpData, isAttending: true })}
                        className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                          rsvpData.isAttending
                            ? 'bg-[#F6DCE5] border-[#C76A82] text-[#C76A82] font-semibold'
                            : 'border-neutral-200 text-[#827580] hover:bg-neutral-50'
                        }`}
                      >
                        Có, tôi sẽ tham dự! 🎉
                      </button>
                      <button
                        type="button"
                        onClick={() => setRsvpData({ ...rsvpData, isAttending: false })}
                        className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
                          !rsvpData.isAttending
                            ? 'bg-[#F6DCE5] border-[#C76A82] text-[#C76A82] font-semibold'
                            : 'border-neutral-200 text-[#827580] hover:bg-neutral-50'
                        }`}
                      >
                        Rất tiếc, tôi vắng mặt
                      </button>
                    </div>
                  </div>

                  {rsvpData.isAttending && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#453C45] mb-1">
                          Số người tham dự
                        </label>
                        <select
                          value={rsvpData.attendeesCount}
                          onChange={(e) => setRsvpData({ ...rsvpData, attendeesCount: Number(e.target.value) })}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50"
                        >
                          <option value={1}>1 người (Đi một mình)</option>
                          <option value={2}>2 người (+ Người thương)</option>
                          <option value={3}>3 người (+ Gia đình)</option>
                          <option value={4}>4 người (+ Gia đình)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#453C45] mb-1">
                          Bạn là khách của
                        </label>
                        <select
                          value={rsvpData.side}
                          onChange={(e) => setRsvpData({ ...rsvpData, side: e.target.value as any })}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50"
                        >
                          <option value="mutual">Bạn chung hai bạn</option>
                          <option value="groom">Khách nhà trai</option>
                          <option value="bride">Khách nhà gái</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-[#453C45] mb-1">
                      Lời chúc phúc (tự động lưu vào sổ lưu bút)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Gửi lời chúc mừng đến cô dâu và chú rể..."
                      value={rsvpData.message}
                      onChange={(e) => setRsvpData({ ...rsvpData, message: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/50 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rsvpLoading}
                    className="w-full py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider transition-opacity hover:opacity-90 shadow-sm cursor-pointer"
                    style={{ backgroundColor: palette.primary }}
                  >
                    {rsvpLoading ? 'Đang gửi phản hồi...' : 'Gửi Xác Nhận Tham Dự'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Section 9: Guestbook & Wishes */}
          {invitation.sectionsVisibility.wishes && (
            <div className="py-14 px-6 text-center">
              <span className="text-xs uppercase tracking-widest text-[#827580] font-medium block mb-2">
                Sổ Lưu Bút Online
              </span>
              <h2
                className="text-2xl font-bold mb-2"
                style={{ fontFamily: invitation.design.fontHeading, color: palette.primary }}
              >
                Gửi Lời Chúc Phúc
              </h2>
              <p className="text-xs text-[#827580] mb-8">
                Lưu lại những thông điệp yêu thương cho hành trình hạnh phúc của cặp đôi.
              </p>

              {/* Wish Input Box */}
              <form onSubmit={handleWishSubmit} className="max-w-md mx-auto mb-10 text-left bg-[#FFFBF7] p-5 rounded-2xl border border-[#E8B7C8]/30 shadow-sm space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Tên của bạn *"
                    value={wishData.senderName}
                    onChange={(e) => setWishData({ ...wishData, senderName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/40"
                  />
                  <input
                    type="text"
                    placeholder="Mối quan hệ (Bạn bè, Đồng nghiệp...)"
                    value={wishData.senderRelation}
                    onChange={(e) => setWishData({ ...wishData, senderRelation: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/40"
                  />
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder="Viết lời chúc ngọt ngào nhất gửi đến cô dâu chú rể..."
                  value={wishData.message}
                  onChange={(e) => setWishData({ ...wishData, message: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-[#C76A82]/40 resize-none"
                />
                <button
                  type="submit"
                  disabled={wishLoading}
                  className="w-full py-2 rounded-lg text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                  style={{ backgroundColor: palette.primary }}
                >
                  <Send className="w-3.5 h-3.5" />
                  {wishLoading ? 'Đang gửi...' : 'Gửi Lời Chúc Ngay'}
                </button>
                {wishSuccess && (
                  <p className="text-[11px] text-[#607B64] font-medium text-center">
                    Cảm ơn bạn! Lời chúc đã được đăng thành công.
                  </p>
                )}
              </form>

              {/* Wishes List */}
              <div className="max-w-md mx-auto space-y-3 text-left">
                {wishes.length === 0 ? (
                  <p className="text-xs text-[#827580] text-center italic py-4">
                    Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc phúc nhé!
                  </p>
                ) : (
                  wishes.map((w) => (
                    <div
                      key={w.id}
                      className="p-4 rounded-xl bg-white border border-[#E8B7C8]/25 shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-heading font-bold text-sm text-[#453C45]">
                          {w.senderName}
                        </span>
                        <span className="text-[11px] text-[#827580]">
                          {w.senderRelation}
                        </span>
                      </div>
                      <p className="text-xs text-[#453C45] leading-relaxed">
                        "{w.message}"
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Section 10: Gift Box & VietQR */}
          {invitation.sectionsVisibility.giftBox && invitation.giftBank?.enabled && (
            <div
              className="py-14 px-6 text-center border-t border-[#E8B7C8]/25"
              style={{ backgroundColor: palette.surface }}
            >
              <Gift className="w-8 h-8 mx-auto text-[#C76A82] mb-2 animate-bounce" />
              <span className="text-xs uppercase tracking-widest text-[#827580] font-medium block mb-1">
                Hộp Mừng Cưới
              </span>
              <h2
                className="text-2xl font-bold mb-3"
                style={{ fontFamily: invitation.design.fontHeading, color: palette.primary }}
              >
                Gửi Quà Mừng Yêu Thương
              </h2>
              <p className="text-xs text-[#827580] max-w-sm mx-auto mb-6 leading-relaxed">
                Nếu không thể đến dự tiệc trực tiếp, quý khách có thể gửi quà mừng qua tài khoản ngân hàng dưới đây.
              </p>

              <div className="max-w-xs mx-auto bg-white p-6 rounded-2xl shadow-md border border-[#E8B7C8]/30 text-center space-y-4">
                {/* VietQR Generated Image */}
                <div className="w-48 h-48 mx-auto bg-neutral-100 rounded-xl overflow-hidden border border-neutral-200 p-2 flex items-center justify-center">
                  <img
                    src={`https://api.vietqr.io/image/970422-${invitation.giftBank.accountNumber}-compact2.jpg?accountName=${encodeURIComponent(
                      invitation.giftBank.accountHolder
                    )}&addInfo=${encodeURIComponent(invitation.giftBank.note || 'Mung cuoi')}`}
                    alt="Mã VietQR mừng cưới"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to QR code generator if external VietQR image fails
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                <div className="text-xs text-[#453C45] space-y-1">
                  <p className="text-neutral-500">{invitation.giftBank.bankName}</p>
                  <p className="font-mono font-bold text-base text-[#C76A82] tracking-wider">
                    {invitation.giftBank.accountNumber}
                  </p>
                  <p className="font-semibold uppercase">{invitation.giftBank.accountHolder}</p>
                  {invitation.giftBank.branch && (
                    <p className="text-[11px] text-[#827580]">Chi nhánh: {invitation.giftBank.branch}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Thank You Section */}
          <div className="py-14 px-6 text-center bg-[#FFFBF7] border-t border-[#E8B7C8]/30">
            <span className="font-script text-3xl sm:text-4xl text-[#C76A82] block mb-2">
              Thank You
            </span>
            <p className="text-sm italic text-[#453C45] max-w-md mx-auto leading-relaxed">
              "{invitation.thankYouMessage}"
            </p>
            <div className="mt-8 pt-6 border-t border-[#E8B7C8]/20 flex items-center justify-center gap-2 text-xs text-[#827580]">
              <span>Tạo bởi nền tảng thiệp cưới</span>
              <a href="/" className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity">
                <img
                  src="/assets/aistudio/thiep-online_1c938423.png"
                  alt="Thiệp Online"
                  className="h-6 w-auto object-contain"
                />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-6 right-6 text-white p-2 rounded-full bg-white/20 hover:bg-white/40"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImg}
            alt="Ảnh cưới phóng to"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}

      {/* QR Code Sharing Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-heading font-bold text-base text-[#453C45]">
                Mã QR Thiệp Cưới
              </h3>
              <button
                onClick={() => setQrModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#827580]">
              Khách mời có thể dùng camera điện thoại hoặc Zalo để quét và mở thiệp ngay lập tức.
            </p>

            {qrDataUrl && (
              <div className="w-56 h-56 mx-auto p-2 bg-[#FFFBF7] rounded-xl border border-[#E8B7C8]/40 shadow-inner flex items-center justify-center">
                <img src={qrDataUrl} alt="Mã QR Thiệp Cưới" className="w-full h-full object-contain" />
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <a
                href={qrDataUrl}
                download={`QR-ThiepCuoi-${invitation.slug}.png`}
                className="flex-1 py-2.5 rounded-xl bg-[#C76A82] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[#B0596E] transition-colors"
              >
                <Download className="w-4 h-4" />
                Tải Ảnh QR
              </a>
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-[#453C45] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-neutral-50 transition-colors"
              >
                <Copy className="w-4 h-4" />
                {copyFeedback ? 'Đã chép link' : 'Chép link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
