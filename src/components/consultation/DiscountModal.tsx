'use client';

import { useState, useMemo } from 'react';
import { useConsultationStore } from '@/store/consultation-store';
import { useAppStore } from '@/store/app-store';
import { calculatePrice, buildServicePricingFromShopSettings } from '@/lib/price-calculator';
import { formatPrice, formatLocaleCurrency } from '@/lib/format';
import { Modal, Button, Input } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DiscountModal({ isOpen, onClose }: DiscountModalProps) {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
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

  const shopSettings = useAppStore((s) => s.shopSettings);
  const pricing = useMemo(() => buildServicePricingFromShopSettings(shopSettings), [shopSettings]);

  const breakdown = calculatePrice(consultation, pricing);
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
    let val = Number(discountValue);
    if (discountType === 'percent') val = Math.min(Math.max(val, 0), 100);
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
    <Modal isOpen={isOpen} onClose={onClose} title={t('discountModal.title')}>
      <div className="flex flex-col">
        <div className="p-5 flex flex-col gap-5 overflow-y-auto overscroll-contain">
          {/* Discount type toggle */}
          <div>
            <div className="mb-3">
              <p className="text-sm font-semibold text-text-secondary">{t('discountModal.discountMethod')}</p>
              {locale !== 'ko' && <span className="text-xs text-text-muted opacity-60">{tKo('discountModal.discountMethod')}</span>}
            </div>
            <div className="flex bg-surface-alt rounded-xl p-1 gap-1">
              {(['fixed', 'percent'] as const).map((discType) => (
                <button
                  key={discType}
                  type="button"
                  onClick={() => setDiscountType(discType)}
                  className={cn(
                    'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                    discountType === discType
                      ? 'bg-surface text-primary shadow-sm'
                      : 'text-text-muted hover:text-text',
                  )}
                >
                  {discType === 'fixed' ? t('discountModal.fixedDiscount') : t('discountModal.percentDiscount')}
                  {locale !== 'ko' && (
                    <span className="ml-1 text-[10px] opacity-60">
                      {discType === 'fixed' ? tKo('discountModal.fixedDiscount') : tKo('discountModal.percentDiscount')}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Discount preset chips */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {([5, 10, 15, 20] as const).map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => { setDiscountType('percent'); setDiscountValue(String(pct)); }}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    discountType === 'percent' && discountValue === String(pct)
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-text-secondary hover:border-primary/40',
                  )}
                >
                  {pct}%
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setDiscountValue(''); }}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  discountType === 'fixed' || !([5, 10, 15, 20].map(String).includes(discountValue))
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-text-secondary hover:border-primary/40',
                )}
              >
                직접 입력
              </button>
            </div>

            {/* Discount value */}
            <Input
              label={<>
                {discountType === 'fixed' ? t('discountModal.discountAmount') : t('discountModal.discountPercent')}
                {locale !== 'ko' && <span className="ml-1 text-[10px] text-text-muted opacity-60">{discountType === 'fixed' ? tKo('discountModal.discountAmount') : tKo('discountModal.discountPercent')}</span>}
              </>}
              type="number"
              placeholder={discountType === 'fixed' ? t('discountModal.placeholderAmount') : t('discountModal.placeholderPercent')}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              min={0}
              max={discountType === 'percent' ? 100 : undefined}
            />
          </div>

          {/* Deposit preset chips */}
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {([10000, 20000, 30000] as const).map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setDepositValue(String(amt))}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-sm transition-colors',
                    depositValue === String(amt)
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-text-secondary hover:border-primary/40',
                  )}
                >
                  ₩{(amt / 1000).toFixed(0)},000
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDepositValue('')}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm transition-colors',
                  !([10000, 20000, 30000].map(String).includes(depositValue))
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-text-secondary hover:border-primary/40',
                )}
              >
                직접 입력
              </button>
            </div>

            {/* Deposit */}
            <Input
              label={<>
                {t('discountModal.depositAmount')}
                {locale !== 'ko' && <span className="ml-1 text-[10px] text-text-muted opacity-60">{tKo('discountModal.depositAmount')}</span>}
              </>}
              type="number"
              placeholder={t('discountModal.depositPlaceholder')}
              value={depositValue}
              onChange={(e) => setDepositValue(e.target.value)}
              min={0}
            />
          </div>

          {/* Preview */}
          <div className="rounded-2xl border border-border bg-surface-alt p-4 flex flex-col gap-2">
            <div className="mb-1">
              <p className="text-xs font-semibold text-text-secondary">{t('discountModal.preview')}</p>
              {locale !== 'ko' && <span className="text-xs text-text-muted opacity-60">{tKo('discountModal.preview')}</span>}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">
                {t('discountModal.subtotal')}
                {locale !== 'ko' && <span className="ml-1 text-[10px] opacity-60">{tKo('discountModal.subtotal')}</span>}
              </span>
              <span className="text-text">
                {locale !== 'ko' ? formatLocaleCurrency(subtotal, locale) : formatPrice(subtotal)}
                {locale !== 'ko' && <span className="text-xs opacity-60 ml-1">{formatPrice(subtotal)}</span>}
              </span>
            </div>
            {previewDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">
                  {t('discountModal.discount')}{discountType === 'percent' ? ` (${discountValue}%)` : ''}
                  {locale !== 'ko' && <span className="ml-1 text-[10px] opacity-60">{tKo('discountModal.discount')}</span>}
                </span>
                <span className="text-error">
                  -{locale !== 'ko' ? formatLocaleCurrency(previewDiscount, locale) : formatPrice(previewDiscount)}
                  {locale !== 'ko' && <span className="text-xs opacity-60 ml-1">-{formatPrice(previewDiscount)}</span>}
                </span>
              </div>
            )}
            {previewDeposit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">
                  {t('discountModal.deposit')}
                  {locale !== 'ko' && <span className="ml-1 text-[10px] opacity-60">{tKo('discountModal.deposit')}</span>}
                </span>
                <span className="text-warning">
                  -{locale !== 'ko' ? formatLocaleCurrency(previewDeposit, locale) : formatPrice(previewDeposit)}
                  {locale !== 'ko' && <span className="text-xs opacity-60 ml-1">-{formatPrice(previewDeposit)}</span>}
                </span>
              </div>
            )}
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-bold text-text">
                {t('discountModal.finalPayment')}
                {locale !== 'ko' && <span className="ml-1 text-xs font-medium text-text-muted opacity-60">{tKo('discountModal.finalPayment')}</span>}
              </span>
              <span className="font-bold text-primary">
                {locale !== 'ko' ? formatLocaleCurrency(previewFinal, locale) : formatPrice(previewFinal)}
                {locale !== 'ko' && <span className="text-xs opacity-60 ml-1">{formatPrice(previewFinal)}</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Actions - sticky so always visible above keyboard */}
        <div className="sticky bottom-0 bg-surface flex gap-2 px-5 py-4 border-t border-border">
          <Button
            variant="ghost"
            size="md"
            onClick={handleReset}
            className="flex-1"
          >
            {t('discountModal.reset')}
            {locale !== 'ko' && <span className="ml-1 text-[10px] opacity-60">{tKo('discountModal.reset')}</span>}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleApply}
            className="flex-1"
          >
            {t('discountModal.apply')}
            {locale !== 'ko' && <span className="ml-1 text-[10px] opacity-70">{tKo('discountModal.apply')}</span>}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
