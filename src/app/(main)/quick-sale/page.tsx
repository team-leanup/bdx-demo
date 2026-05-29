'use client';

import { Suspense, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QuickSaleForm } from '@/components/payment/QuickSaleForm';
import { ToastContainer } from '@/components/ui';
import type { ToastData } from '@/components/ui';
import { useRecordsStore } from '@/store/records-store';
import { useReservationStore } from '@/store/reservation-store';
import { useAuthStore } from '@/store/auth-store';
import { useCustomerStore } from '@/store/customer-store';
import { getRemainingAmount, canUseMembership as canUseMembershipFn } from '@/lib/membership';
import type { PaymentMethod } from '@/types/consultation';

interface QuickSaleSubmitData {
  customerId?: string;
  customerName: string;
  customerQuery: string;
  customerPhone?: string;
  serviceType: string;
  amount: number;
  paymentMethod: PaymentMethod;
  designerId: string;
  memo: string;
  saleDate: string;
  saleTime: string;
}

function QuickSaleContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') ?? undefined;
  const initialCustomerName = searchParams.get('customerName') ?? undefined;
  const bookingId = searchParams.get('bookingId') ?? undefined;

  const addQuickSaleRecord = useRecordsStore((s) => s.addQuickSaleRecord);
  const updateReservation = useReservationStore((s) => s.updateReservation);
  const { currentShopId, activeDesignerId } = useAuthStore();
  const customers = useCustomerStore((s) => s.customers);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const submittingRef = useRef(false);

  const pushToast = (type: ToastData['type'], message: string): void => {
    setToasts((prev) => [...prev, { id: `t-${Date.now()}`, type, message }]);
  };

  const handleSubmit = (data: QuickSaleSubmitData): void => {
    if (submittingRef.current) return;
    submittingRef.current = true;

    // [SALES-1] 회원권 결제 시 차감에 필요한 정보 사전 계산
    const isMembershipPayment = data.paymentMethod === 'membership';
    const payingCustomer = data.customerId
      ? customers.find((c) => c.id === data.customerId)
      : undefined;
    const customerMembership = payingCustomer?.membership;
    const membershipValid = isMembershipPayment && !!payingCustomer && canUseMembershipFn(customerMembership);
    const membershipRemainingBefore = membershipValid && customerMembership
      ? getRemainingAmount(customerMembership)
      : 0;
    // 잔액이 시술금보다 크면 전액 차감, 아니면 잔액만큼만 (차액은 현금/카드)
    const membershipApplied = membershipValid
      ? Math.max(0, Math.min(membershipRemainingBefore, data.amount))
      : 0;
    const recordId = `qs-${Date.now()}`;

    addQuickSaleRecord({
      id: recordId,
      shopId: currentShopId ?? '',
      designerId: data.designerId || activeDesignerId || '',
      customerId: data.customerId || undefined,
      customerName: data.customerName || undefined,
      customerPhone: data.customerPhone,
      serviceType: data.serviceType || undefined,
      finalPrice: data.amount,
      notes: data.memo || undefined,
      paymentMethod: data.paymentMethod,
      // [SALES-1] 회원권 차감액 저장 — totalSpend 정합
      membershipApplied: membershipApplied > 0 ? membershipApplied : undefined,
      saleDate: data.saleDate,
      saleTime: data.saleTime,
    }).then(() => {
      // [SALES-1] 회원권 잔액 차감 — DB 저장 성공 후에만 실행 (정합성 보장)
      if (membershipValid && data.customerId && membershipApplied > 0) {
        useCustomerStore.getState().useMembershipSession(data.customerId, recordId, membershipApplied);
      }
      if (bookingId) {
        updateReservation(bookingId, { status: 'completed' });
      }
      pushToast('success', '매출이 등록되었어요');
      setTimeout(() => router.push('/records?view=list'), 1200);
    }).catch((err: unknown) => {
      console.error(err);
      pushToast('error', '등록에 실패했어요. 다시 시도해주세요');
    }).finally(() => {
      submittingRef.current = false;
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
      <div className="px-4 pt-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-text-secondary"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text">매출 등록</h1>
      </div>

      <div className="px-4">
        <QuickSaleForm
          initialCustomerId={initialCustomerId}
          initialCustomerName={initialCustomerName}
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
        />
      </div>
    </div>
  );
}

export default function QuickSalePage(): React.ReactElement {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <QuickSaleContent />
    </Suspense>
  );
}
