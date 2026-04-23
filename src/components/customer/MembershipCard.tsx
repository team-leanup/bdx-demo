'use client';

import { cn } from '@/lib/cn';
import {
  getRemainingAmount,
  getMembershipSessionState,
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
  // 0423: 만료일·잔액을 결합한 실사용 상태로 뱃지 결정
  const effectiveStatus = getEffectiveStatus(membership);
  const style = STATUS_STYLES[effectiveStatus];

  // 0423 반영: 회차별 표시 ("1회권 중 5만원 사용, 남은 금액 5만원")
  const state = getMembershipSessionState(membership);
  const totalRemainingAmount = getRemainingAmount(membership);

  // 현재 회차 프로그레스 (회차 내 사용률)
  const currentSessionPct = state.sessionLimit > 0
    ? Math.min(100, (state.currentSessionUsed / state.sessionLimit) * 100)
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

      {/* 현재 회차 상태 — 지승호 대표 원문대로 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-bold text-primary">
              {state.currentSessionNumber}회차
            </span>
            <span className="text-xs text-text-muted">
              중 {formatWon(state.currentSessionUsed)} 사용
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[11px] font-semibold text-text-muted">남은 금액</span>
            <span className="text-lg font-black text-text tabular-nums leading-none">
              {formatWon(state.currentSessionRemaining)}
            </span>
          </div>
        </div>
        <div
          className="h-2 rounded-full bg-surface-alt overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(currentSessionPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${state.currentSessionNumber}회차에 ${formatWon(state.currentSessionRemaining)} 남음`}
        >
          <div
            className={cn('h-full rounded-full transition-[width] duration-300', style.bar)}
            style={{ width: `${currentSessionPct}%` }}
          />
        </div>
      </div>

      {/* 전체 회원권 요약 */}
      <div className="flex items-center justify-between rounded-xl bg-surface-alt border border-border px-3 py-2.5 text-[11px]">
        <div className="flex flex-col gap-0.5">
          <span className="text-text-muted">총 잔액</span>
          <span className="text-sm font-black text-text tabular-nums">
            {formatWon(totalRemainingAmount)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 items-center">
          <span className="text-text-muted">남은 회차</span>
          <span className="text-sm font-bold text-text tabular-nums">
            {state.remainingSessionsCount} / {membership.totalSessions}회
          </span>
        </div>
        <div className="flex flex-col gap-0.5 items-end">
          <span className="text-text-muted">1회 한도</span>
          <span className="text-sm font-bold text-text tabular-nums">
            {formatWon(state.sessionLimit)}
          </span>
        </div>
      </div>

      {/* 만료일 / 구매일 */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>구매금액 {formatWon(membership.purchaseAmount)}</span>
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
              + 회차 추가
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
