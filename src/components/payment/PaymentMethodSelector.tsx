'use client';

import { cn } from '@/lib/cn';
import type { PaymentMethod } from '@/types/consultation';

interface PaymentMethodSelectorProps {
  value: PaymentMethod | undefined;
  onChange: (method: PaymentMethod) => void;
  membershipRemaining?: number;
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
}: PaymentMethodSelectorProps): React.ReactElement {
  const membershipDisabled = membershipRemaining === 0;

  return (
    <div className="flex gap-2">
      {METHODS.map(({ key, label, icon }) => {
        const isMembership = key === 'membership';
        const isSelected = value === key;
        const isDisabled = isMembership && membershipDisabled;

        return (
          <button
            key={key}
            type="button"
            disabled={isDisabled}
            onClick={() => onChange(key)}
            className={cn(
              'relative flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-sm font-semibold transition-all duration-200',
              isSelected
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-surface text-text-secondary hover:border-gray-300',
              isDisabled && 'opacity-50 pointer-events-none',
            )}
          >
            <span className="text-xl leading-none">{icon}</span>
            <span className="text-xs font-bold">{label}</span>

            {isMembership && membershipRemaining !== undefined && membershipRemaining > 0 && (
              <span
                className={cn(
                  'absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-black flex items-center justify-center',
                  isSelected ? 'bg-primary text-white' : 'bg-text-muted text-white',
                )}
              >
                {membershipRemaining}
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
