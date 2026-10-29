/**
 * Quy tắc gói dịch vụ (dùng chung cho web, Admin & webhook SePay).
 *  - Free: mỗi tài khoản Gmail & mỗi thiết bị / IP chỉ 1 thiệp, tối đa 20 khách mời, không dùng mẫu HOT / Premium.
 *  - Pro (299k): mở mẫu HOT & toàn bộ mẫu, không giới hạn khách mời, thời hạn 15 ngày.
 *  - Luxury (599k): như Pro, thời hạn 3 tháng (90 ngày).
 */
import { User } from '../types/wedding';

export type PlanId = 'free' | 'premium' | 'luxury';

export const PLAN_DAYS: Record<PlanId, number> = { free: 0, premium: 15, luxury: 90 };
export const FREE_GUEST_LIMIT = 20;

export const PLAN_LABEL: Record<PlanId, string> = { free: 'Free', premium: 'PRO', luxury: 'LUXURY' };

/** Hạn mới: cộng thêm vào hạn còn lại nếu đang dùng gói (gia hạn không mất ngày). */
export function nextExpiry(planId: PlanId, currentExpiry?: string | null, from = new Date()): string {
  const base = currentExpiry && new Date(currentExpiry).getTime() > from.getTime() ? new Date(currentExpiry) : from;
  return new Date(base.getTime() + PLAN_DAYS[planId] * 86400000).toISOString();
}

export function isPlanActive(u?: Pick<User, 'plan' | 'planExpiresAt' | 'role'> | null): boolean {
  if (!u) return false;
  if (u.role === 'admin') return true;
  if (u.plan !== 'premium' && u.plan !== 'luxury') return false;
  return !u.planExpiresAt || new Date(u.planExpiresAt).getTime() > Date.now();
}

/** Gói hiệu lực (gói đã hết hạn được coi là free). */
export function effectivePlan(u?: Pick<User, 'plan' | 'planExpiresAt' | 'role'> | null): PlanId {
  return u && isPlanActive(u) && u.plan !== 'free' ? (u.plan as PlanId) : 'free';
}

export function daysLeft(expiry?: string | null): number {
  if (!expiry) return 0;
  return Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000));
}
