'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
import { resolveCategoryLabelKo } from '@/lib/category-resolver';
import { useReservationStore } from '@/store/reservation-store';
import { useCustomerStore } from '@/store/customer-store';
import type { PaymentMethod, OffType, ConsultationType } from '@/types/consultation';
import type { AddOnOption } from '@/types/pre-consultation';
import { generateId } from '@/lib/generate-id';
import { getRemainingAmount, canUseMembership as canUseMembershipFn, getEffectiveStatus } from '@/lib/membership';

const ADD_ON_LABELS: Record<string, string> = {
  stone: '스톤',
  parts: '파츠',
  glitter: '글리터',
  wrapping: '랩핑',
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
    selectedPhotoPrice,
    removalType,
    lengthType,
    addOns,
    wrappingPreference,
    customPartSelections,
    nailShape,
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
    addInTreatmentAddon: _addInTreatmentAddon,
  } = useFieldModeStore();

  // [FM-1] addOns 라벨 목록 — inTreatmentAddons에서 이미 baseEstimate에 포함된 addon을 중복 추가하면 이중청구 발생
  // 추가 시 addOns에 포함된 addon 라벨과 동일한 경우 차단.
  // 0531: wrappingPreference === 'yes' 이면 addOns에 'wrapping'이 없어도 baseEstimate에 랩핑이 포함됨
  //       → 시술 중 '랩핑' 라벨 추가를 차단해 이중청구 방지.
  const addOnLabelSet = useMemo<Set<string>>(() => {
    const labels = new Set<string>();
    addOns.forEach((addon) => {
      const label = ADD_ON_LABELS[addon];
      if (label) labels.add(label);
    });
    if (wrappingPreference === 'yes' && !addOns.includes('wrapping')) {
      labels.add(ADD_ON_LABELS['wrapping']);
    }
    return labels;
  }, [addOns, wrappingPreference]);

  const addInTreatmentAddon = (addon: { label: string; amount: number }): void => {
    // [FM-1] 기본 옵션(addOns)에 이미 포함된 항목이면 inTreatmentAddons에 추가하지 않음
    if (addOnLabelSet.has(addon.label)) return;
    _addInTreatmentAddon(addon);
  };

  const customers = useCustomerStore((s) => s.customers);
  // 0428 P0-4: 회원권 차감 DB sync 에러 가시성
  const membershipSyncError = useCustomerStore((s) => s.membershipSyncError);
  const clearMembershipSyncError = useCustomerStore((s) => s.clearMembershipSyncError);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [customerQuery, setCustomerQuery] = useState('');

  const addQuickSaleRecord = useRecordsStore((s) => s.addQuickSaleRecord);
  const { activeDesignerId, currentShopId } = useAuthStore();
  const shopSettings = useAppStore((s) => s.shopSettings);

  // 회원권 결제용 — 현재 고객의 회원권 상태
  const customerMembership = useCustomerStore((s) =>
    customerId ? s.customers.find((c) => c.id === customerId)?.membership : undefined,
  );
  // 0423: 잔액 기반 + 만료일 자동 판정
  const canUseMembership = !!customerId && canUseMembershipFn(customerMembership);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  // ── Discount ───────────────────────────────────────────────────────────────
  const [discountPercent, setDiscountPercent] = useState(0);

  // ── Deposit ────────────────────────────────────────────────────────────────
  // M2 fix: booking별 예약금이 있으면 우선 사용, 없으면 샵 기본값
  const matchedBooking = useReservationStore((s) => s.reservations.find((r) => r.id === bookingId));
  const presetDeposit = matchedBooking?.deposit ?? shopSettings.depositAmount ?? 0;
  const [depositApplied, setDepositApplied] = useState(presetDeposit);
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
      (c) => c.shopId === 'shop-demo' && canUseMembershipFn(c.membership),
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
      wrappingPreference,
      addOns,
      categoryPricing: shopSettings.categoryPricing,
      surcharges: shopSettings.surcharges,
      photoBasePrice: selectedPhotoPrice ?? undefined,
      customCategories: shopSettings.customCategories,
      // 0531: 사전상담 커스텀 파츠를 base 에 포함 → 손님 견적 = 계산대 일치 (이전엔 파츠 누락)
      customPartSelections,
      customParts: shopSettings.customParts,
    });
  }, [selectedCategory, removalType, lengthType, wrappingPreference, customPartSelections, addOns, shopSettings, selectedPhotoPrice]);

  const inTreatmentTotal = inTreatmentAddons.reduce((s, a) => s + a.amount, 0);
  const subtotal = (baseEstimate?.minTotal ?? 0) + inTreatmentTotal;
  const discountAmount = discountPercent > 0 ? Math.round(subtotal * discountPercent / 100) : 0;
  const isMembershipPayment = paymentMethod === 'membership' && canUseMembership;

  // 0423 반영: "얼마 남았는지" 기준 차감.
  // - 회원권 잔액(원)이 시술금보다 크거나 같으면 시술금 전액 차감 → 고객 결제 0원
  // - 잔액보다 시술금이 크면 잔액만큼만 차감 → 차액은 현금/카드로 결제
  const afterDiscountDeposit = Math.max(0, subtotal - discountAmount - depositApplied);
  const membershipRemainingBefore = customerMembership ? getRemainingAmount(customerMembership) : 0;
  const membershipApplied = isMembershipPayment
    ? Math.max(0, Math.min(membershipRemainingBefore, afterDiscountDeposit))
    : 0;
  const membershipRemainingAfter = isMembershipPayment
    ? Math.max(0, membershipRemainingBefore - membershipApplied)
    : membershipRemainingBefore;
  // 회원권 차감 후 남은 잔액 (차액 — 고객이 결제해야 할 금액)
  const remainingAfterMembership = Math.max(0, afterDiscountDeposit - membershipApplied);
  // 고객이 실제로 결제해야 할 금액
  const finalPrice = isMembershipPayment ? remainingAfterMembership : afterDiscountDeposit;

  // 회원권 + 차액 결제 시 현금/카드 선택 (기본 카드)
  const [secondaryPaymentMethod, setSecondaryPaymentMethod] = useState<'cash' | 'card'>('card');

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
      // [HIGH] 랩핑 surcharge 반영 — shopSettings 우선, 없으면 고정가
      case 'wrapping': return shopSettings.surcharges.wrapping ?? ADDON_FIXED_PRICES.wrapping;
      default: return 0;
    }
  }

  // 0531 R3 — 사전상담 커스텀 파츠 선택분(수량>0) 존재 여부
  const hasCustomPartLines =
    !!customPartSelections &&
    !!shopSettings.customParts &&
    shopSettings.customParts.some((p) => {
      const raw = customPartSelections[p.name];
      return typeof raw === 'number' && raw > 0;
    });
  // 0531 R3 — 랩핑/커스텀파츠만 추가금이 있어도 기본 옵션 카드를 표시(이전엔 숨겨져 5,000원이 총액에만 반영되고 내역엔 안 보임)
  const hasBaseOptions =
    removalType !== 'none' ||
    lengthType === 'extend' ||
    addOns.length > 0 ||
    (wrappingPreference === 'yes' && !addOns.includes('wrapping')) ||
    hasCustomPartLines;

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

    // [FM-2] removalType → offType 매핑 (RemovalPreference → OffType)
    const offType: OffType =
      removalType === 'self_shop' ? 'same_shop'
      : removalType === 'other_shop' ? 'other_shop'
      : 'none';

    // [FM-2] inTreatmentAddons(사전상담 carry + 시술 중 추가) 중 샵 커스텀 파츠(큐빅·스와 등)와
    //        라벨이 일치하는 항목을 partsSelections로 복원해 매출 레코드에 정합 저장.
    //        point_art·glitter 등 일반 add-on은 customParts에 없으므로 자동 제외됨.
    const restoredParts: { grade: 'A'; quantity: number; customPartId: string }[] = [];
    for (const addon of inTreatmentAddons) {
      const part = shopSettings.customParts?.find((p) => p.name === addon.label);
      if (!part) continue;
      const existing = restoredParts.find((s) => s.customPartId === part.id);
      if (existing) existing.quantity += 1;
      else restoredParts.push({ grade: 'A', quantity: 1, customPartId: part.id });
    }
    const hasParts = restoredParts.length > 0 || addOns.includes('parts');
    const partsSelections: ConsultationType['partsSelections'] =
      restoredParts.length > 0
        ? restoredParts
        : addOns.includes('parts')
          ? [{ grade: 'A', quantity: 1 }]
          : [];

    // [SALES-5] 할인/예약금 내역 보존
    const grossPrice = subtotal; // 할인/예약금 차감 전 금액

    // 0531: 시술 금액 항목별 내역 — records 가격 상세 표시용. 합계 = grossPrice 보장.
    //   subtotal = baseEstimate.minTotal(카테고리+오프+연장+옵션+파츠) + inTreatmentTotal(시술 중 추가)
    //   와 동일 구성으로 라인을 쌓아 정확히 일치시킨다.
    const priceLineItems: { label: string; amount: number }[] = [];
    if (baseEstimate) {
      priceLineItems.push({ label: resolveCategoryLabelKo(selectedCategory, shopSettings), amount: baseEstimate.categoryBase });
      if (baseEstimate.removalSurcharge > 0) {
        priceLineItems.push({ label: removalType === 'self_shop' ? '자샵 오프' : '타샵 오프', amount: baseEstimate.removalSurcharge });
      }
      if (baseEstimate.extensionSurcharge > 0) {
        priceLineItems.push({ label: '연장', amount: baseEstimate.extensionSurcharge });
      }
      const addonBreakdownAmount = (addon: AddOnOption): number => {
        switch (addon) {
          case 'stone': return ADDON_FIXED_PRICES.stone;
          case 'parts': return shopSettings.surcharges.largeParts;
          case 'glitter': return ADDON_FIXED_PRICES.glitter;
          case 'wrapping': return shopSettings.surcharges.wrapping ?? ADDON_FIXED_PRICES.wrapping; // estimate 와 동일
          default: return 0;
        }
      };
      for (const addon of addOns) {
        const amt = addonBreakdownAmount(addon);
        if (amt > 0) priceLineItems.push({ label: ADD_ON_LABELS[addon] ?? addon, amount: amt });
      }
      if (wrappingPreference === 'yes' && !addOns.includes('wrapping')) {
        const w = shopSettings.surcharges.wrapping ?? ADDON_FIXED_PRICES.wrapping;
        if (w > 0) priceLineItems.push({ label: '랩핑', amount: w });
      }
      if (customPartSelections && shopSettings.customParts) {
        for (const part of shopSettings.customParts) {
          const raw = customPartSelections[part.name];
          const count = typeof raw === 'number' ? Math.max(0, Math.floor(raw)) : 0;
          if (count > 0) priceLineItems.push({ label: `${part.name} ×${count}`, amount: part.pricePerUnit * count });
        }
      }
    }
    for (const a of inTreatmentAddons) {
      priceLineItems.push({ label: a.label, amount: a.amount });
    }
    // 합계 정합 안전망: 라인 합이 grossPrice 와 다르면 조정 라인 추가
    const lineItemsSum = priceLineItems.reduce((s, li) => s + li.amount, 0);
    if (lineItemsSum !== grossPrice) {
      priceLineItems.push({ label: '기타', amount: grossPrice - lineItemsSum });
    }

    // 1) 시술 기록 저장 — 실패 시 회원권 차감 skip (2026-04-20 R3: 데이터 정합성)
    let recordSaved = true;
    try {
      await addQuickSaleRecord({
        id: recordId,
        shopId: effectiveShopId,
        designerId: effectiveDesignerId,
        serviceType: resolveCategoryLabelKo(selectedCategory, shopSettings),
        finalPrice,
        paymentMethod,
        // 회원권 + 차액 복합 결제 시 차액 정보 저장
        secondaryPaymentMethod: isMembershipPayment && remainingAfterMembership > 0 ? secondaryPaymentMethod : undefined,
        secondaryAmount: isMembershipPayment && remainingAfterMembership > 0 ? remainingAfterMembership : undefined,
        // 0428 P1-1: 회원권에서 차감된 금액 — totalSpend 시술 전액 기록용
        membershipApplied: isMembershipPayment ? membershipApplied : undefined,
        // 0528 N2: 업셀링 매출 (사전상담 추가옵션 + 시술 중 추가 = inTreatmentTotal)
        upsellAmount: inTreatmentTotal > 0 ? inTreatmentTotal : undefined,
        // [MEDIUM] depositApplied 미저장 수정
        deposit: depositApplied > 0 ? depositApplied : undefined,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerId: customerId || undefined,
        bookingId: bookingId || undefined,
        // [FM-2] 실제 field-mode 상태를 consultation 레코드에 정확히 저장
        consultationOverrides: {
          offType,
          nailShape: nailShape ?? undefined,
          hasParts,
          partsSelections,
        },
        // [SALES-5] 할인/예약금 내역 + 0531 항목별 내역(lineItems) — 항상 전달해 가격 상세 보존
        pricingMeta: {
          grossPrice,
          discountPercent: discountPercent > 0 ? discountPercent : undefined,
          discountAmount: discountAmount > 0 ? discountAmount : undefined,
          depositAmount: depositApplied > 0 ? depositApplied : undefined,
          lineItems: priceLineItems,
        },
      });
    } catch {
      console.warn('[settlement] DB save failed — skipping membership deduction');
      setSaveError(true);
      recordSaved = false;
      setIsSaving(false);
      return; // [HIGH] DB 저장 실패 시 wrap-up 이동 차단
    }

    // 2) 예약 → completed — DB 저장 성공 시에만 (실패 시 예약 상태 변경 차단)
    // [HIGH] DB 저장 실패해도 booking이 completed로 바뀌던 버그 수정
    if (recordSaved && bookingId) {
      useReservationStore.getState().updateReservation(bookingId, { status: 'completed' });
    }

    // 3) 회원권 자동 차감 — 시술 기록이 정상 저장된 경우에만 (2026-04-20 R3)
    //    0423: 금액 기반으로 차감 (membershipApplied)
    //    [HIGH] guard 불일치 수정: isMembershipPayment는 canUseMembership까지 포함
    if (recordSaved && isMembershipPayment && customerId) {
      useCustomerStore.getState().useMembershipSession(customerId, recordId, membershipApplied);
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
            onClick={() => setShowBackConfirm(true)}
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
                  alt={selectedCategory ? (resolveCategoryLabelKo(selectedCategory, shopSettings)) : ''}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0 bg-surface-alt"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-surface-alt flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">💅</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-text text-base">
                  {resolveCategoryLabelKo(selectedCategory, shopSettings)}
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
                {/* 0531 R3 — 랩핑 선호(addOns에 미포함) 라인. 저장 lineItems·총액과 동일 기준 */}
                {wrappingPreference === 'yes' && !addOns.includes('wrapping') && getAddOnAmount('wrapping') > 0 && (
                  <LineRow label="랩핑" amount={getAddOnAmount('wrapping')} />
                )}
                {/* 0531 R3 — 사전상담 커스텀 파츠 선택분 라인 */}
                {customPartSelections && shopSettings.customParts?.map((part) => {
                  const raw = customPartSelections[part.name];
                  const count = typeof raw === 'number' ? Math.max(0, Math.floor(raw)) : 0;
                  if (count <= 0) return null;
                  return (
                    <LineRow key={part.name} label={`${part.name} ×${count}`} amount={part.pricePerUnit * count} />
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

        {/* Card 3-B: 커스텀 파츠 빠른 추가 — 사장님이 설정에서 등록한 파츠 */}
        {shopSettings.customParts && shopSettings.customParts.length > 0 && (
          <motion.div variants={itemVariants}>
            <SettlementCard icon="💎" title="파츠 빠른 추가">
              <p className="text-xs text-text-muted mb-3">탭하면 위 시술 추가 항목에 누적돼요</p>
              <div className="flex flex-wrap gap-2">
                {shopSettings.customParts.map((part) => {
                  // [HIGH] 이중청구 방지: 사전상담에서 이미 baseEstimate에 포함된 파츠(수량>0)는 추가 차단
                  const preSelectedCount = customPartSelections
                    ? (typeof customPartSelections[part.name] === 'number' ? customPartSelections[part.name] : 0)
                    : 0;
                  const isAlreadyInBase = preSelectedCount > 0;
                  return (
                    <button
                      key={part.id}
                      type="button"
                      disabled={isAlreadyInBase}
                      title={isAlreadyInBase ? `사전 상담에서 ${preSelectedCount}개 포함됨 (기본 금액에 반영)` : undefined}
                      onClick={() => {
                        if (isAlreadyInBase) return;
                        _addInTreatmentAddon({
                          label: part.name,
                          amount: part.pricePerUnit,
                        });
                      }}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                        isAlreadyInBase
                          ? 'bg-surface-alt/60 border-border/50 text-text-muted cursor-not-allowed opacity-60'
                          : 'bg-surface-alt border-border hover:border-primary/40 hover:bg-primary/5 active:scale-95',
                      )}
                    >
                      {isAlreadyInBase ? (
                        <>
                          <span className="text-text-muted">✓</span>
                          <span className="font-semibold text-text-muted">{part.name}</span>
                          <span className="text-text-muted">기본 포함×{preSelectedCount}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-primary font-bold">+</span>
                          <span className="font-semibold text-text">{part.name}</span>
                          <span className="text-primary">₩{part.pricePerUnit.toLocaleString()}</span>
                        </>
                      )}
                    </button>
                  );
                })}
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
            {depositApplied > 0 && depositApplied <= subtotal && (
              <p className="text-xs text-blue-600 font-semibold mt-2 text-right">
                -{depositApplied.toLocaleString()}원 예약금 차감
              </p>
            )}
            {depositApplied > subtotal && (
              <p className="text-xs text-error font-semibold mt-2 text-right">
                ⚠ 예약금({depositApplied.toLocaleString()}원)이 시술금({subtotal.toLocaleString()}원)을 초과합니다
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
                    ₩{afterDiscountDeposit.toLocaleString()}
                  </p>
                  <span className="rounded-full bg-success/10 text-success text-[10px] font-bold px-2 py-0.5 border border-success/20">
                    회원권 {membershipApplied.toLocaleString()}원 차감
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
            {/* 0428 P1-5: 차액이 있으면 강조 박스로 표시 (받아야 할 금액 명확히) */}
            {isMembershipPayment && customerMembership && remainingAfterMembership > 0 && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-amber-900">
                    추가로 받을 금액
                  </span>
                  <span className="text-lg font-black text-amber-900 tabular-nums">
                    {remainingAfterMembership.toLocaleString()}원
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-snug">
                  {depositApplied > 0 && `예약금 ${depositApplied.toLocaleString()}원 차감 후 `}회원권에서 {membershipApplied.toLocaleString()}원 차감 + {secondaryPaymentMethod === 'cash' ? '현금' : '카드'}로 {remainingAfterMembership.toLocaleString()}원 결제
                  <br />
                  결제 후 회원권 총 잔액 {membershipRemainingAfter.toLocaleString()}원
                </p>
              </div>
            )}
            {isMembershipPayment && customerMembership && remainingAfterMembership === 0 && membershipApplied > 0 && (
              <p className="text-xs text-success font-medium mt-1">
                {depositApplied > 0 && `예약금 ${depositApplied.toLocaleString()}원 차감 후 `}회원권에서 {membershipApplied.toLocaleString()}원 차감 · 추가로 받으실 금액 없어요
                <br />
                <span className="text-[11px] text-text-muted">
                  결제 후 회원권 총 잔액: {membershipRemainingAfter.toLocaleString()}원
                </span>
              </p>
            )}
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
                    {isMembership && customerMembership && canUseMembership && membershipRemainingBefore > 0 && (
                      <span
                        className={cn(
                          'text-[10px] font-semibold tabular-nums leading-tight',
                          paymentMethod === 'membership' ? 'text-white/90' : 'text-primary',
                        )}
                      >
                        잔액 {membershipRemainingBefore.toLocaleString()}원
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
                      : getEffectiveStatus(customerMembership) === 'expired'
                        ? '이 회원권은 만료되었어요'
                        : getEffectiveStatus(customerMembership) === 'used_up'
                          ? '이 회원권은 잔액이 모두 소진되었어요'
                          : '이 회원권은 지금 사용할 수 없어요'}
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

            {/* 회원권 + 차액 복합 결제: 차액 결제 수단 선택 */}
            {isMembershipPayment && remainingAfterMembership > 0 && (
              <div className="mt-4 rounded-xl bg-surface-alt border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-text-secondary">
                    차액 <span className="text-primary tabular-nums">{remainingAfterMembership.toLocaleString()}원</span> 결제 수단
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { method: 'cash' as const, label: t('fieldMode.paymentCash') },
                      { method: 'card' as const, label: t('fieldMode.paymentCard') },
                    ] as const
                  ).map(({ method, label }) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setSecondaryPaymentMethod(method)}
                      className={cn(
                        'min-h-[44px] rounded-xl text-sm font-semibold border transition-all duration-150 active:scale-95',
                        secondaryPaymentMethod === method
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-surface text-text-secondary border-border hover:border-primary/40 hover:text-text',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Bottom padding for safe area */}
        <div className="h-32" />
      </motion.main>

      {/* DB save error banner */}
      {saveError && (
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mx-4 mb-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3">
          <span className="text-red-500 text-lg leading-none mt-0.5">!</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-700">
              저장 중 오류가 발생했습니다. 데이터는 기기에 임시 보관됩니다.
            </p>
            <button
              type="button"
              onClick={() => {
                setSaveError(false);
                void handlePaymentComplete();
              }}
              className="mt-1.5 text-xs font-bold text-red-600 hover:text-red-800 underline underline-offset-2"
            >
              다시 시도
            </button>
          </div>
          <button
            type="button"
            onClick={() => setSaveError(false)}
            className="text-red-400 hover:text-red-600 text-lg leading-none flex-shrink-0"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
      )}

      {/* 0428 P0-4: 회원권 동기화 실패 가시성 */}
      {membershipSyncError && (
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 mx-4 mb-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-3">
          <span className="text-amber-600 text-lg leading-none">⚠</span>
          <p className="text-sm font-medium text-amber-800 flex-1">
            회원권 차감 동기화에 실패했어요. 인터넷 연결을 확인하고 잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={() => clearMembershipSyncError()}
            className="text-amber-600 hover:text-amber-800 text-lg leading-none"
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
          disabled={!paymentMethod || depositApplied > subtotal}
          loading={isSaving}
          onClick={() => void handlePaymentComplete()}
        >
          {t('fieldMode.paymentComplete')}
        </Button>
      </div>

      {/* Back confirmation dialog */}
      <AnimatePresence>
        {showBackConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-backdrop/60 px-4 pb-safe"
            onClick={() => setShowBackConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface rounded-2xl p-6 mb-4 shadow-elevated"
            >
              <p className="text-base font-bold text-text mb-1">정산을 취소하시겠어요?</p>
              <p className="text-sm text-text-muted mb-5">
                입력한 정산 정보가 유지됩니다.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowBackConfirm(false)}
                >
                  계속 진행
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => { setShowBackConfirm(false); router.back(); }}
                >
                  돌아가기
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                // 0423: 잔액 + 만료일 반영
                const aHas = canUseMembershipFn(a.membership);
                const bHas = canUseMembershipFn(b.membership);
                if (aHas !== bHas) return aHas ? -1 : 1;
                return a.name.localeCompare(b.name, 'ko');
              });
              if (sorted.length === 0) {
                return <p className="text-sm text-text-muted py-6 text-center">일치하는 고객이 없어요</p>;
              }
              return sorted.slice(0, 30).map((c) => {
                const activeMb = canUseMembershipFn(c.membership);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCustomerInfo(c.name, c.phone, c.id);
                      // [HIGH] 고객 변경 시 새 고객이 회원권 사용불가면 stale paymentMethod 초기화
                      if (paymentMethod === 'membership' && !canUseMembershipFn(c.membership)) {
                        useFieldModeStore.setState({ paymentMethod: null });
                      }
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
                        회원권 잔액 {getRemainingAmount(c.membership).toLocaleString()}원
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
