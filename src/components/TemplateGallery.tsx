import React, { useState, useMemo, useEffect } from 'react';
import { generateQrDataUrl } from '../utils/formatters';
import { buildDemoLink } from '../utils/engagement';
import { SampleAlbumStack } from './SampleAlbumStack';
import { TemplateThumb } from './TemplateThumb';
import { EVENT_TYPES, eventConfig } from '../data/eventTypes';
import { EventType } from '../types/wedding';
import { sampleAlbumFor } from '../data/sampleAlbum';
import { Search, Sparkles, Filter, Check, Eye, Heart, ArrowRight, X } from 'lucide-react';
import { WeddingTemplate, TemplateCategory } from '../types/wedding';
import { WEDDING_TEMPLATES } from '../data/templates';
import { TemplateFilterBar, filterTemplates, isPublishedTemplate, CollectionFilter, ColorFilter, templateSwatches } from './TemplateFilterBar';

const ALL_PUBLISHED = WEDDING_TEMPLATES.filter(isPublishedTemplate);
const typeOf = (t: WeddingTemplate): EventType => t.eventType || 'wedding';

/** QR mở trang demo của mẫu thiệp trên điện thoại. */
const DemoQr: React.FC<{ template: WeddingTemplate }> = ({ template }) => {
  const [qr, setQr] = useState('');
  const link = buildDemoLink(template.slug);
  useEffect(() => {
    generateQrDataUrl(link, '#453C45').then(setQr);
  }, [link]);
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FAF8F5] dark:bg-[#201A20] border border-[#E8B7C8]/30 dark:border-[#3D333D]">
      {qr ? (
        <img src={qr} alt={`QR demo ${template.name}`} className="w-24 h-24 rounded-lg bg-white p-1 shrink-0" />
      ) : (
        <div className="w-24 h-24 rounded-lg bg-white shrink-0" />
      )}
      <div className="text-xs text-[#453C45] dark:text-[#F5EDE8] space-y-1.5">
        <p className="font-semibold">Quét mã QR để xem demo trực tiếp trên điện thoại</p>
        <p className="text-[#827580] dark:text-[#B9A9B4]">Tạo miễn phí • Đổi mẫu bất cứ lúc nào khi chỉnh sửa</p>
        <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#C76A82] font-semibold underline">
          <Eye className="w-3.5 h-3.5" /> Xem demo
        </a>
      </div>
    </div>
  );
};

interface TemplateGalleryProps {
  onSelectTemplate: (template: WeddingTemplate) => void;
  onOpenAIDesigner?: () => void;
  initialEventType?: EventType;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelectTemplate,
  onOpenAIDesigner,
  initialEventType,
}) => {
  const [eventType, setEventTypeState] = useState<EventType>(() => {
    if (initialEventType) return initialEventType;
    try {
      const q = new URLSearchParams(window.location.search).get('type') as EventType | null;
      if (q && EVENT_TYPES.some((e) => e.id === q)) return q;
    } catch {
      /* ignore */
    }
    return 'wedding';
  });
  const PUBLISHED = useMemo(() => ALL_PUBLISHED.filter((t) => typeOf(t) === eventType), [eventType]);
  const ev = eventConfig(eventType);
  const isWedding = eventType === 'wedding';
  const setEventType = (t: EventType) => {
    setEventTypeState(t);
    setSelectedCategory('all');
    setCollectionFilter('all');
    setColorFilter('all');
    setSearchQuery('');
    try {
      window.history.replaceState({}, '', t === 'wedding' ? '/templates' : `/templates?type=${t}`);
    } catch {
      /* ignore */
    }
  };
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewModalTemplate, setPreviewModalTemplate] = useState<WeddingTemplate | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');
  const [colorFilter, setColorFilter] = useState<ColorFilter>('all');

  const categories = [
    { id: 'all', label: 'Tất cả mẫu' },
    { id: 'pastel', label: 'Pastel Romantic' },
    { id: 'korean', label: 'Korean Minimal' },
    { id: 'floral', label: 'Floral Garden' },
    { id: 'champagne', label: 'Champagne Luxury' },
    { id: 'traditional', label: 'Áo Dài Truyền Thống' },
    { id: 'minimal', label: 'Minimal White' },
    { id: 'lavender', label: 'Lavender Dream' },
    { id: 'sage', label: 'Sage Green' },
    { id: 'blossom', label: 'Hoa Anh Đào' },
    { id: 'vintage', label: 'Vintage Pháp' },
    { id: 'classic', label: 'Dạ Tiệc Tinh Tú' },
  ];

  const filteredTemplates = useMemo(() => {
    return filterTemplates(PUBLISHED, collectionFilter, colorFilter).filter((tpl) => {
      // Category filter
      if (selectedCategory !== 'all' && tpl.category !== selectedCategory) {
        return false;
      }
      // Tier filter
      if (tierFilter === 'free' && tpl.isPremium) return false;
      if (tierFilter === 'premium' && !tpl.isPremium) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tpl.name.toLowerCase().includes(q) ||
          tpl.style.toLowerCase().includes(q) ||
          (tpl.colorName || '').toLowerCase().includes(q) ||
          tpl.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [PUBLISHED, selectedCategory, tierFilter, searchQuery, collectionFilter, colorFilter]);

  return (
    <div className="py-10 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-colors duration-200">
      {/* Header section */}
      <div className="text-center max-w-3xl mx-auto mb-10 md:mb-14">
        <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#C76A82] dark:text-[#E8B7C8] mb-2">
          <span>Bộ Sưu Tập Mẫu Thiệp 2026</span>
          <span aria-hidden="true">·</span>
          <span>{ALL_PUBLISHED.length} Thiết Kế</span>
        </div>
        <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[#453C45] dark:text-[#F5EDE8] tracking-tight mb-4">
          {isWedding ? 'Thư Viện Mẫu Thiệp Cưới Sang Trọng' : `Mẫu ${ev.label} Online`}
        </h1>
        <p className="text-sm sm:text-base text-[#827580] dark:text-[#B9A9B4] leading-relaxed max-w-2xl mx-auto font-light">
          Tất cả mẫu thiệp được chế tác theo phong cách <strong>Pastel Luxury & Korean Minimal</strong>, tối ưu hoá tương thích 100% trên thiết bị di động.
        </p>

        {/* AI Banner Callout */}
        {onOpenAIDesigner && (
          <div className="mt-8 p-5 rounded-3xl bg-gradient-to-r from-[#F6DCE5]/70 via-[#FFFBF7] to-[#E8DFF5]/70 dark:from-[#2E2028] dark:via-[#221B22] dark:to-[#271E2E] border border-[#E8B7C8]/40 dark:border-[#3D333D] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-[#33252E] shadow-xs flex items-center justify-center text-[#C76A82] dark:text-[#E8B7C8] shrink-0 border border-[#E8B7C8]/30">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-heading text-sm sm:text-base font-bold text-[#453C45] dark:text-[#F5EDE8]">
                  Chưa tìm được mẫu ưng ý? Hãy để AI phối màu cho bạn
                </h4>
                <p className="text-xs text-[#827580] dark:text-[#B9A9B4] mt-0.5">
                  Nhập tên cặp đôi và chọn phong cách, Gemini AI sẽ tạo 3 phương án phối màu độc bản trong 10 giây.
                </p>
              </div>
            </div>
            <button
              onClick={onOpenAIDesigner}
              className="px-5 py-2.5 bg-[#C76A82] hover:bg-[#B0596E] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thiết Kế Bằng AI</span>
            </button>
          </div>
        )}
      </div>

      {/* Danh mục loại thiệp */}
      <div className="mb-8 -mx-1 flex gap-2 overflow-x-auto pb-2 px-1" role="tablist" aria-label="Loại thiệp">
        {EVENT_TYPES.map((e) => {
          const count = ALL_PUBLISHED.filter((t) => typeOf(t) === e.id).length;
          const on = e.id === eventType;
          return (
            <button
              key={e.id}
              role="tab"
              aria-selected={on}
              onClick={() => setEventType(e.id)}
              className={`shrink-0 px-4 py-2.5 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                on
                  ? 'bg-[#C76A82] text-white border-[#C76A82] shadow-sm'
                  : 'bg-white dark:bg-[#2A232A] text-[#453C45] dark:text-[#F5EDE8] border-[#E8B7C8]/40 dark:border-[#3D333D] hover:border-[#C76A82]'
              }`}
            >
              <span aria-hidden>{e.emoji}</span>
              {e.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${on ? 'bg-white/25' : 'bg-[#F6DCE5]/60 dark:bg-[#3D333D]'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filters */}
      <div className="space-y-4 mb-10">
        {isWedding && <TemplateFilterBar
          templates={PUBLISHED}
          collection={collectionFilter}
          color={colorFilter}
          onCollectionChange={setCollectionFilter}
          onColorChange={setColorFilter}
        />}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#827580] dark:text-[#B9A9B4]" />
            <input
              type="text"
              placeholder="Tìm theo tên mẫu, phong cách..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-2xl border border-[#E8B7C8]/40 dark:border-[#3D333D] bg-white dark:bg-[#2A232A] text-[#453C45] dark:text-[#F5EDE8] placeholder-[#827580] dark:placeholder-[#7E6E7A] focus:outline-none focus:ring-2 focus:ring-[#C76A82]/40 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tier Filter (Buttons) */}
          <div className="flex items-center gap-1 p-1 bg-[#FAF4F0] dark:bg-[#201A20] rounded-2xl border border-[#E8B7C8]/30 dark:border-[#3D333D]">
            <button
              onClick={() => setTierFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                tierFilter === 'all'
                  ? 'bg-white dark:bg-[#2A232A] text-[#453C45] dark:text-[#F5EDE8] shadow-xs'
                  : 'text-[#827580] dark:text-[#B9A9B4] hover:text-[#453C45] dark:hover:text-[#F5EDE8]'
              }`}
            >
              Tất cả ({PUBLISHED.length})
            </button>
            <button
              onClick={() => setTierFilter('free')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                tierFilter === 'free'
                  ? 'bg-white dark:bg-[#2A232A] text-[#453C45] dark:text-[#F5EDE8] shadow-xs'
                  : 'text-[#827580] dark:text-[#B9A9B4] hover:text-[#453C45] dark:hover:text-[#F5EDE8]'
              }`}
            >
              Miễn phí (Free)
            </button>
            <button
              onClick={() => setTierFilter('premium')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                tierFilter === 'premium'
                  ? 'bg-white dark:bg-[#2A232A] text-[#C76A82] dark:text-[#E8B7C8] shadow-xs'
                  : 'text-[#827580] dark:text-[#B9A9B4] hover:text-[#C76A82] dark:hover:text-[#E8B7C8]'
              }`}
            >
              Cao cấp (Premium)
            </button>
          </div>
        </div>

        {/* Category Horizontal Filter Bar */}
        <div className={`${isWedding ? 'flex' : 'hidden'} items-center gap-2 overflow-x-auto pb-2 scrollbar-none`}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 text-xs font-medium rounded-full whitespace-nowrap transition-all cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-[#453C45] text-white border-[#453C45] dark:bg-[#E8B7C8] dark:text-[#201A20] dark:border-[#E8B7C8] shadow-xs'
                  : 'bg-white dark:bg-[#2A232A] text-[#827580] dark:text-[#B9A9B4] border-[#E8B7C8]/30 dark:border-[#3D333D] hover:border-[#C76A82] hover:text-[#C76A82] dark:hover:text-[#E8B7C8]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Templates */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#2A232A] rounded-3xl border border-[#E8B7C8]/40 dark:border-[#3D333D] max-w-md mx-auto p-8">
          <p className="text-sm text-[#827580] dark:text-[#B9A9B4] mb-3">
            Không tìm thấy mẫu thiệp phù hợp với tiêu chí tìm kiếm.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setTierFilter('all');
              setSearchQuery('');
              setCollectionFilter('all');
              setColorFilter('all');
            }}
            className="text-xs font-semibold text-[#C76A82] dark:text-[#E8B7C8] underline cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((tpl) => (
            <div
              key={tpl.id}
              className="group bg-white dark:bg-[#2A232A] rounded-3xl overflow-hidden border border-[#E8B7C8]/40 dark:border-[#3D333D] shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Card Image Container */}
              <div className="relative aspect-[3/4] overflow-hidden bg-[#FAF4F0] dark:bg-[#201A20]">
                <TemplateThumb template={tpl} className="group-hover:scale-105 transition-transform duration-700" />

                {tpl.featured && isWedding && !tpl.hot && <SampleAlbumStack template={tpl} className="absolute bottom-3 right-3" />}

                {/* Status Badges */}
                <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/95 dark:bg-[#1F1A1F]/90 text-[#453C45] dark:text-[#F5EDE8] shadow-xs backdrop-blur-xs">
                    {tpl.isPremium ? 'Mẫu Premium' : 'Mẫu Miễn Phí'}
                  </span>
                </div>

                {/* Color preview dots */}
                <div className="absolute bottom-3.5 left-3.5 flex items-center -space-x-1 p-1 bg-white/80 dark:bg-[#1F1A1F]/80 backdrop-blur-xs rounded-full border border-black/5 dark:border-white/5">
                  <span className="w-3.5 h-3.5 rounded-full border border-white dark:border-[#2A232A]" style={{ backgroundColor: templateSwatches(tpl)[0] }} />
                  <span className="w-3.5 h-3.5 rounded-full border border-white dark:border-[#2A232A]" style={{ backgroundColor: templateSwatches(tpl)[1] }} />
                  <span className="w-3.5 h-3.5 rounded-full border border-white dark:border-[#2A232A]" style={{ backgroundColor: templateSwatches(tpl)[2] }} />
                </div>

                {/* Hover Quick Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 p-4">
                  <button
                    onClick={() => setPreviewModalTemplate(tpl)}
                    className="p-2.5 rounded-xl bg-white dark:bg-[#2A232A] text-[#453C45] dark:text-[#F5EDE8] hover:text-[#C76A82] dark:hover:text-[#E8B7C8] shadow-md transition-transform hover:scale-105 cursor-pointer"
                    title="Xem chi tiết mẫu"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onSelectTemplate(tpl)}
                    className="px-4 py-2.5 rounded-xl bg-[#C76A82] hover:bg-[#B0596E] text-white text-xs font-bold shadow-md transition-transform hover:scale-105 cursor-pointer flex items-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>Dùng Mẫu Này</span>
                  </button>
                </div>
              </div>

              {/* Card Meta Content */}
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

                <div className="pt-3.5 mt-3.5 border-t border-[#E8B7C8]/20 dark:border-[#3D333D] flex items-center justify-between">
                  <button
                    onClick={() => setPreviewModalTemplate(tpl)}
                    className="text-xs text-[#827580] dark:text-[#B9A9B4] hover:text-[#453C45] dark:hover:text-[#F5EDE8] transition-colors cursor-pointer"
                  >
                    Xem chi tiết
                  </button>
                  <button
                    onClick={() => onSelectTemplate(tpl)}
                    className="text-xs font-bold text-[#C76A82] dark:text-[#E8B7C8] hover:text-[#B0596E] flex items-center gap-1 cursor-pointer group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Tạo ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Template Preview Modal */}
      {previewModalTemplate && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2A232A] rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#E8B7C8]/40 dark:border-[#3D333D] flex flex-col md:flex-row max-h-[90vh]">
            {/* Modal Image */}
            <div className="w-full md:w-1/2 aspect-[3/4] bg-[#FAF4F0] dark:bg-[#201A20] relative">
              <TemplateThumb template={previewModalTemplate} large />
              <div className="absolute top-3.5 left-3.5">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold text-white bg-black/60 backdrop-blur-xs">
                  {previewModalTemplate.style}
                </span>
              </div>
            </div>

            {/* Modal Details */}
            <div className="w-full md:w-1/2 p-6 sm:p-7 flex flex-col justify-between overflow-y-auto">
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

                <div className="space-y-3 pt-3 border-t border-[#E8B7C8]/20 dark:border-[#3D333D] text-xs">
                  <div>
                    <span className="font-semibold text-[#453C45] dark:text-[#F5EDE8] block mb-1.5">
                      Bảng màu chủ đạo:
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: templateSwatches(previewModalTemplate)[0] }} />
                      <span className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: templateSwatches(previewModalTemplate)[1] }} />
                      <span className="w-5 h-5 rounded-full border border-black/10 dark:border-white/10" style={{ backgroundColor: templateSwatches(previewModalTemplate)[2] }} />
                    </div>
                  </div>

                  <div>
                    <span className="font-semibold text-[#453C45] dark:text-[#F5EDE8] block mb-1">
                      Lời mời mẫu:
                    </span>
                    <p className="italic text-[#453C45] dark:text-[#F5EDE8] bg-neutral-50 dark:bg-[#201A20] p-3 rounded-2xl border border-neutral-200 dark:border-[#3D333D] leading-relaxed">
                      "{previewModalTemplate.defaultInvitationMessage}"
                    </p>
                  </div>

                  {typeOf(previewModalTemplate) === 'wedding' && !previewModalTemplate.hot && <div>
                    <span className="font-semibold text-[#453C45] dark:text-[#F5EDE8] block mb-1.5">
                      Album ảnh cưới trên thiệp (ảnh mẫu):
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {sampleAlbumFor(previewModalTemplate, true).map((src) => (
                        <img key={src} src={src} alt="" loading="lazy" className="w-16 h-24 object-cover rounded-lg border border-[#E8B7C8]/40 shrink-0" />
                      ))}
                    </div>
                  </div>}

                  <DemoQr template={previewModalTemplate} />
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-[#E8B7C8]/20 dark:border-[#3D333D] flex items-center gap-3">
                <button
                  onClick={() => setPreviewModalTemplate(null)}
                  className="flex-1 py-3 rounded-xl border border-neutral-300 dark:border-[#3D333D] text-xs font-semibold text-[#453C45] dark:text-[#F5EDE8] hover:bg-neutral-50 dark:hover:bg-[#332A33] cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    onSelectTemplate(previewModalTemplate);
                    setPreviewModalTemplate(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#C76A82] hover:bg-[#B0596E] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
