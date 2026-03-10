'use client';

import { useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Badge, Card, Input, Modal, ToastContainer } from '@/components/ui';
import type { ToastData } from '@/components/ui';
import { PaymentSummary } from '@/components/payment/PaymentSummary';
import { useRecordsStore } from '@/store/records-store';
import { useReservationStore } from '@/store/reservation-store';
import { useCustomerStore } from '@/store/customer-store';
import { calculatePrice } from '@/lib/price-calculator';
import { formatPrice, formatDateDot } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { DiscountConfig } from '@/types/consultation';

interface ExtraItem {
  label: string;
  amount: number;
}

// P-2: 프리셋 할인
const PRESET_DISCOUNTS = [
  { label: '첫 방문 10%', type: 'percent' as const, value: 10 },
  { label: '지인 할인 5,000원', type: 'fixed' as const, value: 5000 },
  { label: '재방문 3,000원', type: 'fixed' as const, value: 3000 },
];

function PaymentContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('recordId');
  const bookingId = searchParams.get('bookingId');

  const getRecordById = useRecordsStore((s) => s.getRecordById);
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  const updateRecord = useRecordsStore((s) => s.updateRecord);
  const reservations = useReservationStore((s) => s.reservations);
  const getCustomerById = useCustomerStore((s) => s.getById);

  // recordId 또는 bookingId로 레코드 찾기
  const record = useMemo(() => {
    if (recordId) return getRecordById(recordId);
    if (bookingId) {
      return getAllRecords().find((r) => r.consultation.bookingId === bookingId);
    }
    return undefined;
  }, [recordId, bookingId, getRecordById, getAllRecords]);

  const customer = record ? getCustomerById(record.customerId) : undefined;

  // P-3: 예약금 자동 로드
  const linkedReservation = useMemo(() => {
    const bId = record?.consultation.bookingId ?? bookingId;
    if (!bId) return undefined;
    return reservations.find((r) => r.id === bId);
  }, [record, bookingId, reservations]);

  // 기존 pricingAdjustments에서 extras 초기값
  const [extraItems, setExtraItems] = useState<ExtraItem[]>(
    record?.pricingAdjustments?.extras ?? [],
  );
  const [discount, setDiscount] = useState<DiscountConfig | undefined>(
    record?.consultation.discount,
  );
  const [showAddExtra, setShowAddExtra] = useState(false);
  const [newExtraLabel, setNewExtraLabel] = useState('');
  const [newExtraAmount, setNewExtraAmount] = useState('');
  const [showDiscountEdit, setShowDiscountEdit] = useState(false);
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>(
    record?.consultation.discount?.type ?? 'fixed',
  );
  const [discountValue, setDiscountValue] = useState(
    String(record?.consultation.discount?.value ?? ''),
  );
  const [completing, setCompleting] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const pushToast = (type: ToastData['type'], message: string): void => {
    setToasts((prev) => [...prev, { id: `t-${Date.now()}`, type, message }]);
  };

  // 가격 계산
  const breakdown = useMemo(() => {
    if (!record) return null;
    const consultation = {
      ...record.consultation,
      discount,
      // P-3: 예약금 자동 반영
      deposit: record.consultation.deposit ?? (linkedReservation?.preConsultationData?.deposit ?? 0),
    };
    return calculatePrice(consultation);
  }, [record, discount, linkedReservation]);

  const handleAddExtra = (): void => {
    const amt = Number(newExtraAmount);
    if (!newExtraLabel.trim() || isNaN(amt) || amt === 0) return;
    setExtraItems((prev) => [...prev, { label: newExtraLabel.trim(), amount: amt }]);
    setNewExtraLabel('');
    setNewExtraAmount('');
    setShowAddExtra(false);
  };

  const handleRemoveExtra = (idx: number): void => {
    setExtraItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleApplyDiscount = (): void => {
    const val = Number(discountValue);
    if (val > 0 && !isNaN(val)) {
      setDiscount({ type: discountType, value: val });
    } else {
      setDiscount(undefined);
    }
    setShowDiscountEdit(false);
  };

  const handleComplete = async (): Promise<void> => {
    if (!record || !breakdown) return;
    setCompleting(true);

    const extrasTotal = extraItems.reduce((s, i) => s + i.amount, 0);
    const grandTotal = Math.max(0, breakdown.finalPrice + extrasTotal);

    updateRecord(record.id, {
      finalPrice: grandTotal,
      finalizedAt: new Date().toISOString(),
      pricingAdjustments: {
        basePrice: breakdown.basePrice,
        extras: extraItems,
        finalPrice: grandTotal,
      },
    });

    pushToast('success', '결제가 완료되었어요');
    setTimeout(() => router.push('/records'), 1200);
    setCompleting(false);
  };

  if (!record || !breakdown) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <p className="text-lg font-semibold text-text">상담 기록을 찾을 수 없습니다</p>
        <p className="mt-1 text-sm text-text-muted">URL에 recordId 또는 bookingId를 확인해주세요</p>
        <Button className="mt-4" onClick={() => router.back()}>뒤로 가기</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-text-secondary"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text">결제</h1>
      </div>

      {/* 고객 정보 카드 */}
      <Card className="mx-4 shadow-md rounded-2xl">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
          >
            {customer?.name.charAt(0) ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-text">{customer?.name ?? '알 수 없음'}</p>
            <p className="text-xs text-text-muted">{formatDateDot(record.createdAt)}</p>
          </div>
          {linkedReservation?.preConsultationData?.deposit != null && linkedReservation.preConsultationData.deposit > 0 && (
            <div className="ml-auto">
              <Badge variant="warning" size="sm">예약금 있음</Badge>
            </div>
          )}
        </div>
      </Card>

      {/* P-1: 가격 요약 카드 */}
      <Card className="mx-4 shadow-md rounded-2xl">
        <h2 className="mb-4 text-sm font-semibold text-text-secondary">가격 내역</h2>
        <PaymentSummary breakdown={breakdown} extraItems={extraItems} />
      </Card>

      {/* P-2: 추가 항목 */}
      <Card className="mx-4 shadow-md rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary">추가 항목</h2>
          <button
            onClick={() => setShowAddExtra((v) => !v)}
            className="text-xs font-semibold text-primary"
          >
            + 추가
          </button>
        </div>

        {extraItems.length === 0 && !showAddExtra && (
          <p className="text-sm text-text-muted">추가 항목 없음</p>
        )}

        {extraItems.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-text">{item.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-text">{item.amount > 0 ? '+' : ''}{formatPrice(item.amount)}</span>
              <button
                onClick={() => handleRemoveExtra(idx)}
                className="text-xs text-error font-medium"
              >
                삭제
              </button>
            </div>
          </div>
        ))}

        {showAddExtra && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 flex flex-col gap-2"
          >
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="항목 이름"
                value={newExtraLabel}
                onChange={(e) => setNewExtraLabel(e.target.value)}
              />
              <Input
                placeholder="금액 (음수 가능)"
                value={newExtraAmount}
                onChange={(e) => setNewExtraAmount(e.target.value)}
                inputMode="numeric"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowAddExtra(false)}>취소</Button>
              <Button variant="primary" size="sm" onClick={handleAddExtra}>추가</Button>
            </div>
          </motion.div>
        )}
      </Card>

      {/* P-2: 할인 */}
      <Card className="mx-4 shadow-md rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary">할인</h2>
          <button
            onClick={() => setShowDiscountEdit((v) => !v)}
            className="text-xs font-semibold text-primary"
          >
            편집
          </button>
        </div>

        {/* 프리셋 할인 버튼 */}
        <div className="flex flex-wrap gap-2 mb-3">
          {PRESET_DISCOUNTS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setDiscount({ type: preset.type, value: preset.value })}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                discount?.type === preset.type && discount?.value === preset.value
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-text-secondary hover:border-primary/40 bg-surface',
              )}
            >
              {preset.label}
            </button>
          ))}
          {discount && (
            <button
              onClick={() => setDiscount(undefined)}
              className="rounded-full border border-error/40 px-3 py-1.5 text-xs font-semibold text-error bg-error/5"
            >
              할인 취소
            </button>
          )}
        </div>

        {discount ? (
          <p className="text-sm text-text-secondary">
            적용됨:{' '}
            <span className="font-semibold text-primary">
              {discount.type === 'percent' ? `${discount.value}%` : formatPrice(discount.value)} 할인
            </span>
          </p>
        ) : (
          <p className="text-sm text-text-muted">할인 없음</p>
        )}

        {showDiscountEdit && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 flex flex-col gap-3"
          >
            <div className="flex gap-1 rounded-xl bg-surface-alt p-1">
              {(['fixed', 'percent'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setDiscountType(t)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-xs font-semibold transition-all',
                    discountType === t ? 'bg-surface text-primary shadow-sm' : 'text-text-muted',
                  )}
                >
                  {t === 'fixed' ? '정액 할인' : '퍼센트 할인'}
                </button>
              ))}
            </div>
            <Input
              type="number"
              placeholder={discountType === 'fixed' ? '할인 금액 (원)' : '할인율 (%)'}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowDiscountEdit(false)}>취소</Button>
              <Button variant="primary" size="sm" onClick={handleApplyDiscount}>적용</Button>
            </div>
          </motion.div>
        )}
      </Card>

      {/* 결제 완료 버튼 */}
      <div className="fixed inset-x-0 bottom-0 bg-surface border-t border-border px-4 pb-6 pt-3 safe-area-inset">
        <Button
          variant="primary"
          fullWidth
          loading={completing}
          disabled={completing}
          className="h-14 text-base font-bold"
          onClick={handleComplete}
        >
          결제 완료
        </Button>
      </div>
    </div>
  );
}

export default function PaymentPage(): React.ReactElement {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PaymentContent />
    </Suspense>
  );
}
