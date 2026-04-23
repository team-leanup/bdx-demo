'use client';

import { cn } from '@/lib/cn';
import type { PaymentMethod } from '@/types/consultation';

interface PaymentMethodSelectorProps {
  value: PaymentMethod | undefined;
  onChange: (method: PaymentMethod) => void;
  /** 잔여 횟수 (legacy — 0일 때 비활성 판단에 계속 사용) */
  membershipRemaining?: number;
  /** 0423 반영: 잔액(원) — 뱃지/안내 표시용 */
  membershipRemainingAmount?: number;
}

const METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'cash', label: '현금', icon: '💵' },
  { key: 'card', label: '카드', icon: '💳' },
  { key: 'membership', label: '회원권', icon: '🎫' },
];

export function PaymentMethodSelector({
  value,
  onChange,
  membershipRemaining,
  membershipRemainingAmount,
}: PaymentMethodSelectorProps): React.ReactElement {
  // 0423: 잔액 또는 횟수 정보가 없으면 안전하게 비활성 (undefined는 "회원권 없음"을 의미)
  const hasMembership = membershipRemaining !== undefined || membershipRemainingAmount !== undefined;
  const membershipDisabled =
    !hasMembership ||
    membershipRemaining === 0 ||
    (typeof membershipRemainingAmount === 'number' && membershipRemainingAmount <= 0);

  return (
    <div className="flex gap-2" role="radiogroup" aria-label="결제수단 선택">
      {METHODS.map(({ key, label, icon }) => {
        const isMembership = key === 'membership';
        const isSelected = value === key;
        const isDisabled = isMembership && membershipDisabled;

        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            onClick={() => onChange(key)}
            className={cn(
              'relative flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-sm font-semibold transition-all duration-200',
              isSelected
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-surface text-text-secondary hover:border-text-muted/40',
              isDisabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            <span className="text-xl leading-none" aria-hidden="true">{icon}</span>
            <span className="text-xs font-bold">{label}</span>

            {isMembership && membershipRemainingAmount !== undefined && membershipRemainingAmount > 0 && (
              <span
                className={cn(
                  'absolute -top-2 right-1 px-1.5 h-[18px] rounded-full text-[9px] font-black flex items-center justify-center tabular-nums',
                  isSelected ? 'bg-primary text-white' : 'bg-text-muted text-white',
                )}
                aria-label={`잔액 ${membershipRemainingAmount.toLocaleString()}원`}
              >
                {membershipRemainingAmount >= 10000
                  ? `${Math.floor(membershipRemainingAmount / 10000)}만`
                  : `${Math.floor(membershipRemainingAmount / 1000)}천`}
              </span>
            )}

            {isSelected && (
              <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default PaymentMethodSelector;
