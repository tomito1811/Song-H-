import React, { useMemo } from 'react';
import {
  X,
  Sparkles,
  Check,
  AlertCircle,
  Crown,
  Heart,
  Image as ImageIcon,
  Music,
  Gift,
  Users,
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';
import { WeddingInvitation, WeddingTemplate } from '../types/wedding';
import { PRICING_PLANS } from '../data/pricing';
import { WEDDING_TEMPLATES } from '../data/templates';
import { formatDateVN, formatVND } from '../utils/formatters';

interface PublishPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: WeddingInvitation;
  onSelectPlan: (planId: 'free' | 'premium' | 'luxury') => void;
  isLoading?: boolean;
  /** Tài khoản còn lượt thiệp miễn phí (mỗi Gmail 1 thiệp, đầy đủ tính năng). */
  freeTrialAvailable?: boolean;
}

export const PublishPlanModal: React.FC<PublishPlanModalProps> = ({
  isOpen,
  onClose,
  invitation,
  onSelectPlan,
  isLoading = false,
  freeTrialAvailable = true,
}) => {
  if (!isOpen) return null;

  // Resolve template info
  const template = useMemo(() => {
    return (
      WEDDING_TEMPLATES.find((t) => t.id === invitation.templateId || t.slug === invitation.templateId) ||
      WEDDING_TEMPLATES[0]
    );
  }, [invitation.templateId]);

  // Feature detection in current invitation
  const isPremiumTemplate = Boolean(template?.isPremium);
  const photoCount = invitation.galleryImages?.length || 0;
  const hasMusic = Boolean(invitation.musicUrl && invitation.musicUrl.trim() !== '');
  const hasGiftBox = Boolean(invitation.giftBank?.enabled);
  const hasRsvp = Boolean(invitation.sectionsVisibility?.rsvp);

  // Mỗi tài khoản Gmail được 1 thiệp miễn phí đầy đủ tính năng.
  const freeDisqualifiers: string[] = [];
  if (!freeTrialAvailable) freeDisqualifiers.push('tài khoản đã dùng lượt thiệp miễn phí');
  if (template?.isPremium || template?.hot) freeDisqualifiers.push('chọn mẫu HOT / cao cấp (chỉ dành cho gói PRO)');

  const isFreeEligible = freeDisqualifiers.length === 0;

  // Recommended plan determination
  const recommendedPlanId: 'free' | 'premium' | 'luxury' =
    isFreeEligible ? 'free' : photoCount > 25 ? 'luxury' : 'premium';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#2A232A] rounded-3xl max-w-4xl w-full p-5 sm:p-8 shadow-2xl relative border border-[#E8B7C8]/40 dark:border-[#3D333D] my-6 transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-[#F5EDE8] p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#332A33] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Card Summary */}
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6DCE5]/60 dark:bg-[#E8B7C8]/20 text-[#C76A82] dark:text-[#E8B7C8] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xuất Bản Website Thiệp Cưới Cá Nhân</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
            Chọn Gói Để Xuất Bản Thiệp
          </h2>
          <p className="text-xs sm:text-sm text-[#827580] dark:text-[#B9A9B4]">
            Thiết kế hoàn toàn miễn phí. Bạn chỉ thanh toán khi hài lòng và sẵn sàng xuất bản gửi lời mời đến bạn bè.
          </p>
        </div>

        {/* Selected Card Snapshot */}
        <div className="bg-[#FAF8F5] dark:bg-[#1F1A1F] rounded-2xl p-4 mb-6 border border-[#E8B7C8]/30 dark:border-[#3D333D] flex flex-col sm:flex-row items-center gap-4">
          <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0 border-2 border-white dark:border-[#3D333D] shadow-sm">
            <img
              src={invitation.coverImage || template?.thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="font-heading text-lg font-bold text-[#453C45] dark:text-[#F5EDE8]">
                {invitation.brideName} & {invitation.groomName}
              </h3>
              {isPremiumTemplate ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#B6925B] text-white">
                  Mẫu Premium
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-200 dark:bg-neutral-800 text-[#453C45] dark:text-[#F5EDE8]">
                  Mẫu Miễn Phí
                </span>
              )}
            </div>
            <p className="text-xs text-[#827580] dark:text-[#B9A9B4]">
              Hôn lễ: {invitation.weddingDate ? formatDateVN(invitation.weddingDate) : 'Chưa định ngày'} • {invitation.venueName || 'Địa điểm tiệc cưới'}
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-[11px] text-[#453C45] dark:text-[#F5EDE8] pt-1">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-[#C76A82]" />
                {photoCount} ảnh
              </span>
              <span className="flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-[#C76A82]" />
                {hasMusic ? 'Có nhạc nền' : 'Không có nhạc'}
              </span>
              <span className="flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-[#C76A82]" />
                {hasGiftBox ? 'Bật hộp mừng VietQR' : 'Tắt hộp mừng'}
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRICING_PLANS.map((plan) => {
            const isFree = plan.id === 'free';
            const isPremium = plan.id === 'premium';
            const isLuxury = plan.id === 'luxury';
            const isRecommended = plan.id === recommendedPlanId;
            const isLocked = isFree && !isFreeEligible;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 border ${
                  isLocked
                    ? 'bg-neutral-50 dark:bg-[#241D24] border-neutral-200 dark:border-[#3D333D] opacity-60'
                    : isRecommended
                    ? 'bg-[#FFFBF7] dark:bg-[#1F1A1F] border-2 border-[#C76A82] dark:border-[#E8B7C8] shadow-md ring-2 ring-[#C76A82]/10'
                    : 'bg-white dark:bg-[#2A232A] border-[#E8B7C8]/40 dark:border-[#3D333D] hover:border-[#C76A82] dark:hover:border-[#E8B7C8]'
                }`}
              >
                {/* Badge if recommended */}
                {isRecommended && !isLocked && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-[#D4899C] to-[#C76A82] text-white text-[10px] font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Khuyên dùng cho thiệp này</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-heading font-bold text-base text-[#453C45] dark:text-[#F5EDE8]">
                      {plan.name}
                    </h4>
                    {isLuxury && <Crown className="w-4 h-4 text-[#B6925B]" />}
                  </div>

                  <div className="mb-3">
                    <span className="font-heading text-2xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
                      {plan.priceFormatted}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-xs text-[#827580] dark:text-[#B9A9B4] ml-1">/ trọn gói</span>
                    )}
                  </div>

                  <p className="text-xs text-[#827580] dark:text-[#B9A9B4] mb-4 leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Disqualification alert for Free */}
                  {isLocked && (
                    <div className="mb-4 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200 space-y-1">
                      <div className="flex items-center gap-1 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Chưa đủ điều kiện:</span>
                      </div>
                      <p className="leading-snug">
                        Bạn đã {freeDisqualifiers.join(' và ')}. Hãy chọn gói PRO hoặc LUXURY để xuất bản.
                      </p>
                    </div>
                  )}

                  {/* Features list */}
                  <ul className="space-y-2 text-xs text-[#453C45] dark:text-[#F5EDE8] mb-6">
                    {plan.features.slice(0, 5).map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Selection Action Button */}
                <div>
                  <button
                    type="button"
                    disabled={isLocked || isLoading}
                    onClick={() => onSelectPlan(plan.id)}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
                      isLocked
                        ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600'
                        : isRecommended
                        ? 'bg-[#C76A82] hover:bg-[#B0596E] text-white shadow-xs'
                        : 'border border-[#C76A82] dark:border-[#E8B7C8] text-[#C76A82] dark:text-[#E8B7C8] hover:bg-[#F6DCE5]/30'
                    }`}
                  >
                    <span>{isFree ? 'Dùng Lượt Miễn Phí & Xuất Bản' : `Chọn Gói ${plan.name}`}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer reassurance */}
        <div className="mt-6 pt-4 border-t border-[#E8B7C8]/25 dark:border-[#3D333D] flex flex-wrap items-center justify-between gap-3 text-xs text-[#827580] dark:text-[#B9A9B4]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kích hoạt tự động qua chuyển khoản VietQR TPBank 24/7</span>
          </div>
          <span>Bảo lưu quyền chỉnh sửa thiệp không giới hạn sau khi xuất bản</span>
        </div>
      </div>
    </div>
  );
};
