'use client';

import { cn } from '@/lib/cn';
import type { Membership } from '@/types/customer';

interface MembershipCardProps {
  membership: Membership;
  onAddSession?: () => void;
  onExpire?: () => void;
}

const STATUS_STYLES: Record<Membership['status'], { bar: string; badge: string; label: string }> = {
  active: {
    bar: 'bg-success',
    badge: 'bg-success/10 text-success border-success/20',
    label: '활성',
  },
  expired: {
    bar: 'bg-text-muted',
    badge: 'bg-surface-alt text-text-muted border-border',
    label: '만료',
  },
  used_up: {
    bar: 'bg-warning',
    badge: 'bg-warning/10 text-warning border-warning/20',
    label: '소진',
  },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function formatPrice(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원';
}

export function MembershipCard({
  membership,
  onAddSession,
  onExpire,
}: MembershipCardProps): React.ReactElement {
  const style = STATUS_STYLES[membership.status];
  const progressPct =
    membership.totalSessions > 0
      ? Math.min(100, (membership.remainingSessions / membership.totalSessions) * 100)
      : 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-text">회원권</span>
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
            style.badge,
          )}
        >
          {style.label}
        </span>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-end justify-between">
          <span className="text-2xl font-black text-text tabular-nums">
            {membership.remainingSessions}
            <span className="text-sm font-semibold text-text-muted ml-1">/ {membership.totalSessions}회</span>
          </span>
          <span className="text-xs text-text-muted font-medium">
            사용 {membership.usedSessions}회
          </span>
        </div>
        <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', style.bar)}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>구매금액 {formatPrice(membership.purchaseAmount)}</span>
        <span>만료일 {formatDate(membership.expiryDate)}</span>
      </div>

      {/* Actions */}
      {(onAddSession || onExpire) && (
        <div className="flex gap-2 pt-1">
          {onAddSession && (
            <button
              type="button"
              onClick={onAddSession}
              className="flex-1 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20"
            >
              + 회차 추가
            </button>
          )}
          {onExpire && membership.status === 'active' && (
            <button
              type="button"
              onClick={onExpire}
              className="flex-1 py-2 rounded-xl bg-surface-alt text-text-muted text-xs font-semibold border border-border"
            >
              만료 처리
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default MembershipCard;
