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
import { Modal } from '@/components/ui/Modal';
import { SettlementCard } from '@/components/field-mode/SettlementCard';
import { CATEGORY_LABELS } from '@/lib/labels';
import { useReservationStore } from '@/store/reservation-store';
import { useCustomerStore } from '@/store/customer-store';
import type { PaymentMethod } from '@/types/consultation';
import type { AddOnOption } from '@/types/pre-consultation';
import { generateId } from '@/lib/generate-id';

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
    setCustomerInfo,
    setRecordId,
    setPhase,
  } = useFieldModeStore();

  const customers = useCustomerStore((s) => s.customers);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');

  const addQuickSaleRecord = useRecordsStore((s) => s.addQuickSaleRecord);
  const { activeDesignerId, currentShopId } = useAuthStore();
  const shopSettings = useAppStore((s) => s.shopSettings);

  // 회원권 결제용 — 현재 고객의 회원권 상태
  const customerMembership = useCustomerStore((s) =>
    customerId ? s.customers.find((c) => c.id === customerId)?.membership : undefined,
  );
  const canUseMembership =
    !!customerId && !!customerMembership && customerMembership.status === 'active' && customerMembership.remainingSessions > 0;

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // ── Discount ───────────────────────────────────────────────────────────────
  const [discountPercent, setDiscountPercent] = useState(0);

  // ── Deposit ────────────────────────────────────────────────────────────────
  // M2 fix: booking별 예약금이 있으면 우선 사용, 없으면 샵 기본값
  const matchedBooking = useReservationStore((s) => s.reservations.find((r) => r.id === bookingId));
  const presetDeposit = matchedBooking?.deposit ?? shopSettings.depositAmount ?? 0;
  const [depositApplied, setDepositApplied] = useState(0);
  const [customDepositInput, setCustomDepositInput] = useState('');
  const [showCustomDeposit, setShowCustomDeposit] = useState(false);

  // Guard: redirect if no design selected
  useEffect(() => {
    if (!selectedCategory) {
      router.replace('/field-mode');
    }
  }, [selectedCategory, router]);

  // 데모 모드에서 예약 없이 진입한 경우, 체험용으로 회원권 있는 데모 고객 자동 연결
  useEffect(() => {
    if (currentShopId !== 'shop-demo') return;
    if (customerId) return;
    const demoCustomer = customers.find(
      (c) =>
        c.shopId === 'shop-demo' &&
        c.membership &&
        c.membership.status === 'active' &&
        c.membership.remainingSessions > 0,
    );
    if (demoCustomer) {
      setCustomerInfo(demoCustomer.name, demoCustomer.phone, demoCustomer.id);
    }
  }, [currentShopId, customerId, customers, setCustomerInfo]);

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
  const isMembershipPayment = paymentMethod === 'membership' && canUseMembership;
  const finalPrice = isMembershipPayment
    ? 0
    : Math.max(0, subtotal - discountAmount - depositApplied);

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

    const recordId = generateId('fm');
    const effectiveDesignerId = designerId || activeDesignerId || '';
    const effectiveShopId = currentShopId ?? 'shop-demo';

    // 1) 시술 기록 저장 — 실패 시 회원권 차감 skip (2026-04-20 R3: 데이터 정합성)
    let recordSaved = true;
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
      console.warn('[settlement] DB save failed — skipping membership deduction');
      setSaveError(true);
      recordSaved = false;
    }

    // 2) 예약 → completed
    if (bookingId) {
      useReservationStore.getState().updateReservation(bookingId, { status: 'completed' });
    }

    // 3) 회원권 자동 차감 — 시술 기록이 정상 저장된 경우에만 (2026-04-20 R3)
    if (recordSaved && paymentMethod === 'membership' && customerId) {
      useCustomerStore.getState().useMembershipSession(customerId, recordId);
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
            <div className="flex items-baseline gap-2 flex-wrap">
              <p className="text-3xl font-bold text-primary tracking-tight">
                ₩{finalPrice.toLocaleString()}
              </p>
              {isMembershipPayment ? (
                <>
                  <p className="text-sm text-text-muted line-through">
                    ₩{subtotal.toLocaleString()}
                  </p>
                  <span className="rounded-full bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 border border-success/20">
                    회원권 1회 차감
                  </span>
                </>
              ) : (
                (discountPercent > 0 || depositApplied > 0) && (
                  <p className="text-sm text-text-muted line-through">
                    ₩{subtotal.toLocaleString()}
                  </p>
                )
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
              ).map(({ method, label }) => {
                const isMembership = method === 'membership';
                const disabled = isMembership && !canUseMembership;
                return (
                  <button
                    key={method}
                    type="button"
                    role="radio"
                    aria-checked={paymentMethod === method}
                    aria-disabled={disabled}
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      setPaymentMethod(method);
                    }}
                    className={cn(
                      'min-h-[52px] rounded-xl text-sm font-bold border transition-all duration-150 flex flex-col items-center justify-center gap-0.5 px-2',
                      disabled
                        ? 'bg-surface-alt/50 text-text-muted border-border/50 cursor-not-allowed opacity-60'
                        : paymentMethod === method
                          ? 'bg-primary text-white border-primary shadow-sm active:scale-95'
                          : 'bg-surface-alt text-text-secondary border-border hover:border-primary/40 hover:text-text active:scale-95',
                    )}
                  >
                    <span>{label}</span>
                    {isMembership && customerMembership && canUseMembership && (
                      <span
                        className={cn(
                          'text-[10px] font-semibold tabular-nums leading-tight',
                          paymentMethod === 'membership' ? 'text-white/90' : 'text-primary',
                        )}
                      >
                        잔여 {customerMembership.remainingSessions}/{customerMembership.totalSessions}회
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* 회원권 비활성 안내 */}
            {!canUseMembership && (
              <div className="mt-2 px-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-[11px] text-text-muted">
                  {!customerId
                    ? '회원권 결제를 사용하려면 고객을 연결해 주세요'
                    : !customerMembership
                      ? '이 고객은 등록된 회원권이 없어요 · 고객 카드에서 회원권을 등록해보세요'
                      : customerMembership.status !== 'active'
                        ? '이 고객의 회원권은 만료되었거나 소진되었어요'
                        : '이 고객의 회원권 잔여 횟수가 없어요'}
                </p>
                {!customerId && (
                  <button
                    type="button"
                    onClick={() => setShowCustomerPicker(true)}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    고객 연결하기
                  </button>
                )}
              </div>
            )}
            {customerId && customerName && (
              <p className="mt-2 px-1 text-[11px] text-text-muted">
                현재 고객: <span className="font-semibold text-text">{customerName}</span>{' '}
                <button
                  type="button"
                  onClick={() => setShowCustomerPicker(true)}
                  className="text-primary hover:underline font-medium"
                >
                  변경
                </button>
              </p>
            )}
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

      {/* Customer picker modal */}
      <Modal
        isOpen={showCustomerPicker}
        onClose={() => {
          setShowCustomerPicker(false);
          setCustomerQuery('');
        }}
        title="고객 연결"
      >
        <div className="px-5 py-4 flex flex-col gap-3">
          <input
            type="text"
            value={customerQuery}
            onChange={(e) => setCustomerQuery(e.target.value)}
            placeholder="이름 또는 전화번호로 검색"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            autoFocus
          />
          <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
            {(() => {
              const q = customerQuery.trim().toLowerCase();
              const list = q
                ? customers.filter(
                    (c) =>
                      c.name.toLowerCase().includes(q) ||
                      c.phone.replace(/[^0-9]/g, '').includes(q.replace(/[^0-9]/g, '')),
                  )
                : customers;
              const sorted = [...list].sort((a, b) => {
                const aHas = a.membership && a.membership.status === 'active' && a.membership.remainingSessions > 0;
                const bHas = b.membership && b.membership.status === 'active' && b.membership.remainingSessions > 0;
                if (aHas !== bHas) return aHas ? -1 : 1;
                return a.name.localeCompare(b.name, 'ko');
              });
              if (sorted.length === 0) {
                return <p className="text-sm text-text-muted py-6 text-center">일치하는 고객이 없어요</p>;
              }
              return sorted.slice(0, 30).map((c) => {
                const activeMb = c.membership && c.membership.status === 'active' && c.membership.remainingSessions > 0;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCustomerInfo(c.name, c.phone, c.id);
                      setShowCustomerPicker(false);
                      setCustomerQuery('');
                    }}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface px-3 py-2.5 hover:bg-surface-alt text-left transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text truncate">{c.name}</p>
                      <p className="text-[11px] text-text-muted">{c.phone}</p>
                    </div>
                    {activeMb && c.membership && (
                      <span className="rounded-full bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 border border-success/20 tabular-nums flex-shrink-0 ml-2">
                        회원권 {c.membership.remainingSessions}/{c.membership.totalSessions}
                      </span>
                    )}
                  </button>
                );
              });
            })()}
          </div>
        </div>
      </Modal>
    </div>
  );
}
