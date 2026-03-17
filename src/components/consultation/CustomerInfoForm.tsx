'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui';
import { useCustomerStore } from '@/store/customer-store';
import { useRecordsStore } from '@/store/records-store';
import { cn } from '@/lib/cn';
import { getRelativeDayDiffInKorea } from '@/lib/format';
import { useT, useKo, useLocale } from '@/lib/i18n';
import type { Customer } from '@/types/customer';
import type { ConsultationRecord } from '@/types/consultation';

interface CustomerInfoFormProps {
  name: string;
  phone: string;
  memo?: string;
  nameError?: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  onMemoChange: (v: string) => void;
  onExistingCustomerSelect: (customer: Customer) => void;
  allowExistingCustomerSearch?: boolean;
  className?: string;
}

function getRelativeDate(dateStr: string, t: (key: string) => string): string {
  const diffDays = getRelativeDayDiffInKorea(dateStr);
  if (diffDays === 0) return t('customerForm.today');
  if (diffDays === 1) return t('customerForm.yesterday');
  if (diffDays < 7) return t('customerForm.daysAgo').replace('{count}', String(diffDays));
  if (diffDays < 30) return t('customerForm.weeksAgo').replace('{count}', String(Math.floor(diffDays / 7)));
  if (diffDays < 365) return t('customerForm.monthsAgo').replace('{count}', String(Math.floor(diffDays / 30)));
  return t('customerForm.yearsAgo').replace('{count}', String(Math.floor(diffDays / 365)));
}

export function CustomerInfoForm({
  name,
  phone,
  memo,
  nameError,
  onNameChange,
  onPhoneChange,
  onMemoChange,
  onExistingCustomerSelect,
  allowExistingCustomerSearch = true,
  className,
}: CustomerInfoFormProps) {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  const allRecords = useMemo(() => getAllRecords(), [getAllRecords]);

  const BODY_PART_LABEL: Record<string, string> = {
    hand: t('bodyPart.hand'),
    foot: t('bodyPart.foot'),
  };
  const DESIGN_SCOPE_LABEL: Record<string, string> = {
    solid_tone: t('design.solidTone'),
    solid_point: t('design.solidPoint'),
    full_art: t('design.fullArt'),
    monthly_art: t('design.monthlyArt'),
  };
  const customers = useCustomerStore((s) => s.customers);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [filledFromExisting, setFilledFromExisting] = useState<string | null>(null);

  const filtered = searchQuery.trim()
    ? customers.filter(
        (c) =>
          c.name.includes(searchQuery) ||
          c.phone.replace(/-/g, '').includes(searchQuery.replace(/-/g, '')),
      )
    : [];

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {/* Toggle */}
      {allowExistingCustomerSearch && (
        <div className="flex bg-surface-alt rounded-xl p-1">
          {(['new', 'existing'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200',
                mode === m
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-text-muted hover:text-text',
              )}
            >
              {m === 'new' ? t('customerForm.newCustomer') : t('customerForm.existingCustomer')}
              {locale !== 'ko' && (
                <span className="ml-1 text-[10px] opacity-60">
                  {m === 'new' ? tKo('customerForm.newCustomer') : tKo('customerForm.existingCustomer')}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {!allowExistingCustomerSearch || mode === 'new' ? (
        <div className="flex flex-col gap-4">
          {filledFromExisting && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <p className="text-xs text-green-700">
                <span className="font-semibold">{filledFromExisting}</span>님의 정보가 입력되었습니다
              </p>
              <button type="button" onClick={() => setFilledFromExisting(null)} className="ml-auto text-green-400 hover:text-green-600">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                label={<>{t('customerForm.nameLabel')}{locale !== 'ko' && <span className="ml-1 text-[10px] text-text-muted opacity-60">{tKo('customerForm.nameLabel')}</span>}</>}
                placeholder={t('customerForm.namePlaceholder')}
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
                error={nameError}
              />
            </div>
            <div className="flex-1">
              <Input
                label={<>{t('customerForm.phoneLabel')}{locale !== 'ko' && <span className="ml-1 text-[10px] text-text-muted opacity-60">{tKo('customerForm.phoneLabel')}</span>}</>}
                placeholder="010-0000-0000"
                type="tel"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-secondary">
              {t('customerForm.memoLabel')}
              {locale !== 'ko' && (
                <span className="ml-1 text-[10px] text-text-muted opacity-60">{tKo('customerForm.memoLabel')}</span>
              )}
            </label>
            <textarea
              placeholder={t('customerForm.memoPlaceholder')}
              value={memo ?? ''}
              onChange={(e) => onMemoChange(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-text text-base placeholder:text-text-muted resize-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all duration-200"
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Input
            label={t('customerForm.searchLabel')}
            placeholder={t('customerForm.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery.trim() && (
            <div className="flex flex-col gap-2">
              {filtered.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">{t('customerForm.noResults')}</p>
              ) : (
                filtered.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      onExistingCustomerSelect(customer);
                      setFilledFromExisting(customer.name);
                      setMode('new');
                    }}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border bg-white hover:border-primary transition-all duration-150 text-left',
                      selectedCustomer?.id === customer.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border',
                    )}
                  >
                    <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {customer.name.slice(0, 1)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-text">{customer.name}</p>
                      <p className="text-xs text-text-muted">{customer.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-muted">{t('customerForm.visitCount').replace('{count}', String(customer.visitCount))}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
          {!searchQuery.trim() && !selectedCustomer && (
            <div className="py-8 flex flex-col items-center gap-2 text-text-muted">
              <svg
                className="w-10 h-10 opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z"
                />
              </svg>
              <p className="text-sm">{t('customerForm.searchPrompt')}</p>
            </div>
          )}

          {/* 선택된 고객의 최근 상담 내역 카드 */}
          {selectedCustomer && (() => {
            const records = allRecords
              .filter((r: ConsultationRecord) => r.customerId === selectedCustomer.id)
              .sort((a: ConsultationRecord, b: ConsultationRecord) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const latest = records[0];

            return (
              <div className="mt-1 rounded-xl border border-border bg-white p-3 flex flex-col gap-1.5">
                <p className="text-[11px] font-bold text-primary uppercase tracking-wide">
                  {t('customerForm.recentConsultation')}
                </p>
                {latest ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-text">
                      {getRelativeDate(latest.createdAt, t)}
                    </span>
                    <span className="text-text-muted text-xs">·</span>
                    <span className="text-xs text-text-secondary">
                      {BODY_PART_LABEL[latest.consultation.bodyPart] ?? latest.consultation.bodyPart}
                    </span>
                    <span className="text-text-muted text-xs">·</span>
                    <span className="text-xs text-text-secondary">
                      {DESIGN_SCOPE_LABEL[latest.consultation.designScope] ?? latest.consultation.designScope}
                    </span>
                    <span className="text-text-muted text-xs">·</span>
                    <span className="text-xs font-semibold text-text">
                      ₩{latest.finalPrice.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-text-muted">{t('customerForm.firstVisit')}</p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
