import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Share2,
  Download,
  Users,
  Edit,
  Sparkles,
  Heart,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import { WeddingInvitation } from '../types/wedding';
import { formatDateVN, generateQrDataUrl } from '../utils/formatters';

interface PublishedSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  invitation: WeddingInvitation;
  onManageGuests: () => void;
  onContinueEditing: () => void;
}

export const PublishedSuccessModal: React.FC<PublishedSuccessModalProps> = ({
  isOpen,
  onClose,
  invitation,
  onManageGuests,
  onContinueEditing,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://thieponl.vn';
  const publicUrl = `${origin}/invite/${invitation.slug || invitation.id}`;

  useEffect(() => {
    if (isOpen && (invitation.slug || invitation.id)) {
      generateQrDataUrl(publicUrl, '#C76A82').then((url) => setQrDataUrl(url));
    }
  }, [isOpen, invitation.slug, invitation.id, publicUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_ThiepCuoi_${invitation.slug || invitation.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareFacebook = () => {
    const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`;
    window.open(fbShareUrl, '_blank', 'width=600,height=400');
  };

  const handleShareZalo = () => {
    const zaloShareUrl = `https://sp.zalo.me/share_inline?link=${encodeURIComponent(publicUrl)}`;
    window.open(zaloShareUrl, '_blank', 'width=600,height=500');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-[#2A232A] rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative border border-[#E8B7C8]/40 dark:border-[#3D333D] my-6 transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-[#F5EDE8] p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#332A33] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm ring-8 ring-emerald-50 dark:ring-emerald-950/20">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xuất bản thành công • Không còn watermark</span>
          </div>

          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
            Thiệp Cưới Đã Sẵn Sàng!
          </h2>

          <p className="text-xs sm:text-sm text-[#827580] dark:text-[#B9A9B4] max-w-md mx-auto">
            Hôn lễ của <strong className="text-[#C76A82] dark:text-[#E8B7C8]">{invitation.brideName} & {invitation.groomName}</strong> ({formatDateVN(invitation.weddingDate)}) đã được xuất bản chính thức lên mạng Internet.
          </p>
        </div>

        {/* Public URL Box */}
        <div className="bg-[#FAF8F5] dark:bg-[#1F1A1F] rounded-2xl p-4 border border-[#E8B7C8]/30 dark:border-[#3D333D] mb-6 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-[#827580] dark:text-[#B9A9B4] block">
            Đường Dẫn Thiệp Công Khai
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 bg-white dark:bg-[#2A232A] border border-[#E8B7C8]/40 dark:border-[#3D333D] text-[#453C45] dark:text-[#F5EDE8] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono truncate focus:outline-none"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-xs shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#C76A82] hover:bg-[#B0596E] text-white'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
            </button>
          </div>
        </div>

        {/* QR Code and Sharing Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* QR Box */}
          <div className="bg-[#FAF8F5] dark:bg-[#1F1A1F] rounded-2xl p-4 border border-[#E8B7C8]/30 dark:border-[#3D333D] flex flex-col items-center justify-center text-center space-y-2">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Mã QR Thiệp" className="w-28 h-28 rounded-lg shadow-sm bg-white p-1" />
            ) : (
              <div className="w-28 h-28 bg-neutral-100 rounded-lg animate-pulse" />
            )}
            <button
              onClick={handleDownloadQr}
              className="text-xs font-semibold text-[#C76A82] dark:text-[#E8B7C8] hover:underline flex items-center gap-1 cursor-pointer pt-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải ảnh QR thiệp</span>
            </button>
          </div>

          {/* Social Sharing */}
          <div className="bg-[#FAF8F5] dark:bg-[#1F1A1F] rounded-2xl p-4 border border-[#E8B7C8]/30 dark:border-[#3D333D] flex flex-col justify-between space-y-3">
            <span className="text-xs font-bold text-[#453C45] dark:text-[#F5EDE8] block">
              Chia sẻ thiệp ngay tới khách
            </span>
            <div className="space-y-2">
              <button
                onClick={handleShareFacebook}
                className="w-full py-2 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Chia sẻ qua Facebook</span>
              </button>
              <button
                onClick={handleShareZalo}
                className="w-full py-2 px-3 rounded-xl bg-[#0068FF] hover:bg-[#005cd6] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Gửi qua Zalo</span>
              </button>
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-3 rounded-xl border border-neutral-300 dark:border-[#3D333D] text-[#453C45] dark:text-[#F5EDE8] hover:bg-white dark:hover:bg-[#2A232A] text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Mở xem trang thiệp</span>
              </a>
            </div>
          </div>
        </div>

        {/* Next Steps Footer */}
        <div className="border-t border-[#E8B7C8]/25 dark:border-[#3D333D] pt-5 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onManageGuests();
            }}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#607B64] hover:bg-[#47634C] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Users className="w-4 h-4" />
            <span>Quản Lý Khách Mời & RSVP</span>
          </button>
          <button
            onClick={() => {
              onClose();
              onContinueEditing();
            }}
            className="w-full sm:w-auto py-3 px-4 rounded-xl border border-neutral-200 dark:border-[#3D333D] text-[#453C45] dark:text-[#F5EDE8] hover:bg-neutral-50 dark:hover:bg-[#332A33] text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4 text-[#C76A82]" />
            <span>Chỉnh sửa tiếp</span>
          </button>
        </div>

        <p className="text-[11px] text-center text-[#827580] dark:text-[#B9A9B4] mt-4">
          Biên nhận thanh toán và liên kết thiệp đã được lưu an toàn trong tài khoản của bạn.
        </p>
      </div>
    </div>
  );
};
