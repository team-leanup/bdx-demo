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

const SHAPE_LABELS: Record<string, string> = {
  round: '라운드', oval: '오벌', square: '스퀘어', squoval: '스퀘오벌',
  almond: '아몬드', stiletto: '스틸레토', coffin: '코핀',
};

const LENGTH_LABELS = { short: '짧게', medium: '보통', long: '길게' };
const THICKNESS_LABELS = { thin: '얇게', medium: '보통', thick: '두껍게' };
const CUTICLE_LABELS = { low: '예민하지 않음', medium: '보통', high: '예민함' };

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

const QUICK_ADD_PRESETS = [
  { label: '파츠', amount: 2000 },
  { label: '글리터', amount: 3000 },
  { label: '포인트', amount: 5000 },
  { label: '연장 추가', amount: 10000 },
  { label: '기타', amount: 0 },
] as const;

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
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-lg font-bold text-text transition-colors disabled:opacity-40"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => updateValue(value + step)}
          disabled={!canIncrease}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-lg font-bold text-text transition-colors disabled:opacity-40"
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
  }, [consultation, record]);

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

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 border-b border-border">
        <h1 className="text-xl font-bold text-text">시술 확인서</h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-sm text-text-secondary">{consultationData.customerName || '고객'}</span>
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
          <h3 className="text-sm font-bold text-text mb-3">체크리스트</h3>
          <div className="grid grid-cols-2 gap-3">
            {consultationData.nailShape && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-text-muted">쉐입</span>
                <span className="text-sm font-semibold text-text">{SHAPE_LABELS[consultationData.nailShape] || consultationData.nailShape}</span>
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-text-muted">신체 부위</span>
              <span className="text-sm font-semibold text-text">{consultationData.bodyPart === 'hand' ? '핸드' : '페디큐어'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-text-muted">디자인</span>
              <span className="text-sm font-semibold text-text">
                {consultationData.designScope === 'solid_tone' ? '원컬러'
                  : consultationData.designScope === 'solid_point' ? '단색+포인트'
                  : consultationData.designScope === 'full_art' ? '풀아트'
                  : '이달의 아트'}
              </span>
            </div>
            {consultationData.offType !== 'none' && (
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] text-text-muted">오프</span>
                <span className="text-sm font-semibold text-text">
                  {consultationData.offType === 'same_shop' ? '자샵오프' : '타샵오프'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Daily Checklist - 당일 시술 체크 */}
        <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold text-text mb-0.5">당일 시술 체크</h3>
            <p className="text-xs text-text-muted">시술 시작 전 고객 상태를 확인해주세요</p>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">길이</span>
              <SegmentControl<LengthType>
                options={['short', 'medium', 'long']}
                value={checklist.length}
                onChange={(v) => setChecklist(prev => ({ ...prev, length: v }))}
                labels={LENGTH_LABELS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">두께감</span>
              <SegmentControl<ThicknessType>
                options={['thin', 'medium', 'thick']}
                value={checklist.thickness}
                onChange={(v) => setChecklist(prev => ({ ...prev, thickness: v }))}
                labels={THICKNESS_LABELS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">큐티클 상태</span>
              <SegmentControl<CuticleType>
                options={['low', 'medium', 'high']}
                value={checklist.cuticleSensitivity}
                onChange={(v) => setChecklist(prev => ({ ...prev, cuticleSensitivity: v }))}
                labels={CUTICLE_LABELS}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-text-secondary">메모</span>
              <textarea
                value={checklist.memo}
                onChange={(e) => setChecklist(prev => ({ ...prev, memo: e.target.value }))}
                placeholder="특이사항 메모 (ex. 손톱이 얇음, 큐티클 주의)"
                rows={2}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
            </div>
          </div>
        </div>

        {/* Reference Images */}
        {hasReferenceImages && (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <h3 className="text-sm font-bold text-text mb-3">참고 이미지</h3>
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
            <h3 className="text-sm font-bold text-text mb-3">네일 디자인</h3>
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-xs text-text-muted text-center mb-2">왼손</p>
                <HandIllustration
                  hand="left"
                  selections={buildSelections('left_hand')}
                  onFingerTap={() => {}}
                />
              </div>
              <div>
                <p className="text-xs text-text-muted text-center mb-2">오른손</p>
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
          <h3 className="text-sm font-bold text-text mb-3">시술 내역</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">기본 금액</span>
              <span className="text-lg font-bold text-primary">{formatPrice(basePrice)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">예상 소요 시간</span>
              <span className="text-sm font-semibold text-text">{estimatedMinutes}분</span>
            </div>
            {extrasSum > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">추가 항목</span>
                <span className="text-sm font-semibold text-primary">+{formatPrice(extrasSum)}</span>
              </div>
            )}
            {appliedDiscount && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">할인</span>
                <span className="text-sm font-semibold text-error">
                  -{appliedDiscount.type === 'percent' ? `${appliedDiscount.value}%` : formatPrice(appliedDiscount.value)}
                </span>
              </div>
            )}
            {depositAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-secondary">예약금</span>
                <span className="text-sm font-semibold text-text-secondary">-{formatPrice(depositAmount)}</span>
              </div>
            )}
            <div className="mt-2 pt-2 border-t border-border flex justify-between items-center">
              <span className="text-sm font-bold text-text">최종 결제</span>
              <span className="text-lg font-bold text-text">{formatPrice(calculatedFinalPrice)}</span>
            </div>
          </div>
        </div>

        {/* Price Finalization Editor */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-text">가격 확정</h3>
            {isPriceFinalized && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                확정됨
              </span>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-text-secondary">기본 금액</label>
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
                 <span className="text-sm font-semibold text-text-secondary">추가 항목</span>
                {!isPriceFinalized && (
                  <button
                    type="button"
                    onClick={handleAddExtra}
                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    추가 항목 추가
                  </button>
                )}
              </div>

              {!isPriceFinalized && (
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                  {QUICK_ADD_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setExtras(prev => [...prev, {
                          id: `extra-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                          label: preset.label === '기타' ? '' : preset.label,
                          amount: preset.amount,
                        }]);
                      }}
                      className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-alt text-text-secondary border border-border hover:border-primary/40 hover:text-primary transition-all active:scale-[0.97]"
                    >
                      {preset.label}
                      {preset.amount > 0 && (
                        <span className="ml-1 text-primary">+{(preset.amount / 1000).toFixed(0)}k</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {extras.length === 0 && !isPriceFinalized && (
                <p className="text-xs text-text-muted py-2">추가 비용이 있으면 항목으로 더해주세요</p>
              )}

              {extras.map((extra) => (
                <div key={extra.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={extra.label}
                    onChange={(e) => handleUpdateExtra(extra.id, 'label', e.target.value)}
                    placeholder="항목명"
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
                <span className="text-sm font-bold text-text">할인/예약금 적용</span>
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
                    초기화
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
                    {type === 'fixed' ? '정액 할인' : '할인율'}
                  </button>
                ))}
              </div>

              <NumberPresetPicker
                label={discountType === 'fixed' ? '할인 금액 선택' : '할인율 선택'}
                values={discountType === 'fixed' ? FIXED_DISCOUNT_PRESETS : PERCENT_DISCOUNT_PRESETS}
                selectedValue={discountValue}
                onSelect={setDiscountValue}
                formatter={(value) => discountType === 'fixed' ? formatPrice(value) : `${value}%`}
              />

              <StepValueControl
                label={discountType === 'fixed' ? '세부 할인 조정' : '세부 할인율 조정'}
                value={discountValue}
                step={discountType === 'fixed' ? 1000 : 1}
                min={0}
                max={discountType === 'fixed' ? undefined : 100}
                onChange={setDiscountValue}
                formatter={(value) => discountType === 'fixed' ? formatPrice(value) : `${value}%`}
              />

              <NumberPresetPicker
                label="예약금 선택"
                values={DEPOSIT_PRESETS}
                selectedValue={depositAmount}
                onSelect={setDepositAmount}
                formatter={(value) => value === 0 ? '없음' : formatPrice(value)}
              />

              <StepValueControl
                label="예약금 세부 조정"
                value={depositAmount}
                step={5000}
                min={0}
                onChange={setDepositAmount}
                formatter={(value) => value === 0 ? '없음' : formatPrice(value)}
              />
            </div>

            <div className="mt-2 pt-3 border-t border-border">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-bold text-text">확정 금액</span>
                <span
                  className="text-xl font-bold"
                  style={{ color: calculatedFinalPrice >= 0 ? 'var(--color-primary)' : 'var(--color-error, #ef4444)' }}
                >
                  {formatPrice(calculatedFinalPrice)}
                </span>
              </div>

              {extras.length > 0 && (
                <div className="text-xs text-text-muted mb-3">
                  기본 {formatPriceNumber(basePrice)}원
                  {extrasSum !== 0 && (
                    <span className={extrasSum > 0 ? 'text-primary' : 'text-error'}>
                      {extrasSum > 0 ? ` + ${formatPriceNumber(extrasSum)}` : ` - ${formatPriceNumber(Math.abs(extrasSum))}`}원
                    </span>
                  )}
                  {discountAmount > 0 && (
                    <span className="text-error"> - 할인 {formatPriceNumber(discountAmount)}원</span>
                  )}
                  {depositAmount > 0 && (
                    <span className="text-text-secondary"> - 예약금 {formatPriceNumber(depositAmount)}원</span>
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
                  {isFinalizing ? '확정 중...' : '가격 확정'}
                </button>
              ) : (
                <div
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-1.5"
                  style={{ background: 'color-mix(in srgb, var(--color-success) 12%, var(--color-surface))', color: 'var(--color-success)' }}
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  가격이 확정되었습니다
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Small Talk Memo */}
        <div className="rounded-2xl border border-border bg-surface p-4">
          <h3 className="text-sm font-bold text-text mb-1">고객 메모</h3>
          <p className="text-[11px] text-text-muted mb-3">고객과 나눈 이야기를 기록해두면 다음 방문 때 활용할 수 있어요</p>

          {isSaved && (
            <div
              className="mb-3 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1.5"
              style={{ background: 'color-mix(in srgb, var(--color-success) 12%, var(--color-surface))', color: 'var(--color-success)' }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              저장됐어요
            </div>
          )}

          <textarea
            value={smallTalkText}
            onChange={(e) => setSmallTalkText(e.target.value)}
            placeholder="고객과 나눈 이야기를 메모해두세요 (취미, 관심사 등)"
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
            메모 저장
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
            결제하기 · {formatPrice(calculatedFinalPrice)}
          </button>
        )}
        <button
          onClick={handleComplete}
          disabled={isFinalSaving || !isPriceFinalized}
          className="w-full py-3.5 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
          style={{ background: 'var(--color-primary)' }}
        >
          {isFinalSaving ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
