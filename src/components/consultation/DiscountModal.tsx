'use client';

import { useState } from 'react';
import { useConsultationStore } from '@/store/consultation-store';
import { calculatePrice } from '@/lib/price-calculator';
import { formatPrice } from '@/lib/format';
import { Modal, Button, Input } from '@/components/ui';
import { cn } from '@/lib/cn';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiscountModal({ isOpen, onClose }: DiscountModalProps) {
  const consultation = useConsultationStore((s) => s.consultation);
  const setDiscount = useConsultationStore((s) => s.setDiscount);
  const setDeposit = useConsultationStore((s) => s.setDeposit);

  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>(
    consultation.discount?.type ?? 'fixed',
  );
  const [discountValue, setDiscountValue] = useState(
    String(consultation.discount?.value ?? ''),
  );
  const [depositValue, setDepositValue] = useState(
    String(consultation.deposit ?? ''),
  );

  const breakdown = calculatePrice(consultation);
  const subtotal = breakdown.subtotal;

  const previewDiscount = (() => {
    const val = Number(discountValue);
    if (!val || isNaN(val)) return 0;
    if (discountType === 'fixed') return val;
    return Math.round(subtotal * (val / 100));
  })();

  const previewDeposit = Number(depositValue) || 0;
  const previewFinal = Math.max(0, subtotal - previewDiscount - previewDeposit);

  const handleApply = () => {
    const val = Number(discountValue);
    if (val > 0 && !isNaN(val)) {
      setDiscount({ type: discountType, value: val });
    } else {
      setDiscount(undefined);
    }
    const dep = Number(depositValue);
    setDeposit(dep > 0 ? dep : 0);
    onClose();
  };

  const handleReset = () => {
    setDiscountValue('');
    setDepositValue('');
    setDiscount(undefined);
    setDeposit(0);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="할인 / 예약금">
      <div className="p-5 flex flex-col gap-5">
        {/* Discount type toggle */}
        <div>
          <p className="text-sm font-semibold text-text-secondary mb-3">할인 방식</p>
          <div className="flex bg-surface-alt rounded-xl p-1 gap-1">
            {(['fixed', 'percent'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setDiscountType(t)}
                className={cn(
                  'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                  discountType === t
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-text-muted hover:text-text',
                )}
              >
                {t === 'fixed' ? '정액 할인 (₩)' : '퍼센트 할인 (%)'}
              </button>
            ))}
          </div>
        </div>

        {/* Discount value */}
        <Input
          label={discountType === 'fixed' ? '할인 금액 (원)' : '할인 비율 (%)'}
          type="number"
          placeholder={discountType === 'fixed' ? '예) 5000' : '예) 10'}
          value={discountValue}
          onChange={(e) => setDiscountValue(e.target.value)}
          min={0}
          max={discountType === 'percent' ? 100 : undefined}
        />

        {/* Deposit */}
        <Input
          label="예약금 (원)"
          type="number"
          placeholder="예) 20000"
          value={depositValue}
          onChange={(e) => setDepositValue(e.target.value)}
          min={0}
        />

        {/* Preview */}
        <div className="rounded-2xl border border-border bg-surface-alt p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-text-secondary mb-1">계산 미리보기</p>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">소계</span>
            <span className="text-text">{formatPrice(subtotal)}</span>
          </div>
          {previewDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">
                할인{discountType === 'percent' ? ` (${discountValue}%)` : ''}
              </span>
              <span className="text-error">-{formatPrice(previewDiscount)}</span>
            </div>
          )}
          {previewDeposit > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">예약금</span>
              <span className="text-warning">-{formatPrice(previewDeposit)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-bold text-text">최종 결제</span>
            <span className="font-bold text-primary">{formatPrice(previewFinal)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={handleReset}
            className="flex-1"
          >
            초기화
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleApply}
            className="flex-1"
          >
            적용
          </Button>
        </div>
      </div>
    </Modal>
  );
}
