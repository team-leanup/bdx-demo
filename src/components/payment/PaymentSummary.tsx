'use client';

import { Badge } from '@/components/ui';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { PriceBreakdown } from '@/types/price';

interface PaymentSummaryProps {
  breakdown: PriceBreakdown;
  extraItems?: { label: string; amount: number }[];
  className?: string;
}

export function PaymentSummary({ breakdown, extraItems = [], className }: PaymentSummaryProps): React.ReactElement {
  const extrasTotal = extraItems.reduce((sum, item) => sum + item.amount, 0);
  const grandTotal = Math.max(0, breakdown.finalPrice + extrasTotal);

  return (
    <div className={cn('flex flex-col gap-0', className)}>
      {/* 항목별 내역 */}
      <div className="flex flex-col gap-2">
        {breakdown.items.filter((item) => !item.isDiscount).map((item, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">{item.label}</span>
            <span className="font-medium text-text">{formatPrice(item.amount)}</span>
          </div>
        ))}

        {extraItems.map((item, idx) => (
          <div key={`extra-${idx}`} className="flex items-center justify-between text-sm">
            <span className="text-text-secondary flex items-center gap-1">
              <Badge variant="warning" size="sm">추가</Badge>
              {item.label}
            </span>
            <span className="font-medium text-text">+{formatPrice(item.amount)}</span>
          </div>
        ))}

        {/* 소계 */}
        <div className="flex items-center justify-between text-sm border-t border-border pt-2 mt-1">
          <span className="font-semibold text-text">소계</span>
          <span className="font-semibold text-text">{formatPrice(breakdown.subtotal + extrasTotal)}</span>
        </div>

        {/* 할인 */}
        {breakdown.discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-error flex items-center gap-1">
              <Badge variant="error" size="sm">할인</Badge>
              {breakdown.items.find((i) => i.isDiscount && i.label !== '예약금')?.label ?? '할인'}
            </span>
            <span className="font-medium text-error">-{formatPrice(breakdown.discountAmount)}</span>
          </div>
        )}

        {/* 예약금 */}
        {breakdown.depositAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary flex items-center gap-1">
              <Badge variant="neutral" size="sm">예약금</Badge>
              선결제 차감
            </span>
            <span className="font-medium text-warning">-{formatPrice(breakdown.depositAmount)}</span>
          </div>
        )}
      </div>

      {/* 최종 결제금액 */}
      <div
        className="mt-4 flex items-center justify-between rounded-2xl px-5 py-4"
        style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
      >
        <div>
          <p className="text-xs text-white/70">결제할 금액</p>
          {breakdown.depositAmount > 0 && (
            <p className="text-[10px] text-white/50 mt-0.5">
              시술총액 {formatPrice(breakdown.subtotal + extrasTotal)} - 예약금 {formatPrice(breakdown.depositAmount)}
            </p>
          )}
        </div>
        <p className="text-2xl font-extrabold text-white">{formatPrice(grandTotal)}</p>
      </div>

      {breakdown.estimatedMinutes > 0 && (
        <p className="mt-2 text-center text-xs text-text-muted">
          예상 시술 시간: 약 {breakdown.estimatedMinutes}분
        </p>
      )}
    </div>
  );
}

export default PaymentSummary;
