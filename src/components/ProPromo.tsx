import React from 'react';
import { Crown, Users, Sparkles } from 'lucide-react';
import { effectivePlan, PLAN_LABEL, daysLeft } from '../data/planRules';

/** Sự kiện toàn cục: mở bảng nâng cấp / chuyển tab trong bảng điều khiển từ bất kỳ đâu. */
export const OPEN_UPGRADE = 'thieponl:open-upgrade';
export const OPEN_GUESTS = 'thieponl:open-guests';

export function requestUpgrade(onNavigate?: (v: string, p?: any) => void) {
  if (onNavigate) onNavigate('dashboard', { upgrade: true });
  setTimeout(() => window.dispatchEvent(new Event(OPEN_UPGRADE)), 50);
}
export function requestGuests(onNavigate?: (v: string, p?: any) => void) {
  if (onNavigate) onNavigate('dashboard', { tab: 'guests' });
  setTimeout(() => window.dispatchEvent(new Event(OPEN_GUESTS)), 50);
}

const GRAD = 'linear-gradient(135deg,#E8546F 0%,#C76A82 45%,#D4A73C 100%)';

/** Nút "Nâng cấp PRO" nổi bật (có ánh sáng chạy). Ẩn khi tài khoản đã có gói. */
export const UpgradeProButton: React.FC<{
  user?: any;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}> = ({ user, onClick, size = 'md', className = '', label }) => {
  const plan = effectivePlan(user);
  const pad = size === 'sm' ? 'px-3 py-1.5 text-[11px]' : size === 'lg' ? 'px-6 py-3.5 text-sm' : 'px-4 py-2 text-xs';
  if (plan !== 'free' && user?.role !== 'admin') {
    const d = daysLeft(user?.planExpiresAt);
    return (
      <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-xl font-bold text-white shadow ${pad} ${className}`} style={{ background: GRAD }} title="Gia hạn gói">
        <Crown className="w-4 h-4" /> {PLAN_LABEL[plan]} · {d} ngày
      </button>
    );
  }
  if (user?.role === 'admin') return null;
  return (
    <button
      onClick={onClick}
      className={`pro-shine relative overflow-hidden inline-flex items-center gap-1.5 rounded-xl font-extrabold text-white shadow-lg shadow-[#E8546F]/30 hover:scale-[1.03] transition-transform cursor-pointer ${pad} ${className}`}
      style={{ background: GRAD }}
    >
      <Crown className="w-4 h-4" />
      {label || 'Nâng cấp PRO'}
      <style>{`.pro-shine::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);transform:translateX(-120%);animation:proShine 2.8s ease-in-out infinite}@keyframes proShine{60%,100%{transform:translateX(120%)}}`}</style>
    </button>
  );
};

/** Nút "Mời Khách" nổi bật. */
export const InviteGuestsButton: React.FC<{ onClick: () => void; size?: 'sm' | 'md' | 'lg'; className?: string; count?: number }> = ({
  onClick,
  size = 'md',
  className = '',
  count,
}) => {
  const pad = size === 'sm' ? 'px-3 py-1.5 text-[11px]' : size === 'lg' ? 'px-6 py-3.5 text-sm' : 'px-4 py-2 text-xs';
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl font-extrabold text-white bg-[#2F7D5B] hover:bg-[#256A4C] shadow-lg shadow-[#2F7D5B]/25 transition-colors cursor-pointer ${pad} ${className}`}
    >
      <Users className="w-4 h-4" />
      Mời Khách
      {typeof count === 'number' && <span className="ml-0.5 px-1.5 rounded-full bg-white/25 text-[10px]">{count}</span>}
    </button>
  );
};

/** Dải quảng bá PRO (cho tài khoản Free). */
export const ProBanner: React.FC<{ user?: any; onUpgrade: () => void; compact?: boolean }> = ({ user, onUpgrade, compact }) => {
  if (effectivePlan(user) !== 'free' || user?.role === 'admin') return null;
  return (
    <div className="rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between shadow-lg" style={{ background: GRAD }}>
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </span>
        <div>
          <p className="font-heading font-bold text-base sm:text-lg">Mở khóa gói PRO chỉ 299.000đ</p>
          {!compact && (
            <p className="text-xs sm:text-sm text-white/90">Dùng 8 mẫu HOT & toàn bộ mẫu thiệp · Mời không giới hạn khách (Free chỉ 20) · 15 ngày</p>
          )}
        </div>
      </div>
      <button onClick={onUpgrade} className="shrink-0 px-5 py-2.5 rounded-xl bg-white text-[#C0405C] text-xs sm:text-sm font-extrabold shadow hover:scale-[1.03] transition-transform cursor-pointer inline-flex items-center gap-1.5">
        <Crown className="w-4 h-4" /> Nâng cấp ngay
      </button>
    </div>
  );
};
