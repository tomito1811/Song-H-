import React, { useState } from 'react';
import {
  Heart,
  Sparkles,
  QrCode,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Clock,
  Calendar,
  Gift,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  Layers,
  Palette,
  ExternalLink,
  BookOpen,
  X,
  Eye,
  Music,
  Users,
  Compass,
} from 'lucide-react';
import { WeddingTemplate } from '../types/wedding';
import { WEDDING_TEMPLATES } from '../data/templates';
import { TemplateFilterBar, filterTemplates, isPublishedTemplate, CollectionFilter, ColorFilter, templateSwatches } from './TemplateFilterBar';
import { PRICING_PLANS } from '../data/pricing';
import { formatVND } from '../utils/formatters';
import { SoftFocusRibbon } from './SoftFocusRibbon';
import { SampleAlbumStack } from './SampleAlbumStack';
import { TemplateThumb } from './TemplateThumb';
import { UpgradeProButton, requestUpgrade, requestGuests, InviteGuestsButton } from './ProPromo';
import { EVENT_TYPES } from '../data/eventTypes';

interface HomePageProps {
  onNavigate: (view: string, params?: any) => void;
  onSelectTemplate: (template: WeddingTemplate) => void;
  onOpenAIDesigner: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onSelectTemplate,
  onOpenAIDesigner,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [previewModalTemplate, setPreviewModalTemplate] = useState<WeddingTemplate | null>(null);

  // Featured 4 curated templates
  const allPublished = WEDDING_TEMPLATES.filter(isPublishedTemplate);
  const publishedTemplates = allPublished.filter((t) => !t.eventType || t.eventType === 'wedding');
  const hotTemplates = allPublished.filter((t) => t.hot);
  const eventGroups = EVENT_TYPES.filter((e) => e.id !== 'wedding').map((e) => ({
    ev: e,
    list: allPublished.filter((t) => t.eventType === e.id),
  }));
  // 4 mẫu tiêu biểu thuộc 4 chủ đề khác nhau (ưu tiên mẫu featured của bộ sưu tập mới).
  const featuredTemplates = (() => {
    const picked: WeddingTemplate[] = [];
    const seen = new Set<string>();
    for (const t of publishedTemplates) {
      if (!t.featured || !t.collection || seen.has(t.collection)) continue;
      if (['truyen-thong', 'hoa-la', 'hoang-gia', 'nghe-thuat'].includes(t.collection)) {
        picked.push(t);
        seen.add(t.collection);
      }
    }
    for (const t of publishedTemplates) if (picked.length < 4 && !picked.includes(t)) picked.push(t);
    return picked.slice(0, 4);
  })();

  // Dải Soft Focus Ribbon: mẫu nổi bật trước, lọc theo chủ đề / màu.
  const [ribbonCollection, setRibbonCollection] = useState<CollectionFilter>('all');
  const [ribbonColor, setRibbonColor] = useState<ColorFilter>('all');
  const ribbonTemplates = React.useMemo(() => {
    const filtered = filterTemplates(publishedTemplates, ribbonCollection, ribbonColor);
    const base =
      ribbonCollection === 'all' && ribbonColor === 'all'
        ? [...filtered.filter((t) => t.featured), ...filtered.filter((t) => t.collection && !t.featured)]
        : filtered;
    // Dải chạy vô tận cần đủ thẻ để lấp kín chiều ngang.
    let list = base.length ? base : publishedTemplates.slice(0, 8);
    while (list.length < 7) list = list.concat(base.length ? base : list);
    return list;
  }, [ribbonCollection, ribbonColor]);

  const styleCategories = [
    { id: 'pastel', name: 'Pastel Romantic', count: '6 mẫu', color: '#F6DCE5', darkColor: '#36242B' },
    { id: 'korean', name: 'Korean Minimal', count: '4 mẫu', color: '#EBE5DF', darkColor: '#2C2724' },
    { id: 'floral', name: 'Floral Garden', count: '3 mẫu', color: '#DCE8D8', darkColor: '#242D24' },
    { id: 'champagne', name: 'Luxury Champagne', count: '3 mẫu', color: '#E9D8BD', darkColor: '#332B20' },
    { id: 'traditional', name: 'Áo Dài Truyền Thống', count: '2 mẫu', color: '#FBDDE6', darkColor: '#362228' },
    { id: 'minimal', name: 'Minimal White', count: '4 mẫu', color: '#F2F4F7', darkColor: '#242629' },
  ];

  const steps = [
    {
      num: '01',
      title: 'Chọn Mẫu Thiệp Độc Bản',
      desc: 'Khám phá hơn 20+ mẫu thiệp xu hướng Pastel Luxury, Korean Minimal hoặc dùng AI phối màu riêng biệt cho cặp đôi.',
    },
    {
      num: '02',
      title: 'Điền Thông Tin & Album Ảnh',
      desc: 'Cập nhật tên cô dâu chú rể, ngày cưới, bản đồ địa điểm tiệc, tải lên bộ ảnh cưới và bật tính năng nhận phản hồi RSVP.',
    },
    {
      num: '03',
      title: 'Xuất Bản & Chia Sẻ Mã QR',
      desc: 'Sở hữu ngay website thiệp cưới riêng biệt, dễ dàng gửi qua Zalo, Messenger hoặc tải mã QR độ phân giải cao để in thiệp giấy.',
    },
  ];

  const features = [
    {
      icon: <CheckCircle className="w-5 h-5 text-[#C76A82] dark:text-[#E8B7C8]" />,
      title: 'Xác Nhận Tham Dự (RSVP)',
      desc: 'Khách mời xác nhận đi một mình hay cùng người thân ngay trên điện thoại, tự động tổng hợp số lượng bàn tiệc thực tế.',
    },
    {
      icon: <QrCode className="w-5 h-5 text-[#C76A82] dark:text-[#E8B7C8]" />,
      title: 'Mã QR Thiệp Cưới Vector',
      desc: 'Tự động tạo mã QR chất lượng cao, dễ dàng in sắc nét lên thiệp giấy truyền thống hoặc gửi trực tiếp cho bạn bè.',
    },
    {
      icon: <Gift className="w-5 h-5 text-[#C76A82] dark:text-[#E8B7C8]" />,
      title: 'Hộp Mừng Cưới Chuẩn VietQR',
      desc: 'Tích hợp mã QR tài khoản ngân hàng chuẩn VietQR, giúp khách ở xa gửi gắm lời chúc và quà mừng tiện lợi, chính xác.',
    },
    {
      icon: <Clock className="w-5 h-5 text-[#C76A82] dark:text-[#E8B7C8]" />,
      title: 'Đồng Hồ Đếm Ngược Trực Quan',
      desc: 'Đếm ngược từng ngày, giờ, phút đến khoảnh khắc thiêng liêng, tạo sự háo hức ngập tràn cho ngày trọng đại.',
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-[#C76A82] dark:text-[#E8B7C8]" />,
      title: 'Sổ Lưu Bút Online',
      desc: 'Nơi người thân và bạn bè gửi gắm những lời chúc phúc ấm áp, lưu giữ kỷ niệm tình yêu vĩnh cửu theo năm tháng.',
    },
    {
      icon: <Sparkles className="w-5 h-5 text-[#C76A82] dark:text-[#E8B7C8]" />,
      title: 'AI Wedding Designer',
      desc: 'Trí tuệ nhân tạo Gemini phân tích ý tưởng của hai bạn để gợi ý thi văn trang nhã và bảng màu chuẩn gu nghệ thuật.',
    },
  ];

  const testimonials = [
    {
      couple: 'Quốc Bảo & Minh Anh',
      location: 'TP. Hồ Chí Minh',
      quote: 'Khách mời ai cũng khen website thiệp quá đẹp và tiện. Tính năng VietQR và đếm ngược làm bạn bè trẻ rất thích thú!',
      plan: 'Gói Luxury',
    },
    {
      couple: 'Hoàng Nam & Thu Trang',
      location: 'Hà Nội',
      quote: 'Giao diện Pastel Romantic đúng chuẩn gu của chúng mình. Không cần biết code vẫn tạo được thiệp chuyên nghiệp trong 5 phút.',
      plan: 'Gói Premium',
    },
    {
      couple: 'Đăng Khoa & Kim Ngân',
      location: 'Đà Nẵng',
      quote: 'Tính năng RSVP giúp chúng mình chốt số bàn tiệc chính xác đến 98%, tránh được rất nhiều chi phí phát sinh khi đặt tiệc.',
      plan: 'Gói Premium',
    },
  ];

  const faqs = [
    {
      q: 'Khách mời có cần tải ứng dụng hoặc tạo tài khoản để xem thiệp không?',
      a: 'Hoàn toàn không cần! Khách mời chỉ cần bấm vào đường link thiệp hoặc quét mã QR bằng camera điện thoại/Zalo là có thể xem trọn vẹn thiệp và gửi lời chúc, xác nhận RSVP ngay lập tức.',
    },
    {
      q: 'Tôi có thể chỉnh sửa lại thông tin sau khi đã xuất bản thiệp không?',
      a: 'Có. Bạn có thể đăng nhập vào Bảng điều khiển bất cứ lúc nào để chỉnh sửa ngày giờ, địa điểm, album ảnh hoặc bật/tắt các mục. Mọi thay đổi sẽ cập nhật tức thì trên đường link của khách mời.',
    },
    {
      q: 'Tính năng hộp mừng cưới VietQR hoạt động như thế nào?',
      a: 'Bạn chỉ cần nhập số tài khoản và chọn ngân hàng trong trình tạo thiệp. Hệ thống tự động tạo mã VietQR chuẩn Napas, khách chỉ cần quét trên ứng dụng ngân hàng là thông tin được điền sẵn chính xác.',
    },
    {
      q: 'Thiệp cưới online hiển thị tốt trên những dòng điện thoại nào?',
      a: 'THIEPONL được thiết kế theo tiêu chuẩn Mobile-First, tương thích hoàn hảo 100% trên mọi dòng iPhone, Samsung, Xiaomi, Oppo, iPad và máy tính xách tay.',
    },
  ];

  return (
    <div className="space-y-20 md:space-y-32 pb-24">
      {/* ========================================================= */}
      {/* 1. HERO SECTION                                           */}
      {/* ========================================================= */}
      <section className="relative pt-10 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
            {/* Unboxed Brand Kicker */}
            <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-semibold uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THIEPONL 2026</span>
              <span aria-hidden="true">·</span>
              <span>Nền Tảng Thiệp Cưới Điện Tử & AI Thông Minh</span>
            </div>

            {/* Display Headline */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-[#453C45] dark:text-[#F5EDE8] tracking-tight leading-[1.12] text-balance">
              Tạo Thiệp Cưới Online Đẹp Như Một Câu Chuyện Tình Yêu
            </h1>

            {/* Narrative Subtext */}
            <p className="text-base sm:text-lg text-[#827580] dark:text-[#B9A9B4] leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
              Tự tay thiết kế website thiệp cưới phong cách Pastel Luxury, gửi lời mời trang trọng qua Zalo, quản lý RSVP khách mời và đồng hành cùng AI sáng tạo dấu ấn riêng.
            </p>

            {/* Action CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <button
                onClick={() => onNavigate('templates')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4899C] via-[#C76A82] to-[#B0596E] hover:from-[#C76A82] hover:to-[#9E4D61] text-white text-sm font-bold shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#C76A82]"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span>Tạo Thiệp Cưới Ngay</span>
              </button>

              <button
                onClick={() => onNavigate('templates')}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl border border-[#E8B7C8]/50 dark:border-[#3D333D] bg-white dark:bg-[#2A232A] hover:bg-[#FAF4F0] dark:hover:bg-[#332A33] text-[#453C45] dark:text-[#F5EDE8] text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Khám Phá Mẫu Thiệp</span>
                <ArrowRight className="w-4 h-4 text-[#C76A82] dark:text-[#E8B7C8]" />
              </button>

              <button
                onClick={onOpenAIDesigner}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-[#E9D8BD] dark:border-[#524436] bg-[#FFFBF7] dark:bg-[#241E1C] text-[#8A5A44] dark:text-[#E9D8BD] text-sm font-semibold hover:bg-[#F6DCE5]/30 dark:hover:bg-[#382C27] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-[#C76A82] dark:text-[#E8B7C8]" />
                <span>Thiết Kế Bằng AI</span>
              </button>
            </div>

            {/* Lối tắt nổi bật: Mời khách & nâng cấp PRO */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <InviteGuestsButton size="lg" onClick={() => requestGuests(onNavigate)} />
              <UpgradeProButton size="lg" label="Nâng cấp PRO · 299K" onClick={() => requestUpgrade(onNavigate)} />
            </div>

            {/* Quiet Editorial Trust Proof (Unboxed text with middot) */}
            <div className="pt-6 border-t border-[#E8B7C8]/25 dark:border-[#3D333D] flex flex-wrap items-center justify-center lg:justify-start gap-y-2 gap-x-4 text-xs text-[#827580] dark:text-[#B9A9B4]">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-[#607B64] dark:text-[#A7D8AF]" />
                <span>22+ Mẫu Thiệp Độc Bản</span>
              </span>
              <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-[#607B64] dark:text-[#A7D8AF]" />
                <span>Tương Thích 100% Điện Thoại</span>
              </span>
              <span aria-hidden="true" className="text-neutral-300 dark:text-neutral-700">·</span>
              <span className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#607B64] dark:text-[#A7D8AF]" />
                <span>Mã VietQR Tự Động</span>
              </span>
            </div>
          </div>

          {/* Right Phone Mockup Preview */}
          <div className="lg:col-span-5 flex justify-center relative">
            {/* Soft decorative background glows */}
            <div className="absolute -top-12 -right-12 w-80 h-80 rounded-full bg-[#F6DCE5]/50 dark:bg-[#C76A82]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-80 h-80 rounded-full bg-[#E8DFF5]/50 dark:bg-[#9E7BB5]/10 blur-3xl pointer-events-none" />

            <div className="relative w-72 sm:w-80 rounded-[44px] shadow-2xl border-[7px] border-[#2C242A] dark:border-[#3A323A] bg-[#FFFBF7] dark:bg-[#201A20] overflow-hidden animate-float">
              {/* Phone Speaker & Camera Notch */}
              <div className="h-5 w-36 bg-[#2C242A] dark:bg-[#3A323A] mx-auto rounded-b-2xl z-20 flex items-center justify-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1A161A]" />
                <div className="w-10 h-1 rounded-full bg-[#3D333D]" />
              </div>

              {/* Mockup Wedding Card Body */}
              <div className="p-4 sm:p-5 space-y-3 text-center">
                <div className="space-y-1">
                  <span className="font-script text-2xl sm:text-3xl text-[#C76A82] dark:text-[#E8B7C8] block leading-none">
                    Wedding Invitation
                  </span>
                  <p className="text-[10px] uppercase tracking-widest text-[#827580] dark:text-[#B9A9B4]">
                    Trân trọng kính mời
                  </p>
                </div>

                <h3 className="font-heading text-xl sm:text-2xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
                  Quốc Bảo & Minh Anh
                </h3>

                {/* Wedding Card Photo Frame */}
                <div className="aspect-[4/5] rounded-2xl overflow-hidden shadow-sm border border-[#E8B7C8]/40 dark:border-[#3D333D] relative group">
                  <img
                    src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80"
                    alt="Mockup thiệp cưới Quốc Bảo & Minh Anh"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  {/* Wax Seal Floating Emblem */}
                  <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-[#C76A82] text-white flex items-center justify-center font-serif text-xs font-bold shadow-lg animate-seal">
                    B & A
                  </div>
                </div>

                {/* Wedding Date & Venue Info */}
                <div className="pt-1 space-y-1 text-center">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#C76A82] dark:text-[#E8B7C8] block">
                    Chủ Nhật · 28 Tháng 11 Năm 2026
                  </span>
                  <p className="text-[11px] text-[#453C45] dark:text-[#F5EDE8] font-medium leading-tight">
                    Trung Tâm Tiệc Cưới GEM Center · Quận 1, TP.HCM
                  </p>
                </div>

                {/* Action in mockup */}
                <button
                  onClick={() => onNavigate('templates')}
                  className="w-full py-2.5 px-4 bg-[#C76A82] hover:bg-[#B0596E] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Trải Nghiệm Mẫu Thiệp Này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. FLAGSHIP COMPONENT: SOFT FOCUS INFINITE RIBBON          */}
      {/* ========================================================= */}
      <SoftFocusRibbon
        key={`${ribbonCollection}-${ribbonColor}`}
        templates={ribbonTemplates}
        toolbar={
          <TemplateFilterBar
            templates={publishedTemplates}
            collection={ribbonCollection}
            color={ribbonColor}
            onCollectionChange={setRibbonCollection}
            onColorChange={setRibbonColor}
            compact
          />
        }
        onViewAll={() => onNavigate('templates')}
        totalCount={publishedTemplates.length}
        onSelectTemplate={onSelectTemplate}
        onPreviewTemplate={(tpl) => setPreviewModalTemplate(tpl)}
        speed={30}
        title="Dải Trưng Bày Mẫu Thiệp Độc Bản"
        subtitle="Công nghệ Soft Focus Infinite Ribbon tự động trôi ngang chậm rãi và lấy nét theo tâm, tôn vinh trọn vẹn từng đường nét nghệ thuật."
      />

      {/* ========================================================= */}
      {/* 2b. MẪU HOT: XEM THỬ NGAY                                   */}
      {/* ========================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold text-red-600 mb-1">
              <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px]">HOT</span> Được chọn nhiều nhất
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8]">Mẫu Thiệp Cưới HOT 2026</h2>
            <p className="text-xs sm:text-sm text-[#827580] dark:text-[#B9A9B4] mt-1">
              Giao diện website trọn bộ: ảnh cưới, nhạc nền, bản đồ, lịch trình, dress code, RSVP, lời chúc & hộp mừng.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <UpgradeProButton size="sm" label="Mở khóa mẫu HOT · PRO" onClick={() => requestUpgrade(onNavigate)} />
            <button onClick={() => onNavigate('templates')} className="text-xs font-bold text-[#C76A82] dark:text-[#E8B7C8] flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
              Xem tất cả mẫu <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {hotTemplates.map((tpl) => (
            <div key={tpl.id} className="group bg-white dark:bg-[#2A232A] rounded-3xl overflow-hidden border border-[#E8B7C8]/40 dark:border-[#3D333D] shadow-xs hover:shadow-xl transition-all">
              <div className="relative aspect-[3/4]">
                <TemplateThumb template={tpl} className="group-hover:scale-[1.03] transition-transform duration-700" />
              </div>
              <div className="p-3 sm:p-4">
                <h3 className="font-heading text-sm sm:text-base font-bold text-[#453C45] dark:text-[#F5EDE8]">{tpl.name}</h3>
                <p className="text-[11px] text-[#827580] dark:text-[#B9A9B4] line-clamp-2 mt-0.5">{tpl.description}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <a
                    href={`${import.meta.env.BASE_URL}demo/${tpl.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 rounded-xl border border-[#C76A82] text-[#C76A82] dark:text-[#E8B7C8] text-[11px] font-bold text-center"
                  >
                    Xem thử
                  </a>
                  <button onClick={() => onSelectTemplate(tpl)} className="py-2 rounded-xl bg-[#C76A82] text-white text-[11px] font-bold cursor-pointer">
                    Dùng mẫu
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. TUYỂN CHỌN MẪU NỔI BẬT THEO CHỦ ĐỀ                    */}
      {/* ========================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-[#E8B7C8]/25 dark:border-[#3D333D]">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8] mb-1">
              <span>Tuyển Chọn Mới Nhất 2026</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
              Mẫu Thiệp Cưới Tiêu Biểu Cho Mùa Cưới
            </h2>
          </div>
          <button
            onClick={() => onNavigate('templates')}
            className="text-xs font-bold text-[#C76A82] dark:text-[#E8B7C8] hover:text-[#B0596E] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <span>Xem tất cả {publishedTemplates.length} mẫu thiệp</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl)}
              className="group bg-white dark:bg-[#2A232A] rounded-3xl overflow-hidden border border-[#E8B7C8]/40 dark:border-[#3D333D] shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                <img
                  src={tpl.thumbnail}
                  alt={tpl.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3">
                  {tpl.isPremium ? (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider text-white shadow" style={{ background: 'linear-gradient(135deg,#E8546F,#C76A82,#D4A73C)' }}>
                      👑 PRO
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/95 dark:bg-[#1F1A1F]/90 text-[#453C45] dark:text-[#F5EDE8] shadow-xs backdrop-blur-xs">
                      Miễn Phí
                    </span>
                  )}
                </div>
                <SampleAlbumStack template={tpl} className="absolute bottom-3 right-3" />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#827580] dark:text-[#B9A9B4] mb-1">
                    <span>{tpl.style}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{tpl.category}</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-[#453C45] dark:text-[#F5EDE8] group-hover:text-[#C76A82] dark:group-hover:text-[#E8B7C8] transition-colors">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-[#827580] dark:text-[#B9A9B4] mt-1.5 line-clamp-2 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8B7C8]/20 dark:border-[#3D333D] flex items-center justify-between text-xs font-semibold text-[#C76A82] dark:text-[#E8B7C8]">
                  <span>Chọn mẫu này</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3b. DANH MỤC LOẠI THIỆP: SINH NHẬT, TÂN GIA, ĐẦY THÁNG...   */}
      {/* ========================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8] font-semibold block mb-1">
            Không Chỉ Thiệp Cưới
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
            Thiệp Mời Online Cho Mọi Dịp Vui
          </h2>
          <p className="text-xs sm:text-sm text-[#827580] dark:text-[#B9A9B4] mt-2">
            Sinh nhật, tân gia, đầy tháng, khai trương, tốt nghiệp — đầy đủ link riêng, QR, xác nhận tham dự & sổ lưu bút.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {eventGroups.map(({ ev, list }) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => onNavigate('templates', { type: ev.id })}
              className="group text-left bg-white dark:bg-[#2A232A] rounded-3xl border border-[#E8B7C8]/40 dark:border-[#3D333D] shadow-xs hover:shadow-xl transition-all p-4 cursor-pointer flex flex-col"
            >
              <div className="relative h-44 mb-4">
                {list.slice(0, 3).map((tpl, k) => (
                  <div
                    key={tpl.id}
                    className="absolute top-0 w-[46%] aspect-[3/4] rounded-xl overflow-hidden shadow-lg border-2 border-white dark:border-[#2A232A] transition-transform duration-500"
                    style={{
                      left: `${[27, 2, 52][k]}%`,
                      zIndex: k === 0 ? 3 : 1,
                      transform: `rotate(${[0, -8, 8][k]}deg) translateY(${k === 0 ? 0 : 10}px)`,
                    }}
                  >
                    <TemplateThumb template={tpl} />
                  </div>
                ))}
              </div>
              <h3 className="font-heading text-base font-bold text-[#453C45] dark:text-[#F5EDE8] group-hover:text-[#C76A82] flex items-center gap-1.5">
                <span aria-hidden>{ev.emoji}</span> {ev.label}
              </h3>
              <p className="text-[11px] text-[#827580] dark:text-[#B9A9B4] mt-1 line-clamp-2 flex-1">{ev.description}</p>
              <span className="mt-3 text-xs font-semibold text-[#C76A82] dark:text-[#E8B7C8] flex items-center gap-1">
                Xem {list.length} mẫu <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. DANH MỤC PHONG CÁCH NGHỆ THUẬT                        */}
      {/* ========================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8] font-semibold block mb-1">
            Đa Dạng Gu Thẩm Mỹ
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
            Khám Phá Phong Cách Phù Hợp
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {styleCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => onNavigate('templates')}
              className="p-5 rounded-2xl border border-[#E8B7C8]/30 dark:border-[#3D333D] shadow-xs hover:shadow-md transition-all text-center cursor-pointer group bg-white dark:bg-[#2A232A]"
            >
              <div
                className="w-8 h-8 mx-auto rounded-full mb-3 border border-black/10 dark:border-white/10"
                style={{ backgroundColor: cat.color }}
              />
              <h4 className="font-heading font-bold text-sm text-[#453C45] dark:text-[#F5EDE8] group-hover:text-[#C76A82] dark:group-hover:text-[#E8B7C8] transition-colors">
                {cat.name}
              </h4>
              <span className="text-xs text-[#827580] dark:text-[#B9A9B4] mt-1 block">{cat.count}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. TẠO THIỆP BẰNG AI GEMINI                               */}
      {/* ========================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="rounded-3xl p-8 md:p-12 bg-gradient-to-r from-[#F6DCE5]/70 via-[#FFFBF7] to-[#E8DFF5]/70 dark:from-[#2E2028] dark:via-[#221B22] dark:to-[#271E2E] border border-[#E8B7C8]/40 dark:border-[#3D333D] shadow-xs relative overflow-hidden">
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Trợ Lý Sáng Tạo Thông Minh</span>
              <span aria-hidden="true">·</span>
              <span>Gemini AI 2026</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[#453C45] dark:text-[#F5EDE8] tracking-tight">
              Tạo Thiệp Cưới Độc Bản Trong 10 Giây Cùng AI
            </h2>
            <p className="text-sm text-[#827580] dark:text-[#B9A9B4] leading-relaxed">
              Bạn không cần mất nhiều ngày để đắn đo chọn phong cách hay câu từ lời mời. Chỉ cần nhập tên của hai bạn, mô hình AI sẽ gợi ý 3 phương án phối màu nghệ thuật và thi văn trang nhã độc nhất vô nhị.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenAIDesigner}
                className="px-7 py-3 rounded-xl bg-[#C76A82] hover:bg-[#B0596E] text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Trải Nghiệm AI Designer Ngay</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. QUY TRÌNH 3 BƯỚC ĐƠN GIẢN                               */}
      {/* ========================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8] font-semibold block mb-1">
            Đơn Giản & Tối Ưu
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
            3 Bước Hoàn Thiện Thiệp Cưới Điện Tử
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((st) => (
            <div
              key={st.num}
              className="p-7 bg-white dark:bg-[#2A232A] rounded-3xl border border-[#E8B7C8]/40 dark:border-[#3D333D] shadow-xs space-y-3 relative flex flex-col justify-between"
            >
              <div>
                <span className="font-heading text-5xl font-bold text-[#E8B7C8]/40 dark:text-[#E8B7C8]/20 block tabular-nums mb-3">
                  {st.num}
                </span>
                <h3 className="font-heading text-xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
                  {st.title}
                </h3>
                <p className="text-xs text-[#827580] dark:text-[#B9A9B4] leading-relaxed mt-2">
                  {st.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. GIẢI PHÁP TIỆN ÍCH & TÍNH NĂNG                         */}
      {/* ========================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8] font-semibold block mb-1">
            Hệ Thống Tiện Ích Trọn Vẹn
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
            Những Tính Năng Không Thể Thiếu
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="p-6 bg-white dark:bg-[#2A232A] rounded-3xl border border-[#E8B7C8]/30 dark:border-[#3D333D] shadow-xs hover:shadow-md transition-all space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#F6DCE5]/40 dark:bg-[#3D2C34] flex items-center justify-center">
                {feat.icon}
              </div>
              <h3 className="font-heading text-base font-bold text-[#453C45] dark:text-[#F5EDE8]">
                {feat.title}
              </h3>
              <p className="text-xs text-[#827580] dark:text-[#B9A9B4] leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. REVIEW TỪ CÁC CẶP ĐÔI (SOCIAL PROOF)                   */}
      {/* ========================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8] font-semibold block mb-1">
            Cảm Nhận Chân Thành
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
            Được Tin Chọn Bởi Hơn 5.000 Cặp Đôi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-white dark:bg-[#2A232A] border border-[#E8B7C8]/40 dark:border-[#3D333D] shadow-xs flex flex-col justify-between space-y-4"
            >
              <p className="text-xs sm:text-sm text-[#453C45] dark:text-[#F5EDE8] italic leading-relaxed">
                "{t.quote}"
              </p>
              <div className="pt-4 border-t border-[#E8B7C8]/20 dark:border-[#3D333D] flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-sm text-[#453C45] dark:text-[#F5EDE8]">
                    {t.couple}
                  </h4>
                  <span className="text-[11px] text-[#827580] dark:text-[#B9A9B4]">
                    {t.location}
                  </span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C76A82] dark:text-[#E8B7C8]">
                  {t.plan}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. BẢNG GIÁ DỊCH VỤ MINH BẠCH                             */}
      {/* ========================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <span className="text-xs uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8] font-semibold block mb-1">
            Bảng Giá Minh Bạch
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
            Lựa Chọn Gói Dịch Vụ Phù Hợp
          </h2>
          <p className="text-xs text-[#827580] dark:text-[#B9A9B4] mt-2">
            Không phụ phí phát sinh. Hỗ trợ thanh toán bảo mật tức thì qua VietQR SePay.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-3xl p-7 sm:p-8 bg-white dark:bg-[#2A232A] border flex flex-col justify-between transition-all ${
                plan.isPopular
                  ? 'border-2 border-[#C76A82] dark:border-[#E8B7C8] shadow-xl relative'
                  : 'border-[#E8B7C8]/40 dark:border-[#3D333D] shadow-xs'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[#C76A82] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                  {plan.badge}
                </span>
              )}

              <div>
                <h3 className="font-heading text-xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
                  {plan.name}
                </h3>
                <p className="text-xs text-[#827580] dark:text-[#B9A9B4] mt-1 mb-4">
                  {plan.description}
                </p>
                <div className="pb-6 border-b border-[#E8B7C8]/20 dark:border-[#3D333D]">
                  <span className="font-heading text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8] tabular-nums">
                    {plan.priceFormatted}
                  </span>
                </div>

                <ul className="py-6 space-y-3 text-xs text-[#453C45] dark:text-[#F5EDE8]">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-[#607B64] dark:text-[#A7D8AF] shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onNavigate('templates')}
                className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  plan.isPopular
                    ? 'bg-[#C76A82] hover:bg-[#B0596E] text-white shadow-sm'
                    : 'bg-neutral-100 dark:bg-[#332A33] hover:bg-neutral-200 dark:hover:bg-[#423642] text-[#453C45] dark:text-[#F5EDE8]'
                }`}
              >
                {plan.price === 0 ? 'Bắt Đầu Miễn Phí' : 'Chọn Gói Này'}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. FAQ CÂU HỎI THƯỜNG GẶP                                */}
      {/* ========================================================= */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8] font-semibold block mb-1">
            Giải Đáp Thắc Mắc
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
            Câu Hỏi Thường Gặp
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#2A232A] rounded-2xl border border-[#E8B7C8]/30 dark:border-[#3D333D] overflow-hidden shadow-xs transition-all"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="font-heading text-sm sm:text-base font-bold text-[#453C45] dark:text-[#F5EDE8]">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#827580] transition-transform ${
                    openFaqIndex === idx ? 'rotate-180 text-[#C76A82]' : ''
                  }`}
                />
              </button>

              {openFaqIndex === idx && (
                <div className="px-4 pb-5 sm:px-5 text-xs text-[#827580] dark:text-[#B9A9B4] leading-relaxed border-t border-neutral-100 dark:border-[#3D333D] pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 11. MODAL XEM NHANH MẪU THIỆP                            */}
      {/* ========================================================= */}
      {previewModalTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2A232A] rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#E8B7C8]/40 dark:border-[#3D333D] flex flex-col md:flex-row max-h-[90vh]">
            <div className="w-full md:w-1/2 h-64 md:h-auto relative bg-[#FAF4F0] dark:bg-[#201A20]">
              <img
                src={previewModalTemplate.preview}
                alt={previewModalTemplate.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold text-white bg-black/60 backdrop-blur-xs">
                  {previewModalTemplate.style}
                </span>
              </div>
            </div>

            <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-[#C76A82] dark:text-[#E8B7C8] font-semibold">
                    {previewModalTemplate.isPremium ? 'Mẫu Premium' : 'Mẫu Miễn Phí'}
                  </span>
                  <button
                    onClick={() => setPreviewModalTemplate(null)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="font-heading text-2xl font-bold text-[#453C45] dark:text-[#F5EDE8] mt-1 mb-2">
                  {previewModalTemplate.name}
                </h3>
                <p className="text-xs text-[#827580] dark:text-[#B9A9B4] leading-relaxed mb-4">
                  {previewModalTemplate.description}
                </p>

                <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-[#3D333D] text-xs">
                  <div>
                    <span className="font-semibold text-[#453C45] dark:text-[#F5EDE8] block mb-1">
                      Bảng màu đặc trưng:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full border border-neutral-200" style={{ backgroundColor: templateSwatches(previewModalTemplate)[0] }} />
                      <span className="w-5 h-5 rounded-full border border-neutral-200" style={{ backgroundColor: templateSwatches(previewModalTemplate)[1] }} />
                      <span className="w-5 h-5 rounded-full border border-neutral-200" style={{ backgroundColor: templateSwatches(previewModalTemplate)[2] }} />
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-[#453C45] dark:text-[#F5EDE8] block mb-1">
                      Lời mời mẫu:
                    </span>
                    <p className="italic text-[#453C45] dark:text-[#F5EDE8] bg-neutral-50 dark:bg-[#201A20] p-2.5 rounded-xl border border-neutral-200 dark:border-[#3D333D] leading-relaxed">
                      "{previewModalTemplate.defaultInvitationMessage}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-neutral-100 dark:border-[#3D333D] flex items-center gap-3">
                <button
                  onClick={() => setPreviewModalTemplate(null)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-[#3D333D] text-xs font-semibold text-[#453C45] dark:text-[#F5EDE8] hover:bg-neutral-50 dark:hover:bg-[#332A33] cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    onSelectTemplate(previewModalTemplate);
                    setPreviewModalTemplate(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#C76A82] text-white text-xs font-bold hover:bg-[#B0596E] shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-current" />
                  <span>Sử Dụng Mẫu Này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
