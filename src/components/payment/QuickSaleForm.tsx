'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/cn';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import type { PaymentMethod } from '@/types/consultation';

interface QuickSaleFormValues {
  customerId?: string;
  customerQuery: string;
  serviceType: string;
  amount: string;
  paymentMethod: PaymentMethod | undefined;
  designerId: string;
  memo: string;
}

interface QuickSaleSubmitData {
  customerId?: string;
  customerQuery: string;
  serviceType: string;
  amount: number;
  paymentMethod: PaymentMethod;
  designerId: string;
  memo: string;
}

interface QuickSaleFormProps {
  onSubmit: (data: QuickSaleSubmitData) => void;
  onCancel: () => void;
  initialCustomerId?: string;
}

const SERVICE_OPTIONS = [
  '원컬러',
  '그라데이션',
  '프렌치',
  '아트',
  '자석젤',
  '케어',
  '리페어',
  '연장',
  '기타',
];

const DESIGNER_OPTIONS = [
  { id: 'designer-1', name: '김디자이너' },
  { id: 'designer-2', name: '이디자이너' },
  { id: 'designer-3', name: '박디자이너' },
];

export function QuickSaleForm({
  onSubmit,
  onCancel,
  initialCustomerId,
}: QuickSaleFormProps): React.ReactElement {
  const [form, setForm] = useState<QuickSaleFormValues>({
    customerId: initialCustomerId,
    customerQuery: '',
    serviceType: '',
    amount: '',
    paymentMethod: undefined,
    designerId: '',
    memo: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof QuickSaleFormValues, string>>>({});

  const set = useCallback(<K extends keyof QuickSaleFormValues>(key: K, val: QuickSaleFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: typeof errors = {};

      const parsedAmount = Number(form.amount.replace(/,/g, ''));
      if (!form.amount || isNaN(parsedAmount) || parsedAmount <= 0) {
        newErrors.amount = '금액을 입력하세요';
      }
      if (!form.paymentMethod) {
        newErrors.paymentMethod = '결제 방법을 선택하세요';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      onSubmit({
        customerId: form.customerId,
        customerQuery: form.customerQuery,
        serviceType: form.serviceType,
        amount: parsedAmount,
        paymentMethod: form.paymentMethod!,
        designerId: form.designerId,
        memo: form.memo,
      });
    },
    [form, onSubmit],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 고객 검색 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary">고객 검색</label>
        <input
          type="text"
          value={form.customerQuery}
          onChange={(e) => set('customerQuery', e.target.value)}
          placeholder="이름 또는 전화번호"
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* 시술 종류 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary">시술 종류</label>
        <select
          value={form.serviceType}
          onChange={(e) => set('serviceType', e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary transition-colors appearance-none"
        >
          <option value="">선택 (선택사항)</option>
          {SERVICE_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* 금액 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary">
          금액 <span className="text-error">*</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={form.amount}
          onChange={(e) => set('amount', e.target.value)}
          placeholder="0"
          className={cn(
            'w-full px-3 py-2.5 rounded-xl border bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none transition-colors',
            errors.amount ? 'border-error focus:border-error' : 'border-border focus:border-primary',
          )}
        />
        {errors.amount && <span className="text-[11px] text-error">{errors.amount}</span>}
      </div>

      {/* 결제 방법 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary">
          결제 방법 <span className="text-error">*</span>
        </label>
        <PaymentMethodSelector
          value={form.paymentMethod}
          onChange={(m) => set('paymentMethod', m)}
        />
        {errors.paymentMethod && <span className="text-[11px] text-error">{errors.paymentMethod}</span>}
      </div>

      {/* 담당 디자이너 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary">담당 디자이너</label>
        <select
          value={form.designerId}
          onChange={(e) => set('designerId', e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:border-primary transition-colors appearance-none"
        >
          <option value="">선택 (선택사항)</option>
          {DESIGNER_OPTIONS.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* 메모 */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-text-secondary">메모</label>
        <textarea
          value={form.memo}
          onChange={(e) => set('memo', e.target.value)}
          placeholder="특이사항, 요청사항 등"
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors resize-none"
        />
      </div>

      {/* 버튼 */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-surface-alt text-text-secondary font-semibold text-sm"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm shadow-sm"
        >
          매출 등록
        </button>
      </div>
    </form>
  );
}

export default QuickSaleForm;
