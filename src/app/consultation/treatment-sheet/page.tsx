'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useConsultationStore } from '@/store/consultation-store';
import { useAuthStore } from '@/store/auth-store';
import { useRecordsStore } from '@/store/records-store';
import { HandIllustration } from '@/components/canvas/HandIllustration';
import { formatNowInKorea, formatPrice, formatPriceNumber, getNowInKoreaIso } from '@/lib/format';
import { calculatePrice, buildServicePricingFromShopSettings } from '@/lib/price-calculator';
import { useAppStore } from '@/store/app-store';
import { estimateTime } from '@/lib/time-calculator';
import { useShopStore } from '@/store/shop-store';
import { useCustomerStore } from '@/store/customer-store';
import type { FingerPosition, FingerSelection } from '@/types/canvas';
import { useConsultationGuard } from '@/lib/use-consultation-guard';
import type { DiscountConfig, NailShape } from '@/types/consultation';
import { useT, useKo, useLocale } from '@/lib/i18n';

type LengthType = 'short' | 'medium' | 'long';
type ThicknessType = 'thin' | 'medium' | 'thick';
type CuticleType = 'low' | 'medium' | 'high';

interface PricingExtra {
  id: string;
  label: string;
  amount: number;
}

interface DailyChecklistState {
  shape: NailShape | null;
  length: LengthType | null;
  thickness: ThicknessType | null;
  cuticleSensitivity: CuticleType | null;
  memo: string;
}

function hydratePricingExtras(extras?: { label: string; amount: number }[]): PricingExtra[] {
  return (extras ?? []).map((extra, index) => ({
    id: `saved-extra-${index}-${extra.label}`,
    label: extra.label,
    amount: extra.amount,
  }));
}

const FIXED_DISCOUNT_PRESETS = [3000, 5000, 10000, 20000] as const;
const PERCENT_DISCOUNT_PRESETS = [5, 10, 15, 20] as const;
const DEPOSIT_PRESETS = [0, 10000, 20000, 30000, 50000] as const;

function SegmentControl<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: T[];
  value: T | null;
  onChange: (v: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] border ${
            value === opt
              ? 'bg-text text-white border-text'
              : 'bg-surface-alt text-text-secondary border-border'
          }`}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}

function NumberPresetPicker({
  label,
  values,
  selectedValue,
  onSelect,
  formatter,
}: {
  label: string;
  values: readonly number[];
  selectedValue: number;
  onSelect: (value: number) => void;
  formatter: (value: number) => string;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-text-secondary">{label}</span>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const isSelected = selectedValue === value;

          return (
            <button
              key={`${label}-${value}`}
              type="button"
              onClick={() => onSelect(value)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all active:scale-[0.97] ${
                isSelected
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-background text-text-secondary hover:border-primary/40'
              }`}
            >
              {formatter(value)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepValueControl({
  label,
  value,
  step,
  min = 0,
  max,
  onChange,
  formatter,
}: {
  label: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  formatter: (value: number) => string;
}): React.ReactElement {
  const canDecrease = value > min;
  const canIncrease = max === undefined || value < max;

  const updateValue = (nextValue: number): void => {
    const clamped = Math.max(min, Math.min(max ?? nextValue, nextValue));
    onChange(clamped);
  };

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background px-3 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-text-muted">{label}</span>
        <span className="text-base font-bold text-text">{formatter(value)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateValue(value - step)}
          disabled={!canDecrease}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-lg font-bold text-text transition-colors disabled:opacity-40"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => updateValue(value + step)}
          disabled={!canIncrease}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-lg font-bold text-text transition-colors disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function TreatmentSheetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consultationId = searchParams.get('consultationId');
  const { consultation, reset } = useConsultationStore();
  const { activeDesignerId, activeDesignerName } = useAuthStore();
  const getRecordById = useRecordsStore((s) => s.getRecordById);
  const updateRecord = useRecordsStore((s) => s.updateRecord);
  const record = consultationId ? getRecordById(consultationId) : undefined;
  useConsultationGuard(!consultationId || !record);
  const consultationData = record?.consultation ?? consultation;
  const [smallTalkText, setSmallTalkText] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isFinalSaving, setIsFinalSaving] = useState(false);
  const [checklist, setChecklist] = useState<DailyChecklistState>({
    shape: (consultationData.nailShape ?? null) as NailShape | null,
    length: null,
    thickness: null,
    cuticleSensitivity: null,
    memo: '',
  });

  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const designers = useShopStore((s) => s.designers);
  const designer = designers.find(d => d.id === (consultationData.designerId || activeDesignerId));
  const shopSettings = useAppStore((s) => s.shopSettings);
  const shopPricing = useMemo(() => buildServicePricingFromShopSettings(shopSettings), [shopSettings]);
  const consultationBreakdown = calculatePrice(consultationData, shopPricing);
  const estimatedMinutes = estimateTime(consultationData);
  const today = formatNowInKorea('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  const [basePrice, setBasePrice] = useState<number>(record?.pricingAdjustments?.basePrice ?? consultationBreakdown.subtotal);
  const [extras, setExtras] = useState<PricingExtra[]>(hydratePricingExtras(record?.pricingAdjustments?.extras));
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>(consultationData.discount?.type ?? 'fixed');
  const [discountValue, setDiscountValue] = useState<number>(consultationData.discount?.value ?? 0);
  const [depositAmount, setDepositAmount] = useState<number>(consultationData.deposit ?? 0);
  const [isPriceFinalized, setIsPriceFinalized] = useState(Boolean(record?.finalizedAt));
  const [isFinalizing, setIsFinalizing] = useState(false);

  const extrasSum = extras.reduce((sum, e) => sum + e.amount, 0);
  const pricingSubtotal = basePrice + extrasSum;
  const appliedDiscount = useMemo<DiscountConfig | undefined>(() => {
    if (discountValue <= 0) {
      return undefined;
    }

    return { type: discountType, value: discountValue };
  }, [discountType, discountValue]);
  const discountAmount = appliedDiscount
    ? appliedDiscount.type === 'percent'
      ? Math.round(pricingSubtotal * (appliedDiscount.value / 100))
      : appliedDiscount.value
    : 0;
  const calculatedFinalPrice = Math.max(0, pricingSubtotal - discountAmount - depositAmount);

  useEffect(() => {
    const nextConsultation = record?.consultation ?? consultation;
    const nextBreakdown = calculatePrice(nextConsultation, shopPricing);

    setChecklist((prev) => ({
      ...prev,
      shape: (nextConsultation.nailShape ?? null) as NailShape | null,
    }));
    setBasePrice(record?.pricingAdjustments?.basePrice ?? nextBreakdown.subtotal);
    setExtras(hydratePricingExtras(record?.pricingAdjustments?.extras));
    setDiscountType(nextConsultation.discount?.type ?? 'fixed');
    setDiscountValue(nextConsultation.discount?.value ?? 0);
    setDepositAmount(nextConsultation.deposit ?? 0);
    setIsPriceFinalized(Boolean(record?.finalizedAt));
  }, [consultation, record, shopPricing]);

  // Build canvas selections for read-only display from canvasData
  const buildSelections = (handSide: 'left_hand' | 'right_hand'): Partial<Record<FingerPosition, FingerSelection>> => {
    const hand = consultation.canvasData?.find(d => d.handSide === handSide);
    if (!hand) return {};
    const sels: Partial<Record<FingerPosition, FingerSelection>> = {};
    for (const art of hand.fingerArts) {
      const finger = art.fingerId.replace(`${handSide}_`, '') as FingerPosition;
      sels[finger] = {
        finger,
        colorCode: art.colorCode,
        isPoint: art.isPoint ?? false,
        artType: art.artType as FingerSelection['artType'],
        note: art.note,
        memo: art.memo,
        parts: [],
      };
    }
    for (const part of hand.fingerParts) {
      const finger = part.fingerId.replace(`${handSide}_`, '') as FingerPosition;
      if (sels[finger]) {
        sels[finger]!.parts = Array.from({ length: part.quantity }, (_, i) => ({
          id: `${part.fingerId}-${part.partGrade}-${i}`,
          partType: 'other' as const,
          grade: part.partGrade,
          x: 0.3 + i * 0.1,
          y: 0.5,
        }));
      }
    }
    return sels;
  };

  const handleSaveSmallTalk = () => {
    if (!smallTalkText.trim()) return;

    const { customers, appendSmallTalkNote } = useCustomerStore.getState();
    const customer = customers.find(c => c.name === consultationData.customerName);
    if (customer) {
      const newNote = {
        id: `stn-${Date.now()}`,
        customerId: customer.id,
        consultationRecordId: undefined,
        noteText: smallTalkText.trim(),
        createdAt: getNowInKoreaIso(),
        createdByDesignerId: activeDesignerId ?? designer?.id ?? 'unknown',
        createdByDesignerName: activeDesignerName ?? designer?.name ?? '디자이너',
      };
      appendSmallTalkNote(customer.id, newNote);
    }

    setIsSaved(true);
    setSmallTalkText('');
  };

  const handleComplete = async () => {
    setIsFinalSaving(true);

    // Save small talk memo if present
    if (smallTalkText.trim()) {
      handleSaveSmallTalk();
    }

    await new Promise((r) => setTimeout(r, 400));
    router.replace('/home');
    setTimeout(() => {
      reset();
    }, 0);
  };

  const handleAddExtra = () => {
    setExtras(prev => [...prev, { id: `extra-${Date.now()}`, label: '', amount: 0 }]);
  };

  const handleUpdateExtra = (id: string, field: 'label' | 'amount', value: string | number) => {
    setExtras(prev =>
      prev.map(e => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  const handleRemoveExtra = (id: string) => {
    setExtras(prev => prev.filter(e => e.id !== id));
  };

  const handleFinalizePrice = async () => {
    if (!consultationId || basePrice <= 0) return;

    setIsFinalizing(true);

      const validExtras = extras.filter(e => e.label.trim() && e.amount > 0);
      const updatedConsultation = {
        ...consultationData,
        discount: appliedDiscount,
        deposit: depositAmount,
      };

      await new Promise((r) => setTimeout(r, 300));

      updateRecord(consultationId, {
        consultation: updatedConsultation,
        finalPrice: calculatedFinalPrice,
        finalizedAt: getNowInKoreaIso(),
        pricingAdjustments: {
          basePrice,
          extras: validExtras.map(({ label, amount }) => ({ label: label.trim(), amount })),
          finalPrice: calculatedFinalPrice,
          discountAmount: discountAmount ?? 0,
      },
    });

    setIsPriceFinalized(true);
    setIsFinalizing(false);
  };

  const hasCanvas = consultationData.canvasData && consultationData.canvasData.length > 0;
  const hasReferenceImages = consultationData.referenceImages && consultationData.referenceImages.length > 0;

  const lengthLabels: Record<LengthType, string> = {
    short: t('consultation.treatmentSheet.lengthShort'),
    medium: t('consultation.treatmentSheet.lengthMedium'),
    long: t('consultation.treatmentSheet.lengthLong'),
  };
  const thicknessLabels: Record<ThicknessType, string> = {
    thin: t('consultation.treatmentSheet.thicknessThin'),
    medium: t('consultation.treatmentSheet.thicknessMedium'),
    thick: t('consultation.treatmentSheet.thicknessThick'),
  };
  const cuticleLabels: Record<CuticleType, string> = {
    low: t('consultation.treatmentSheet.cuticleLow'),
    medium: t('consultation.treatmentSheet.cuticleMedium'),
    high: t('consultation.treatmentSheet.cuticleHigh'),
  };

  const quickAddPresets = [
    { labelKey: 'consultation.treatmentSheet.quickAddParts', amount: 2000 },
    { labelKey: 'consultation.treatmentSheet.quickAddGlitter', amount: 3000 },
    { labelKey: 'consultation.treatmentSheet.quickAddPoint', amount: 5000 },
    { labelKey: 'consultation.treatmentSheet.quickAddExtension', amount: 10000 },
    { labelKey: 'consultation.treatmentSheet.quickAddOther', amount: 0 },
  ] as const;

  const getDesignLabel = () => {
    if (consultationData.designScope === 'solid_tone') return t('consultation.treatmentSheet.designSolidTone');
    if (consultationData.designScope === 'solid_point') return t('consultation.treatmentSheet.designSolidPoint');
    if (consultationData.designScope === 'full_art') return t('consultation.treatmentSheet.designFullArt');
    return t('consultation.treatmentSheet.designMonthlyArt');
  };

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <h1 className="text-xl font-bold text-text">
          {t('consultation.treatmentSheet.title')}
        </h1>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60">{tKo('consultation.treatmentSheet.title')}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-sm text-text-secondary">
            {consultationData.customerName || t('consultation.treatmentSheet.customer')}
          </span>
          <span className="text-text-muted">·</span>
          <span className="text-sm text-text-muted">{today}</span>
          {designer && (
            <>
              <span className="text-text-muted">·</span>
              <span className="text-sm text-text-muted">{designer.name}</span>
            </>
          )}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-5 flex flex-col gap-5 max-w-2xl md:max-w-4xl mx-auto w-full">
        {/* Checklist Summary */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-sm font-bold text-text mb-3">
            {t('consultation.treatmentSheet.checklistSection')}
            {locale !== 'ko' && (
              <span className="ml-1.5 text-xs font-normal text-text-muted opacity-60">{tKo('consultation.treatmentSheet.checklistSection')}</span>
            )}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {consultationData.nailShape && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-text-muted">
                  {t('consultation.treatmentSheet.shapeLabel')}
                </span>
                <span className="text-sm font-semibold text-text">{consultationData.nailShape}</span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-text-muted">
                {t('consultation.treatmentSheet.bodyPartLabel')}
              </span>
              <span className="text-sm font-semibold text-text">
                {consultationData.bodyPart === 'hand'
                  ? t('consultation.treatmentSheet.bodyPartHand')
                  : t('consultation.treatmentSheet.bodyPartFoot')}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-text-muted">
                {t('consultation.treatmentSheet.designLabel')}
              </span>
              <span className="text-sm font-semibold text-text">
                {getDesignLabel()}
              </span>
            </div>
            {consultationData.offType !== 'none' && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-text-muted">
                  {t('consultation.treatmentSheet.offLabel')}
                </span>
                <span className="text-sm font-semibold text-text">
                  {consultationData.offType === 'same_shop'
                    ? t('consultation.treatmentSheet.offSameShop')
                    : t('consultation.treatmentSheet.offOtherShop')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Daily Checklist - 당일 시술 체크 */}
        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-text mb-0.5">
              {t('consultation.treatmentSheet.dailyCheckSection')}
              {locale !== 'ko' && (
                <span className="ml-1.5 text-xs font-normal text-text-muted opacity-60">{tKo('consultation.treatmentSheet.dailyCheckSection')}</span>
              )}
            </h3>
            <p className="text-xs text-text-muted">{t('consultation.treatmentSheet.dailyCheckDesc')}</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">
                {t('consultation.treatmentSheet.lengthLabel')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-xs font-normal text-text-muted opacity-60">{tKo('consultation.treatmentSheet.lengthLabel')}</span>
                )}
              </span>
              <SegmentControl<LengthType>
                options={['short', 'medium', 'long']}
                value={checklist.length}
                onChange={(v) => setChecklist(prev => ({ ...prev, length: v }))}
                labels={lengthLabels}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">
                {t('consultation.treatmentSheet.thicknessLabel')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-xs font-normal text-text-muted opacity-60">{tKo('consultation.treatmentSheet.thicknessLabel')}</span>
                )}
              </span>
              <SegmentControl<ThicknessType>
                options={['thin', 'medium', 'thick']}
                value={checklist.thickness}
                onChange={(v) => setChecklist(prev => ({ ...prev, thickness: v }))}
                labels={thicknessLabels}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">
                {t('consultation.treatmentSheet.cuticleLabel')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-xs font-normal text-text-muted opacity-60">{tKo('consultation.treatmentSheet.cuticleLabel')}</span>
                )}
              </span>
              <SegmentControl<CuticleType>
                options={['low', 'medium', 'high']}
                value={checklist.cuticleSensitivity}
                onChange={(v) => setChecklist(prev => ({ ...prev, cuticleSensitivity: v }))}
                labels={cuticleLabels}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">
                {t('consultation.treatmentSheet.memoLabel')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-xs font-normal text-text-muted opacity-60">{tKo('consultation.treatmentSheet.memoLabel')}</span>
                )}
              </span>
              <textarea
                value={checklist.memo}
                onChange={(e) => setChecklist(prev => ({ ...prev, memo: e.target.value }))}
                placeholder={t('consultation.treatmentSheet.memoPlaceholder')}
                rows={2}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
            </div>
          </div>
        </div>

        {/* Reference Images */}
        {hasReferenceImages && (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="text-sm font-bold text-text mb-3">
              {t('consultation.treatmentSheet.referenceImages')}
              {locale !== 'ko' && (
                <span className="ml-1.5 text-xs font-normal text-text-muted opacity-60">{tKo('consultation.treatmentSheet.referenceImages')}</span>
              )}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {consultationData.referenceImages?.map((url, i) => (
                <div key={i} className="relative rounded-xl overflow-hidden border border-border aspect-square">
                  <Image src={url} alt="" fill unoptimized className="object-contain" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas - Read only */}
        {hasCanvas && (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="text-sm font-bold text-text mb-3">
              {t('consultation.treatmentSheet.nailDesign')}
              {locale !== 'ko' && (
                <span className="ml-1.5 text-xs font-normal text-text-muted opacity-60">{tKo('consultation.treatmentSheet.nailDesign')}</span>
              )}
            </h3>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs text-text-muted text-center mb-2">
                  {t('consultation.treatmentSheet.leftHand')}
                </p>
                <HandIllustration
                  hand="left"
                  selections={buildSelections('left_hand')}
                  onFingerTap={() => {}}
                />
              </div>
              <div>
                <p className="text-xs text-text-muted text-center mb-2">
                  {t('consultation.treatmentSheet.rightHand')}
                </p>
                <HandIllustration
                  hand="right"
                  selections={buildSelections('right_hand')}
                  onFingerTap={() => {}}
                />
              </div>
            </div>
          </div>
        )}

        {/* Price & Time Summary */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-sm font-bold text-text mb-3">
            {t('consultation.treatmentSheet.serviceBreakdown')}
            {locale !== 'ko' && (
              <span className="ml-1.5 text-xs font-normal text-text-muted opacity-60">{tKo('consultation.treatmentSheet.serviceBreakdown')}</span>
            )}
          </h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">{t('consultation.treatmentSheet.baseAmount')}</span>
              <span className="text-lg font-bold text-primary">{formatPrice(basePrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">{t('consultation.treatmentSheet.estimatedTime')}</span>
              <span className="text-sm font-semibold text-text">{estimatedMinutes}{t('consultation.treatmentSheet.minutes')}</span>
            </div>
            {extrasSum > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">{t('consultation.treatmentSheet.additionalItems')}</span>
                <span className="text-sm font-semibold text-primary">+{formatPrice(extrasSum)}</span>
              </div>
            )}
            {appliedDiscount && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">{t('consultation.treatmentSheet.discount')}</span>
                <span className="text-sm font-semibold text-error">
                  -{appliedDiscount.type === 'percent' ? `${appliedDiscount.value}%` : formatPrice(appliedDiscount.value)}
                </span>
              </div>
            )}
            {depositAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">{t('consultation.treatmentSheet.deposit')}</span>
                <span className="text-sm font-semibold text-text-secondary">-{formatPrice(depositAmount)}</span>
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm font-bold text-text">{t('consultation.treatmentSheet.finalPayment')}</span>
              <span className="text-lg font-bold text-text">{formatPrice(calculatedFinalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Price Finalization Editor */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text">
              {t('consultation.treatmentSheet.priceFinalization')}
              {locale !== 'ko' && (
                <span className="ml-1.5 text-xs font-normal text-text-muted opacity-60">{tKo('consultation.treatmentSheet.priceFinalization')}</span>
              )}
            </h3>
            {isPriceFinalized && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t('consultation.treatmentSheet.priceFinalized')}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-secondary">{t('consultation.treatmentSheet.basePriceLabel')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted">₩</span>
                <input
                  type="number"
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  disabled={isPriceFinalized}
                  className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-2.5 text-sm text-text text-right font-semibold placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:bg-surface-alt"
                />
              </div>
            </div>

             <div className="flex flex-col gap-2">
               <div className="flex items-center justify-between">
                 <span className="text-sm font-semibold text-text-secondary">{t('consultation.treatmentSheet.additionalItemsLabel')}</span>
                {!isPriceFinalized && (
                  <button
                    type="button"
                    onClick={handleAddExtra}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    {t('consultation.treatmentSheet.addExtraBtn')}
                  </button>
                )}
              </div>

              {!isPriceFinalized && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                  {quickAddPresets.map((preset) => {
                    const presetLabel = t(preset.labelKey);
                    return (
                      <button
                        key={preset.labelKey}
                        type="button"
                        onClick={() => {
                          setExtras(prev => [...prev, {
                            id: `extra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                            label: preset.amount === 0 ? '' : presetLabel,
                            amount: preset.amount,
                          }]);
                        }}
                        className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-alt text-text-secondary border border-border hover:border-primary/40 hover:text-primary transition-all active:scale-[0.97]"
                      >
                        {presetLabel}
                        {preset.amount > 0 && (
                          <span className="ml-1 text-primary">+{(preset.amount / 1000).toFixed(0)}k</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {extras.length === 0 && !isPriceFinalized && (
                <p className="text-xs text-text-muted py-2">{t('consultation.treatmentSheet.extraEmptyHint')}</p>
              )}

              {extras.map((extra) => (
                <div key={extra.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={extra.label}
                    onChange={(e) => handleUpdateExtra(extra.id, 'label', e.target.value)}
                    placeholder={t('consultation.treatmentSheet.itemNamePlaceholder')}
                    disabled={isPriceFinalized}
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:bg-surface-alt"
                  />
                  <div className="relative w-28">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-text-muted">₩</span>
                    <input
                      type="number"
                      value={extra.amount}
                      min={0}
                      onChange={(e) => handleUpdateExtra(extra.id, 'amount', Math.max(0, Number(e.target.value)))}
                      placeholder="0"
                      disabled={isPriceFinalized}
                      className="w-full rounded-xl border border-border bg-background pl-6 pr-2 py-2 text-sm text-text text-right font-medium placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:bg-surface-alt"
                    />
                  </div>
                  {!isPriceFinalized && (
                    <button
                      type="button"
                      onClick={() => handleRemoveExtra(extra.id)}
                      className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border bg-surface-alt/60 p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-text">{t('consultation.treatmentSheet.discountDeposit')}</span>
                {(appliedDiscount || depositAmount > 0) && !isPriceFinalized && (
                  <button
                    type="button"
                    onClick={() => {
                      setDiscountType('fixed');
                      setDiscountValue(0);
                      setDepositAmount(0);
                    }}
                    className="text-xs font-semibold text-text-muted hover:text-text"
                  >
                    {t('consultation.treatmentSheet.reset')}
                  </button>
                )}
              </div>

              <div className="flex gap-1 rounded-xl bg-background p-1">
                {(['fixed', 'percent'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    disabled={isPriceFinalized}
                    onClick={() => {
                      setDiscountType(type);
                      setDiscountValue(0);
                    }}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${
                      discountType === type
                        ? 'bg-surface text-primary shadow-sm'
                        : 'text-text-muted'
                    }`}
                  >
                    {type === 'fixed'
                      ? t('consultation.treatmentSheet.discountFixed')
                      : t('consultation.treatmentSheet.discountPercent')}
                  </button>
                ))}
              </div>

              <NumberPresetPicker
                label={discountType === 'fixed'
                  ? t('consultation.treatmentSheet.discountAmountLabel')
                  : t('consultation.treatmentSheet.discountRateLabel')}
                values={discountType === 'fixed' ? FIXED_DISCOUNT_PRESETS : PERCENT_DISCOUNT_PRESETS}
                selectedValue={discountValue}
                onSelect={setDiscountValue}
                formatter={(value) => discountType === 'fixed' ? formatPrice(value) : `${value}%`}
              />

              <StepValueControl
                label={discountType === 'fixed'
                  ? t('consultation.treatmentSheet.discountDetailFixed')
                  : t('consultation.treatmentSheet.discountDetailPercent')}
                value={discountValue}
                step={discountType === 'fixed' ? 1000 : 1}
                min={0}
                max={discountType === 'fixed' ? undefined : 100}
                onChange={setDiscountValue}
                formatter={(value) => discountType === 'fixed' ? formatPrice(value) : `${value}%`}
              />

              <NumberPresetPicker
                label={t('consultation.treatmentSheet.depositLabel')}
                values={DEPOSIT_PRESETS}
                selectedValue={depositAmount}
                onSelect={setDepositAmount}
                formatter={(value) => value === 0 ? t('consultation.treatmentSheet.depositNone') : formatPrice(value)}
              />

              <StepValueControl
                label={t('consultation.treatmentSheet.depositDetailLabel')}
                value={depositAmount}
                step={5000}
                min={0}
                onChange={setDepositAmount}
                formatter={(value) => value === 0 ? t('consultation.treatmentSheet.depositNone') : formatPrice(value)}
              />
            </div>

            <div className="mt-2 pt-3 border-t border-border">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-text">{t('consultation.treatmentSheet.finalAmount')}</span>
                <span
                  className="text-xl font-bold"
                  style={{ color: calculatedFinalPrice >= 0 ? 'var(--color-primary)' : 'var(--color-error, #ef4444)' }}
                >
                  {formatPrice(calculatedFinalPrice)}
                </span>
              </div>

              {extras.length > 0 && (
                <div className="text-xs text-text-muted mb-3">
                  {t('consultation.treatmentSheet.basePrefix')}{formatPriceNumber(basePrice)}{t('consultation.treatmentSheet.won')}
                  {extrasSum !== 0 && (
                    <span className={extrasSum > 0 ? 'text-primary' : 'text-error'}>
                      {extrasSum > 0 ? ` + ${formatPriceNumber(extrasSum)}` : ` - ${formatPriceNumber(Math.abs(extrasSum))}`}{t('consultation.treatmentSheet.won')}
                    </span>
                  )}
                  {discountAmount > 0 && (
                    <span className="text-error">{t('consultation.treatmentSheet.discountPrefix')}{formatPriceNumber(discountAmount)}{t('consultation.treatmentSheet.won')}</span>
                  )}
                  {depositAmount > 0 && (
                    <span className="text-text-secondary">{t('consultation.treatmentSheet.depositPrefix')}{formatPriceNumber(depositAmount)}{t('consultation.treatmentSheet.won')}</span>
                  )}
                </div>
              )}

              {!isPriceFinalized ? (
                <button
                  type="button"
                  onClick={handleFinalizePrice}
                  disabled={isFinalizing || basePrice <= 0 || !consultationId}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{ background: 'var(--color-primary)' }}
                >
                  {isFinalizing
                    ? t('consultation.treatmentSheet.finalizingPrice')
                    : t('consultation.treatmentSheet.finalizeBtn')}
                </button>
              ) : (
                <div
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-1.5"
                  style={{ background: 'color-mix(in srgb, var(--color-success) 12%, var(--color-surface))', color: 'var(--color-success)' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {t('consultation.treatmentSheet.priceConfirmed')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Small Talk Memo */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-sm font-bold text-text mb-1">
            {t('consultation.treatmentSheet.customerMemo')}
            {locale !== 'ko' && (
              <span className="ml-1.5 text-xs font-normal text-text-muted opacity-60">{tKo('consultation.treatmentSheet.customerMemo')}</span>
            )}
          </h3>
          <p className="text-[11px] text-text-muted mb-3">{t('consultation.treatmentSheet.customerMemoDesc')}</p>

          {isSaved && (
            <div
              className="mb-3 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5"
              style={{ background: 'color-mix(in srgb, var(--color-success) 12%, var(--color-surface))', color: 'var(--color-success)' }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('consultation.treatmentSheet.memoSaved')}
            </div>
          )}

          <textarea
            value={smallTalkText}
            onChange={(e) => setSmallTalkText(e.target.value)}
            placeholder={t('consultation.treatmentSheet.smallTalkPlaceholder')}
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />

          <button
            onClick={handleSaveSmallTalk}
            disabled={!smallTalkText.trim()}
            className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              background: smallTalkText.trim() ? 'var(--color-primary)' : 'var(--color-border)',
              color: smallTalkText.trim() ? 'white' : 'var(--color-text-muted)',
            }}
          >
            {t('consultation.treatmentSheet.saveMemo')}
          </button>
        </div>
      </main>

      {/* Footer */}
      <div className="sticky bottom-0 px-4 py-4 border-t border-border bg-background flex flex-col gap-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        {isPriceFinalized && (
          <button
            type="button"
            onClick={() => router.push(`/payment?recordId=${consultationId}`)}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            style={{ background: 'var(--color-success, #16a34a)' }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            {t('consultation.treatmentSheet.pay')} · {formatPrice(calculatedFinalPrice)}
          </button>
        )}
        <button
          onClick={handleComplete}
          disabled={isFinalSaving || !isPriceFinalized}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'var(--color-primary)' }}
        >
          {isFinalSaving
            ? t('consultation.treatmentSheet.saving')
            : t('consultation.treatmentSheet.saveComplete')}
        </button>
      </div>
    </div>
  );
}
