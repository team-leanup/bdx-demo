'use client';

import { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { useCustomerStore } from '@/store/customer-store';
import { useShopStore } from '@/store/shop-store';
import type { PaymentMethod } from '@/types/consultation';
import type { Customer } from '@/types/customer';

interface QuickSaleFormValues {
  customerId?: string;
  customerQuery: string;
  customerPhone?: string;
  serviceType: string;
  amount: string;
  paymentMethod: PaymentMethod | undefined;
  designerId: string;
  memo: string;
}

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
}

interface QuickSaleFormProps {
  onSubmit: (data: QuickSaleSubmitData) => void;
  onCancel: () => void;
  initialCustomerId?: string;
  initialCustomerName?: string;
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

export function QuickSaleForm({
  onSubmit,
  onCancel,
  initialCustomerId,
  initialCustomerName,
}: QuickSaleFormProps): React.ReactElement {
  const customers = useCustomerStore((s) => s.customers);
  const designers = useShopStore((s) => s.designers);
  const activeDesigners = useMemo(() => designers.filter((d) => d.isActive), [designers]);

  // N-4: initialCustomerId가 있으면 고객명 자동 채우기
  const resolvedInitialName = useMemo(() => {
    if (initialCustomerId) {
      const found = customers.find((c) => c.id === initialCustomerId);
      if (found) return found.name;
    }
    return initialCustomerName ?? '';
  }, [initialCustomerId, initialCustomerName, customers]);

  const resolvedInitialPhone = useMemo(() => {
    if (initialCustomerId) {
      const found = customers.find((c) => c.id === initialCustomerId);
      if (found) return found.phone;
    }
    return undefined;
  }, [initialCustomerId, customers]);

  const [form, setForm] = useState<QuickSaleFormValues>({
    customerId: initialCustomerId,
    customerQuery: resolvedInitialName,
    customerPhone: resolvedInitialPhone,
    serviceType: '',
    amount: '',
    paymentMethod: undefined,
    designerId: '',
    memo: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof QuickSaleFormValues, string>>>({});
  const [showDropdown, setShowDropdown] = useState(false);

  const set = useCallback(<K extends keyof QuickSaleFormValues>(key: K, val: QuickSaleFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const filteredCustomers = useMemo<Customer[]>(() => {
    const q = form.customerQuery.trim();
    if (!q) return [];
    const qLower = q.toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    return customers.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(qLower);
      const phoneDigits = c.phone.replace(/\D/g, '');
      const phoneMatch = qDigits.length >= 3 && phoneDigits.includes(qDigits);
      return nameMatch || phoneMatch;
    }).slice(0, 5);
  }, [customers, form.customerQuery]);

  const handleSelectCustomer = useCallback((customer: Customer) => {
    setForm((prev) => ({
      ...prev,
      customerId: customer.id,
      customerQuery: customer.name,
      customerPhone: customer.phone,
    }));
    setShowDropdown(false);
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
        customerName: form.customerQuery,
        customerQuery: form.customerQuery,
        customerPhone: form.customerPhone,
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
        <div className="relative">
          <input
            type="text"
            value={form.customerQuery}
            onChange={(e) => {
              set('customerQuery', e.target.value);
              setForm((prev) => ({ ...prev, customerId: undefined, customerPhone: undefined }));
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="이름 또는 전화번호"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
          {showDropdown && filteredCustomers.length > 0 && (
            <ul className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-elevated z-10 overflow-hidden">
              {filteredCustomers.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onMouseDown={() => handleSelectCustomer(c)}
                    className="w-full px-3 py-2.5 text-left hover:bg-surface-alt flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-text">{c.name}</span>
                    <span className="text-xs text-text-muted">{c.phone}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {form.customerId && (
          <p className="text-[11px] text-primary">✓ 고객 선택됨</p>
        )}
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
          {activeDesigners.map((d) => (
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
          className="flex-1 py-3.5 rounded-xl bg-surface-alt text-text-secondary font-semibold text-sm"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm"
        >
          매출 등록
        </button>
      </div>
    </form>
  );
}

export default QuickSaleForm;
