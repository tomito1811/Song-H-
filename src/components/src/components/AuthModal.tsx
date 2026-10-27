import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';
import { auth, googleProvider, signInWithPopup, isInAppBrowser } from '../firebase';
import { getCurrentUser, acceptTerms } from '../utils/api';
import { User } from '../types/wedding';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  onOpenLegal?: (page: 'terms' | 'privacy') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess, onOpenLegal }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isWebview, setIsWebview] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    setIsWebview(isInAppBrowser());
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleGoogleSignIn = async () => {
    if (!agreedTerms) {
      setError('Vui lòng đánh dấu đồng ý với Điều khoản dịch vụ và Chính sách bảo mật để tiếp tục.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Real Firebase Google Sign-In
      const result = await signInWithPopup(auth, googleProvider);
      if (!result.user) {
        throw new Error('Đăng nhập Google không thành công');
      }

      // Fetch user profile from server API (which reads/bootstraps Firestore users/{uid})
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('Không thể đồng bộ hồ sơ người dùng');
      }

      // Save terms acceptance timestamp if first time
      if (!user.acceptedTermsAt) {
        await acceptTerms();
        user.acceptedTermsAt = new Date().toISOString();
      }

      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Yêu cầu đăng nhập bị hủy do có cửa sổ mới.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Trình duyệt đã chặn cửa sổ đăng nhập Google. Vui lòng cho phép popup.');
      } else {
        setError(err.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#2A232A] rounded-3xl max-w-sm sm:max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-[#E8B7C8]/40 dark:border-[#3D333D] space-y-6 transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-400 hover:text-neutral-600 dark:hover:text-[#F5EDE8] p-1 rounded-lg cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="text-center">
          <img
            src="/assets/aistudio/thiep-online_1c938423.png"
            alt="Thiệp Online"
            className="h-12 w-auto mx-auto object-contain mb-3"
          />
          <span className="font-heading text-xl font-bold text-[#453C45] dark:text-[#F5EDE8] block">
            Chào Mừng Đến Với THIEPONL
          </span>
          <p className="text-xs text-[#827580] dark:text-[#B9A9B4] mt-1">
            Nền tảng thiệp cưới điện tử thông minh số 1 Việt Nam
          </p>
        </div>

        {/* Warning if opened inside Zalo / Facebook / TikTok webview */}
        {isWebview && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs space-y-2">
            <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Phát hiện trình duyệt Zalo / Facebook</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
              Google bảo mật không cho phép đăng nhập trong trình duyệt này. Hãy bấm vào dấu ba chấm <strong>(⋮ hoặc •••)</strong> ở góc trên bên phải màn hình và chọn <strong>"Mở bằng trình duyệt"</strong> (Chrome hoặc Safari).
            </p>
            <button
              type="button"
              onClick={handleCopyLink}
              className="w-full py-1.5 px-2 bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 dark:hover:bg-amber-800/80 text-amber-900 dark:text-amber-100 font-medium rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'Đã sao chép link website!' : 'Sao chép đường dẫn để mở Chrome / Safari'}
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-300 rounded-xl text-xs leading-relaxed">
            {error}
          </div>
        )}

        {/* Primary Google Login Button */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl border border-neutral-300 dark:border-[#3D333D] bg-white dark:bg-[#1F1A1F] hover:bg-neutral-50 dark:hover:bg-[#332A33] text-[#453C45] dark:text-[#F5EDE8] text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin mr-2">⏳</span>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{loading ? 'Đang xác thực Google...' : 'Tiếp tục với Google'}</span>
          </button>

          {/* Terms Agreement Checkbox */}
          <div className="flex items-start gap-2.5 pt-2">
            <input
              type="checkbox"
              id="terms-agree"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="mt-0.5 rounded border-neutral-300 text-[#C76A82] focus:ring-[#C76A82] cursor-pointer"
            />
            <label htmlFor="terms-agree" className="text-[11px] text-[#827580] leading-normal select-none">
              Tôi đồng ý với{' '}
              <button
                type="button"
                onClick={() => onOpenLegal && onOpenLegal('terms')}
                className="text-[#C76A82] hover:underline font-medium inline"
              >
                Điều khoản dịch vụ
              </button>{' '}
              và{' '}
              <button
                type="button"
                onClick={() => onOpenLegal && onOpenLegal('privacy')}
                className="text-[#C76A82] hover:underline font-medium inline"
              >
                Chính sách bảo mật
              </button>{' '}
              của THIEPONL.
            </label>
          </div>
        </div>

        {/* Security endorsement */}
        <div className="pt-3 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-[11px] text-[#827580]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Bảo mật an toàn bằng Firebase Authentication</span>
        </div>
      </div>
    </div>
  );
};
