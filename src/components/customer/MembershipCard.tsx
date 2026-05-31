'use client';

import { cn } from '@/lib/cn';
import {
  getRemainingAmount,
  getUsedAmount,
  getEffectiveStatus,
  formatWon,
} from '@/lib/membership';
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

export function MembershipCard({
  membership,
  onAddSession,
  onExpire,
}: MembershipCardProps): React.ReactElement {
  // 0531 회의: 회원권은 '금액 차감' 방식 — 회차 표기 없이 남은 금액만 표시
  const effectiveStatus = getEffectiveStatus(membership);
  const style = STATUS_STYLES[effectiveStatus];

  const remainingAmount = getRemainingAmount(membership);
  const usedAmount = getUsedAmount(membership);
  const purchaseAmount = membership.purchaseAmount;
  // 잔액 비율 (충전 금액 대비)
  const remainingPct = purchaseAmount > 0
    ? Math.max(0, Math.min(100, (remainingAmount / purchaseAmount) * 100))
    : 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-bold text-text">회원권</span>
          {membership.planName && (
            <span className="text-xs text-text-muted truncate">· {membership.planName}</span>
          )}
        </div>
        <span
          className={cn(
            'px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0',
            style.badge,
          )}
        >
          {style.label}
        </span>
      </div>

      {/* 남은 금액 (메인) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] font-semibold text-text-muted">남은 금액</span>
          <span className="text-2xl font-black text-text tabular-nums leading-none">
            {formatWon(remainingAmount)}
          </span>
        </div>
        <div
          className="h-2 rounded-full bg-surface-alt overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(remainingPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`남은 금액 ${formatWon(remainingAmount)}`}
        >
          <div
            className={cn('h-full rounded-full transition-[width] duration-300', style.bar)}
            style={{ width: `${remainingPct}%` }}
          />
        </div>
      </div>

      {/* 충전/사용 요약 */}
      <div className="flex items-center justify-between rounded-xl bg-surface-alt border border-border px-3 py-2.5 text-[11px]">
        <div className="flex flex-col gap-0.5">
          <span className="text-text-muted">충전 금액</span>
          <span className="text-sm font-bold text-text tabular-nums">
            {formatWon(purchaseAmount)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-text-muted">사용 금액</span>
          <span className="text-sm font-bold text-text tabular-nums">
            {formatWon(usedAmount)}
          </span>
        </div>
      </div>

      {/* 만료일 */}
      <div className="flex items-center justify-end text-xs text-text-muted">
        <span>만료일 {formatDate(membership.expiryDate)}</span>
      </div>

      {/* Actions */}
      {(onAddSession || onExpire) && (
        <div className="flex gap-2 pt-1">
          {onAddSession && (
            <button
              type="button"
              onClick={onAddSession}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              + 잔액 추가
            </button>
          )}
          {onExpire && effectiveStatus === 'active' && (
            <button
              type="button"
              onClick={onExpire}
              className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-surface-alt text-text-muted text-xs font-semibold border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
