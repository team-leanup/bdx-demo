'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useFieldModeStore } from '@/store/field-mode-store';
import { useRecordsStore } from '@/store/records-store';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import { calculatePreConsultPrice, ADDON_FIXED_PRICES } from '@/lib/pre-consult-price';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { SettlementCard } from '@/components/field-mode/SettlementCard';
import { CATEGORY_LABELS } from '@/lib/labels';
import { useReservationStore } from '@/store/reservation-store';
import type { PaymentMethod } from '@/types/consultation';
import type { AddOnOption } from '@/types/pre-consultation';

const ADD_ON_LABELS: Record<string, string> = {
  stone: '스톤',
  parts: '파츠',
  glitter: '글리터',
  point_art: '포인트아트',
};

// ─── Framer-motion variants ────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.07,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

// ─── Row helper ───────────────────────────────────────────────────────────────

function LineRow({ label, amount }: { label: string; amount: number }): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-semibold text-text">
        +{amount.toLocaleString()}원
      </span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SettlementPage(): React.ReactElement | null {
  const t = useT();
  const router = useRouter();

  const {
    selectedCategory,
    selectedPhotoUrl,
    removalType,
    lengthType,
    addOns,
    inTreatmentAddons,
    treatmentStartedAt,
    paymentMethod,
    designerId,
    customerName,
    customerPhone,
    customerId,
    bookingId,
    setPaymentMethod,
    setRecordId,
    setPhase,
  } = useFieldModeStore();

  const addQuickSaleRecord = useRecordsStore((s) => s.addQuickSaleRecord);
  const { activeDesignerId, currentShopId } = useAuthStore();
  const shopSettings = useAppStore((s) => s.shopSettings);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // ── Discount ───────────────────────────────────────────────────────────────
  const [discountPercent, setDiscountPercent] = useState(0);

  // ── Deposit ────────────────────────────────────────────────────────────────
  const presetDeposit = shopSettings.depositAmount ?? 0;
  const [depositApplied, setDepositApplied] = useState(0);
  const [customDepositInput, setCustomDepositInput] = useState('');
  const [showCustomDeposit, setShowCustomDeposit] = useState(false);

  // Guard: redirect if no design selected
  useEffect(() => {
    if (!selectedCategory) {
      router.replace('/field-mode');
    }
  }, [selectedCategory, router]);

  // ── Price calculation ────────────────────────────────────────────────────────

  const baseEstimate = useMemo(() => {
    if (!selectedCategory) return null;
    return calculatePreConsultPrice({
      designCategory: selectedCategory,
      removalPreference: removalType,
      lengthPreference: lengthType,
      addOns,
      categoryPricing: shopSettings.categoryPricing,
      surcharges: shopSettings.surcharges,
    });
  }, [selectedCategory, removalType, lengthType, addOns, shopSettings]);

  const inTreatmentTotal = inTreatmentAddons.reduce((s, a) => s + a.amount, 0);
  const subtotal = (baseEstimate?.minTotal ?? 0) + inTreatmentTotal;
  const discountAmount = discountPercent > 0 ? Math.round(subtotal * discountPercent / 100) : 0;
  const finalPrice = Math.max(0, subtotal - discountAmount - depositApplied);

  // ── Treatment duration ───────────────────────────────────────────────────────

  const treatmentDuration = useMemo(() => {
    if (!treatmentStartedAt) return '';
    const ms = Date.now() - new Date(treatmentStartedAt).getTime();
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}${t('fieldMode.hours')} ${minutes}${t('fieldMode.minutes')}`;
    }
    return `${minutes}${t('fieldMode.minutes')}`;
  }, [treatmentStartedAt, t]);

  // ── Add-on helpers ───────────────────────────────────────────────────────────

  function getAddOnAmount(addon: AddOnOption): number {
    switch (addon) {
      case 'stone': return ADDON_FIXED_PRICES.stone;
      case 'parts': return shopSettings.surcharges.largeParts;
      case 'glitter': return ADDON_FIXED_PRICES.glitter;
      case 'point_art': return shopSettings.surcharges.pointArt;
      default: return 0;
    }
  }

  const hasBaseOptions =
    removalType !== 'none' ||
    lengthType === 'extend' ||
    addOns.length > 0;

  // ── Remove label ─────────────────────────────────────────────────────────────

  const removalLabel =
    removalType === 'self_shop'
      ? t('fieldMode.optionRemovalSelf')
      : t('fieldMode.optionRemovalOther');

  // ── Payment complete handler ──────────────────────────────────────────────────

  const handlePaymentComplete = async (): Promise<void> => {
    if (!paymentMethod || !selectedCategory || isSaving) return;
    setIsSaving(true);

    const recordId = `fm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const effectiveDesignerId = designerId || activeDesignerId || '';
    const effectiveShopId = currentShopId ?? 'shop-demo';

    try {
      await addQuickSaleRecord({
        id: recordId,
        shopId: effectiveShopId,
        designerId: effectiveDesignerId,
        serviceType: CATEGORY_LABELS[selectedCategory],
        finalPrice,
        paymentMethod,
        notes: '현장모드 시술',
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerId: customerId || undefined,
        bookingId: bookingId || undefined,
      });
    } catch {
      // local optimistic update already applied by store; show warning but continue
      console.warn('[settlement] DB save failed — local data retained, continuing to wrap-up');
      setSaveError(true);
    }

    // 예약과 연결된 경우 예약 status를 completed로 변경
    if (bookingId) {
      useReservationStore.getState().updateReservation(bookingId, { status: 'completed' });
    }

    setRecordId(recordId);
    setPhase('wrap-up');
    router.push('/field-mode/wrap-up');
  };

  // ─────────────────────────────────────────────────────────────────────────────

  // Render null while redirect is in-flight
  if (!selectedCategory) return null;

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-text-secondary hover:bg-surface-alt active:scale-95 transition-all"
            aria-label={t('fieldMode.back')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-text tracking-tight">
            {t('fieldMode.settlementTitle')}
          </h1>
        </div>
      </header>

      {/* Content */}
      <motion.main
        className="flex-1 overflow-y-auto px-4 py-5 max-w-lg mx-auto w-full space-y-3"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Card 1: Design */}
        <motion.div variants={itemVariants}>
          <SettlementCard icon="🎨" title={t('fieldMode.designCard')}>
            <div className="flex items-center gap-3">
              {selectedPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedPhotoUrl}
                  alt={selectedCategory ? (CATEGORY_LABELS[selectedCategory] ?? selectedCategory) : ''}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-surface-alt"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-surface-alt flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💅</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text text-base">
                  {CATEGORY_LABELS[selectedCategory] ?? selectedCategory}
                </p>
                <p className="text-sm text-text-secondary mt-0.5">
                  {(baseEstimate?.categoryBase ?? 0).toLocaleString()}원
                </p>
              </div>
            </div>
          </SettlementCard>
        </motion.div>

        {/* Card 2: Base Options (only if there are selected options with cost) */}
        {hasBaseOptions && (
          <motion.div variants={itemVariants}>
            <SettlementCard icon="📌" title={t('fieldMode.baseOptionsCard')}>
              <div className="divide-y divide-border/50">
                {removalType !== 'none' && baseEstimate && baseEstimate.removalSurcharge > 0 && (
                  <LineRow
                    label={`제거 (${removalLabel})`}
                    amount={baseEstimate.removalSurcharge}
                  />
                )}
                {lengthType === 'extend' && baseEstimate && baseEstimate.extensionSurcharge > 0 && (
                  <LineRow
                    label={t('fieldMode.optionLengthExtend')}
                    amount={baseEstimate.extensionSurcharge}
                  />
                )}
                {addOns.map((addon) => {
                  const amount = getAddOnAmount(addon);
                  if (amount === 0) return null;
                  return (
                    <LineRow
                      key={addon}
                      label={ADD_ON_LABELS[addon] ?? addon}
                      amount={amount}
                    />
                  );
                })}
              </div>
            </SettlementCard>
          </motion.div>
        )}

        {/* Card 3: In-treatment addons */}
        {inTreatmentAddons.length > 0 && (
          <motion.div variants={itemVariants}>
            <SettlementCard icon="➕" title={t('fieldMode.treatmentAddonsCard')}>
              <div className="divide-y divide-border/50">
                {inTreatmentAddons.map((addon) => (
                  <LineRow key={addon.id} label={addon.label} amount={addon.amount} />
                ))}
              </div>
            </SettlementCard>
          </motion.div>
        )}

        {/* Divider */}
        <motion.div variants={itemVariants}>
          <div className="border-t border-border my-1" />
        </motion.div>

        {/* Discount */}
        <motion.div variants={itemVariants}>
          <div className="px-1">
            <p className="text-sm font-medium text-text-secondary mb-2">할인</p>
            <div className="flex gap-2">
              {[0, 5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setDiscountPercent(pct)}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95',
                    discountPercent === pct
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-alt text-text-secondary border-border hover:border-primary/40',
                  )}
                >
                  {pct === 0 ? '없음' : `${pct}%`}
                </button>
              ))}
            </div>
            {discountPercent > 0 && (
              <p className="text-xs text-error font-semibold mt-2 text-right">
                -{discountAmount.toLocaleString()}원 할인 적용
              </p>
            )}
          </div>
        </motion.div>

        {/* Deposit */}
        <motion.div variants={itemVariants}>
          <div className="px-1">
            <p className="text-sm font-medium text-text-secondary mb-2">예약금 차감</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setDepositApplied(0); setShowCustomDeposit(false); setCustomDepositInput(''); }}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95',
                  depositApplied === 0 && !showCustomDeposit
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-alt text-text-secondary border-border hover:border-primary/40',
                )}
              >
                없음
              </button>
              {presetDeposit > 0 && (
                <button
                  type="button"
                  onClick={() => { setDepositApplied(presetDeposit); setShowCustomDeposit(false); setCustomDepositInput(''); }}
                  className={cn(
                    'flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95',
                    depositApplied === presetDeposit && !showCustomDeposit
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-alt text-text-secondary border-border hover:border-primary/40',
                  )}
                >
                  {presetDeposit.toLocaleString()}원
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowCustomDeposit(true); setDepositApplied(0); }}
                className={cn(
                  'flex-1 py-2 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95',
                  showCustomDeposit
                    ? 'bg-primary text-white border-primary'
                    : 'bg-surface-alt text-text-secondary border-border hover:border-primary/40',
                )}
              >
                직접 입력
              </button>
            </div>
            {showCustomDeposit && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  value={customDepositInput}
                  onChange={(e) => {
                    setCustomDepositInput(e.target.value);
                    const v = parseInt(e.target.value, 10);
                    setDepositApplied(isNaN(v) || v < 0 ? 0 : v);
                  }}
                  placeholder="예약금 금액"
                  min={0}
                  step={1000}
                  className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-right text-text focus:outline-none focus:border-primary transition-colors"
                />
                <span className="text-xs text-text-muted">원</span>
              </div>
            )}
            {depositApplied > 0 && (
              <p className="text-xs text-blue-600 font-semibold mt-2 text-right">
                -{depositApplied.toLocaleString()}원 예약금 차감
              </p>
            )}
          </div>
        </motion.div>

        {/* Final amount */}
        <motion.div variants={itemVariants}>
          <div className="px-1">
            <p className="text-sm font-medium text-text-secondary mb-1">
              {t('fieldMode.finalTotal')}
            </p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-primary tracking-tight">
                ₩{finalPrice.toLocaleString()}
              </p>
              {(discountPercent > 0 || depositApplied > 0) && (
                <p className="text-sm text-text-muted line-through">
                  ₩{subtotal.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Treatment time */}
        {treatmentDuration && (
          <motion.div variants={itemVariants}>
            <div className="px-1 flex items-center justify-between">
              <p className="text-sm font-medium text-text-secondary">
                {t('fieldMode.treatmentTime')}
              </p>
              <p className="text-sm font-bold text-text">{treatmentDuration}</p>
            </div>
          </motion.div>
        )}

        {/* Payment method */}
        <motion.div variants={itemVariants}>
          <div className="pt-2">
            <p className="text-sm font-medium text-text-secondary mb-3 px-1">
              {t('fieldMode.paymentMethod')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { method: 'cash' as PaymentMethod, label: t('fieldMode.paymentCash') },
                  { method: 'card' as PaymentMethod, label: t('fieldMode.paymentCard') },
                  { method: 'membership' as PaymentMethod, label: t('fieldMode.paymentMembership') },
                ] as const
              ).map(({ method, label }) => (
                <button
                  key={method}
                  type="button"
                  role="radio"
                  aria-checked={paymentMethod === method}
                  onClick={() => setPaymentMethod(method)}
                  className={cn(
                    'min-h-[52px] rounded-xl text-sm font-bold border transition-all duration-150 active:scale-95',
                    paymentMethod === method
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-alt text-text-secondary border-border hover:border-primary/40 hover:text-text',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom padding for safe area */}
        <div className="h-32" />
      </motion.main>

      {/* DB save error banner */}
      {saveError && (
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mx-4 mb-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-center gap-3">
          <span className="text-red-500 text-lg leading-none">!</span>
          <p className="text-sm font-medium text-red-700 flex-1">
            저장 중 오류가 발생했습니다. 데이터는 기기에 임시 보관됩니다.
          </p>
          <button
            type="button"
            onClick={() => setSaveError(false)}
            className="text-red-400 hover:text-red-600 text-lg leading-none"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
      )}

      {/* Sticky bottom CTA */}
      <div className="sticky bottom-0 z-20 bg-background/95 backdrop-blur-sm border-t border-border px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-w-lg mx-auto w-full">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!paymentMethod}
          loading={isSaving}
          onClick={() => void handlePaymentComplete()}
        >
          {t('fieldMode.paymentComplete')}
        </Button>
      </div>
    </div>
  );
}
