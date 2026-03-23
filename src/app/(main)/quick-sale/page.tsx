'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QuickSaleForm } from '@/components/payment/QuickSaleForm';
import { useRecordsStore } from '@/store/records-store';
import { useAuthStore } from '@/store/auth-store';
import type { PaymentMethod } from '@/types/consultation';

interface QuickSaleSubmitData {
  customerId?: string;
  customerQuery: string;
  serviceType: string;
  amount: number;
  paymentMethod: PaymentMethod;
  designerId: string;
  memo: string;
}

function QuickSaleContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCustomerId = searchParams.get('customerId') ?? undefined;

  const addQuickSaleRecord = useRecordsStore((s) => s.addQuickSaleRecord);
  const { currentShopId, activeDesignerId } = useAuthStore();

  const handleSubmit = (data: QuickSaleSubmitData): void => {
    addQuickSaleRecord({
      id: `qs-${Date.now()}`,
      shopId: currentShopId ?? 'shop-1',
      designerId: data.designerId || activeDesignerId || 'designer-1',
      customerId: data.customerId ?? '',
      finalPrice: data.amount,
      notes: data.memo || undefined,
    }).catch(console.error);
    router.push('/records');
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="px-4 pt-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-text-secondary"
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
