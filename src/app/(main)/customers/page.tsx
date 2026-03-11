'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input, BentoGrid, BentoCard } from '@/components/ui';
import { FeatureDiscovery } from '@/components/onboarding/FeatureDiscovery';
import { formatPrice } from '@/lib/format';
import { useCustomerStore } from '@/store/customer-store';
import { normalizePhone } from '@/lib/phone';
import { useAuthStore } from '@/store/auth-store';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { cn } from '@/lib/cn';

const now = new Date();
const thisMonth = now.getMonth();
const thisYear = now.getFullYear();

// stats will be derived from store inside component (hooks cannot be used at module scope)

type FilterTab = 'all' | 'vip' | 'regular';

const PAGE_SIZE = 10;

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const role = useAuthStore((s) => s.role);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const customers = useCustomerStore((s) => s.customers);

  // derive stats from store
  const newThisMonth = useMemo(() => {
    return customers.filter((c) => {
      if (!c?.createdAt) return false;
      const d = new Date(c.createdAt);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).length;
  }, [customers]);

  const avgSpend = useMemo(() => {
    if (customers.length === 0) return 0;
    const sum = customers.reduce((acc, c) => acc + (Number(c.totalSpend) || 0), 0);
    return Math.round(sum / customers.length);
  }, [customers]);

  const regularCount = useMemo(() => {
    return customers.filter((c) => c.isRegular || (c.visitCount ?? 0) >= 5).length;
  }, [customers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const normalizedQ = normalizePhone(search || '');
    return customers.filter((c) => {
      if (role === 'staff' && activeDesignerId && c.assignedDesignerId !== activeDesignerId) {
        return false;
      }
      if (filterTab === 'vip' && !c.isRegular) return false;
      if (filterTab === 'regular' && c.isRegular) return false;
      if (!q && !normalizedQ) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (normalizePhone(c.phone || '') || '').includes(normalizedQ) ||
        (c.assignedDesignerName ?? '').toLowerCase().includes(q) ||
        (c.tags ?? []).some((tag) => tag.value.toLowerCase().includes(q))
      );
    });
  }, [search, role, activeDesignerId, filterTab, customers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterTab, role, activeDesignerId, customers.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const FILTER_TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'vip', label: '단골' },
    { key: 'regular', label: '일반' },
  ];

  return (
    <div className="flex flex-col gap-4 pb-6">
      <FeatureDiscovery
        featureId="customers-intro"
        icon="👥"
        title="고객 관리"
        description={"고객의 시술 이력, 선호도, 연락처를 관리하고\n단골 고객을 한눈에 파악하세요."}
      />
      {/* 헤더 */}
      <div className="px-4 md:px-0 pt-4">
        <h1 className="text-2xl font-bold text-text">고객 목록</h1>
      </div>

      {/* Stats Bento Strip */}
      <BentoGrid cols={4} className="px-4 md:px-0">
        <BentoCard span="1x1" variant="accent">
          <div className="p-4 flex flex-col items-center justify-center h-full">
            <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {customers.length}
            </span>
            <span className="text-xs text-text-secondary mt-1">총 고객</span>
          </div>
        </BentoCard>
        <BentoCard span="1x1" variant="accent">
          <div className="p-4 flex flex-col items-center justify-center h-full">
            <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {newThisMonth}
            </span>
            <span className="text-xs text-text-secondary mt-1">이번달 신규</span>
          </div>
        </BentoCard>
        <BentoCard span="1x1" variant="accent">
          <div className="p-4 flex flex-col items-center justify-center h-full">
            <span className="text-xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatPrice(avgSpend)}
            </span>
            <span className="text-xs text-text-secondary mt-1">평균 시술 총액</span>
          </div>
        </BentoCard>
        <BentoCard span="1x1" variant="accent">
          <div className="p-4 flex flex-col items-center justify-center h-full">
            <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {regularCount}
            </span>
            <span className="text-xs text-text-secondary mt-1">단골 고객</span>
          </div>
        </BentoCard>
      </BentoGrid>

      {/* 검색 + 필터 탭 */}
      <div className="px-4 md:px-0 flex flex-col gap-3">
        <Input
          placeholder="이름, 전화번호, 담당자, 고객 ID로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-0.5 p-1 rounded-full bg-surface-alt border border-border self-start">
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterTab(key)}
              className={cn(
                'px-5 py-1.5 rounded-full text-xs font-semibold transition-all',
                filterTab === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 단일 컬럼 리스트 */}
      <div className="flex flex-col px-4 md:px-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-base font-medium text-text-secondary">검색 결과가 없습니다</p>
            <p className="mt-1 text-sm text-text-muted">다른 검색어를 시도해보세요</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex flex-col divide-y divide-border bg-surface">
              {paginatedCustomers.map((customer) => {
                const isVip = customer.isRegular || customer.visitCount >= 5;
                return (
                  <button
                    key={customer.id}
                    onClick={() => router.push(`/customers/${customer.id}`)}
                    className="flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-alt active:bg-surface-alt transition-colors"
                  >
                    {/* 아바타 원 */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {customer.name.charAt(0)}
                    </div>

                    <div className="flex flex-1 min-w-0 items-center gap-2">
                      <span className="text-sm font-semibold text-text">{customer.name}</span>
                      {customer.preferredLanguage && customer.preferredLanguage !== 'ko' && (
                        <FlagIcon language={customer.preferredLanguage} size="sm" />
                      )}
                      {isVip && (
                        <span
                          className="flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
                        >
                          단골
                        </span>
                      )}
                    </div>

                    {/* 방문 횟수 */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-text-muted">{customer.visitCount}회</p>
                    </div>

                    {/* 총 지출 */}
                    <div className="flex-shrink-0 w-20 text-right">
                      <p className="text-xs font-semibold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatPrice(customer.totalSpend)}
                      </p>
                    </div>

                    {/* 화살표 */}
                    <svg className="h-4 w-4 flex-shrink-0 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {filtered.length > 0 && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
            <div className="text-xs text-text-secondary">
              총 {filtered.length}명 중 {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)}명
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                이전
              </button>
              <span className="min-w-16 text-center text-xs font-semibold text-text">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
