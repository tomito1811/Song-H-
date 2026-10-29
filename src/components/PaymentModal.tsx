import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  Check,
  Clock,
  Download,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Loader2,
  RefreshCw,
  ExternalLink,
  MessageCircle,
  Mail,
  Sparkles,
  FlaskConical
} from 'lucide-react';
import { Order } from '../types/wedding';
import { formatVND } from '../utils/formatters';
import { pollOrderStatus, simulateDevPayment } from '../utils/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    amount: number;
    referenceCode: string;
    vietQrUrl: string;
  };
  onPaymentSuccess: (paidOrder: Order) => void;
  onCreateNewOrder: () => void;
  isAdmin?: boolean;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  bankAccount,
  onPaymentSuccess,
  onCreateNewOrder,
  isAdmin = false,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(() => {
    if (order.expiresAt) {
      const remaining = Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return 30 * 60;
  });
  const [isSimulating, setIsSimulating] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  // 30-minute countdown timer
  useEffect(() => {
    if (!isOpen || timeLeftSeconds <= 0) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeftSeconds]);

  // Realtime order polling (every 2.5s)
  useEffect(() => {
    if (!isOpen || timeLeftSeconds <= 0) return;

    const interval = setInterval(async () => {
      try {
        const res = await pollOrderStatus(order.id);
        if (res.isPaid) {
          clearInterval(interval);
          onPaymentSuccess(res.order);
        }
      } catch {
        // Polling gracefully ignores transient errors
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isOpen, order.id, timeLeftSeconds, onPaymentSuccess]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isExpired = timeLeftSeconds <= 0;

  // Dev simulation of SePay webhook
  const handleSimulateWebhook = async () => {
    setIsSimulating(true);
    try {
      const res = await simulateDevPayment(order.id);
      if (res.isPaid && res.order) {
        onPaymentSuccess(res.order);
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi kích hoạt giả lập thanh toán');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#2A232A] rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl relative border border-[#E8B7C8]/40 dark:border-[#3D333D] my-6 transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-[#F5EDE8] p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#332A33] transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center max-w-md mx-auto space-y-1 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F6DCE5]/60 dark:bg-[#E8B7C8]/20 text-[#C76A82] dark:text-[#E8B7C8] text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>Thanh Toán Chuyển Khoản Tự Động 24/7</span>
          </div>
          <h2 className="font-heading text-2xl font-bold text-[#453C45] dark:text-[#F5EDE8]">
            Quét Mã VietQR Để Xuất Bản Thiệp
          </h2>
          <p className="text-xs text-[#827580] dark:text-[#B9A9B4]">
            Hệ thống ngân hàng TPBank tự động xác thực và kích hoạt website thiệp cưới của bạn ngay sau khi nhận giao dịch.
          </p>
        </div>

        {/* Countdown Timer Bar */}
        <div className="mb-6 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-[#FAF8F5] dark:bg-[#1F1A1F] border border-[#E8B7C8]/30 dark:border-[#3D333D]">
          <div className="flex items-center gap-2 text-xs text-[#453C45] dark:text-[#F5EDE8] font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Đang chờ chuyển khoản từ ứng dụng ngân hàng…</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold tabular-nums">
            <span className="text-[#827580] dark:text-[#B9A9B4]">Hiệu lực mã:</span>
            <span className={isExpired ? 'text-red-500' : 'text-[#C76A82] dark:text-[#E8B7C8]'}>
              {formatTimer(timeLeftSeconds)}
            </span>
          </div>
        </div>

        {/* Expired Notification */}
        {isExpired ? (
          <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-center space-y-4 my-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto" />
            <h4 className="font-heading font-bold text-base text-red-700 dark:text-red-300">
              Mã Chuyển Khoản Đã Hết Hạn 30 Phút
            </h4>
            <p className="text-xs text-red-600 dark:text-red-400 max-w-sm mx-auto leading-relaxed">
              Thiệp cưới của bạn vẫn được lưu an toàn trong hệ thống. Vui lòng bấm tạo mã thanh toán mới để hoàn tất xuất bản thiệp.
            </p>
            <button
              onClick={onCreateNewOrder}
              className="px-5 py-2.5 bg-[#C76A82] hover:bg-[#B0596E] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tạo Mã Thanh Toán Mới
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Dynamic QR Code */}
            <div className="md:col-span-5 flex flex-col items-center text-center">
              <div className="w-56 h-56 p-3 bg-white rounded-2xl border-2 border-[#E8B7C8]/50 shadow-md flex items-center justify-center relative group">
                <img
                  src={bankAccount.vietQrUrl}
                  alt="VietQR TPBank"
                  className="w-full h-full object-contain"
                />
              </div>
              <a
                href={bankAccount.vietQrUrl}
                download={`VietQR-${bankAccount.referenceCode}.png`}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8B7C8] dark:border-[#3D333D] text-xs font-semibold text-[#C76A82] dark:text-[#E8B7C8] hover:bg-[#F6DCE5]/30 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Tải ảnh mã QR
              </a>
            </div>

            {/* Right: Bank Transfer Account Breakdown with 1-click Copy */}
            <div className="md:col-span-7 space-y-2.5">
              {/* Bank Name */}
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1F1A1F] border border-neutral-200 dark:border-[#3D333D] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#827580] dark:text-[#B9A9B4] block">
                    Ngân hàng
                  </span>
                  <span className="text-xs font-bold text-[#453C45] dark:text-[#F5EDE8]">
                    {bankAccount.bankName} (Ngân Hàng Tiên Phong)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankAccount.bankName, 'bank')}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-[#C76A82] hover:bg-white dark:hover:bg-[#2A232A] transition-colors cursor-pointer"
                  title="Sao chép tên ngân hàng"
                >
                  {copiedKey === 'bank' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Account Number */}
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1F1A1F] border border-neutral-200 dark:border-[#3D333D] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#827580] dark:text-[#B9A9B4] block">
                    Số tài khoản nhận
                  </span>
                  <span className="font-mono text-sm font-bold text-[#C76A82] dark:text-[#E8B7C8] tracking-wider">
                    {bankAccount.accountNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankAccount.accountNumber, 'acc')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#2A232A] border border-[#E8B7C8]/40 dark:border-[#3D333D] text-[11px] font-semibold text-[#453C45] dark:text-[#F5EDE8] hover:text-[#C76A82] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'acc' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>

              {/* Account Holder */}
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1F1A1F] border border-neutral-200 dark:border-[#3D333D] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#827580] dark:text-[#B9A9B4] block">
                    Chủ tài khoản
                  </span>
                  <span className="text-xs font-bold text-[#453C45] dark:text-[#F5EDE8] uppercase">
                    {bankAccount.accountHolder}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankAccount.accountHolder, 'holder')}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-[#C76A82] hover:bg-white dark:hover:bg-[#2A232A] transition-colors cursor-pointer"
                >
                  {copiedKey === 'holder' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Amount */}
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1F1A1F] border border-neutral-200 dark:border-[#3D333D] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[#827580] dark:text-[#B9A9B4] block">
                    Số tiền thanh toán chính xác
                  </span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                    {formatVND(bankAccount.amount)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(String(bankAccount.amount), 'amount')}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#2A232A] border border-[#E8B7C8]/40 dark:border-[#3D333D] text-[11px] font-semibold text-[#453C45] dark:text-[#F5EDE8] hover:text-[#C76A82] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedKey === 'amount' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>

              {/* Reference Code (CRITICAL) */}
              <div className="p-3 rounded-xl bg-[#FFF4F7] dark:bg-[#33232A] border-2 border-[#C76A82] dark:border-[#E8B7C8] flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#C76A82] dark:text-[#E8B7C8] block">
                    Nội dung chuyển khoản (BẮT BUỘC)
                  </span>
                  <span className="font-mono text-base font-extrabold text-[#C76A82] dark:text-[#E8B7C8] tracking-widest">
                    {bankAccount.referenceCode}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(bankAccount.referenceCode, 'ref')}
                  className="px-3 py-1.5 rounded-lg bg-[#C76A82] text-white text-xs font-bold hover:bg-[#B0596E] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {copiedKey === 'ref' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3-Step Guide */}
        <div className="mt-6 pt-4 border-t border-[#E8B7C8]/20 dark:border-[#3D333D] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#827580] dark:text-[#B9A9B4]">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#F6DCE5] dark:bg-[#3D2C35] text-[#C76A82] font-bold text-[11px] flex items-center justify-center shrink-0">
              1
            </span>
            <span>Mở app ngân hàng bất kỳ (Vietcombank, MB, Techcombank, TPBank…)</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#F6DCE5] dark:bg-[#3D2C35] text-[#C76A82] font-bold text-[11px] flex items-center justify-center shrink-0">
              2
            </span>
            <span>Quét mã QR hoặc chuyển đúng số tiền và nội dung <strong>{bankAccount.referenceCode}</strong></span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-[#F6DCE5] dark:bg-[#3D2C35] text-[#C76A82] font-bold text-[11px] flex items-center justify-center shrink-0">
              3
            </span>
            <span>Hệ thống tự động kích hoạt & chuyển sang trang sẵn sàng trong 5 - 30 giây</span>
          </div>
        </div>

        {/* Support & Dev Simulator Toolbar */}
        <div className="mt-6 pt-4 border-t border-[#E8B7C8]/20 dark:border-[#3D333D] flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={() => setSupportModalOpen(true)}
            className="text-[#827580] dark:text-[#B9A9B4] hover:text-[#C76A82] inline-flex items-center gap-1.5 underline cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Cần hỗ trợ? (Lỡ chuyển sai nội dung / số tiền)</span>
          </button>

          {/* Chỉ Admin thấy nút kiểm thử — khách hàng không thể tự kích hoạt gói */}
          {isAdmin && <button
            type="button"
            disabled={isSimulating}
            onClick={handleSimulateWebhook}
            className="px-3 py-1.5 rounded-xl border border-dashed border-[#B6925B] text-[#B6925B] hover:bg-[#B6925B]/10 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Dành cho kiểm thử luồng tự động không cần nạp tiền thực tế"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>
              {isSimulating ? 'Đang kích hoạt…' : '🧪 Giả lập Webhook SePay Thành Công'}
            </span>
          </button>}
        </div>

        {/* Support Modal Popup */}
        {supportModalOpen && (
          <div className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#2A232A] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#E8B7C8]/40 dark:border-[#3D333D]">
              <div className="flex items-center justify-between">
                <h4 className="font-heading font-bold text-base text-[#453C45] dark:text-[#F5EDE8]">
                  Hỗ Trợ Thanh Toán & Duyệt Đơn
                </h4>
                <button
                  onClick={() => setSupportModalOpen(false)}
                  className="text-neutral-400 hover:text-neutral-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#827580] dark:text-[#B9A9B4] leading-relaxed">
                Nếu bạn lỡ ghi sai nội dung chuyển khoản hoặc thiếu số tiền, đừng lo lắng! Đội ngũ Admin THIEPONL sẽ tra soát và duyệt tay kích hoạt cho bạn trong 15 phút.
              </p>

              <div className="space-y-2 text-xs text-[#453C45] dark:text-[#F5EDE8]">
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1F1A1F]">
                  <MessageCircle className="w-4 h-4 text-[#C76A82]" />
                  <span>Zalo / Hotline: <strong>0875 838 688</strong></span>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1F1A1F]">
                  <Mail className="w-4 h-4 text-[#C76A82]" />
                  <span>Email: <strong>hotro@thieponl.vn</strong></span>
                </div>
              </div>

              <p className="text-[11px] text-[#827580] italic">
                Khi liên hệ, vui lòng cung cấp mã đơn hàng: <strong>{order.id}</strong> và ảnh chụp màn hình giao dịch chuyển khoản.
              </p>

              <button
                type="button"
                onClick={() => setSupportModalOpen(false)}
                className="w-full py-2 bg-[#C76A82] text-white text-xs font-bold rounded-xl"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
