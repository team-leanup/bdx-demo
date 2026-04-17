'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Modal } from '@/components/ui';
import { formatPrice, getNowInKoreaIso } from '@/lib/format';
import { useCustomerStore } from '@/store/customer-store';
import { normalizePhone } from '@/lib/phone';
import { useAuthStore } from '@/store/auth-store';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { cn } from '@/lib/cn';


type FilterTab = 'all' | 'vip' | 'regular';

const PAGE_SIZE = 12;

export default function CustomersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [memo, setMemo] = useState('');
  const role = useAuthStore((s) => s.role);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const customers = useCustomerStore((s) => s.customers);
  const createCustomer = useCustomerStore((s) => s.createCustomer);
  const appendSmallTalkNote = useCustomerStore((s) => s.appendSmallTalkNote);
  const findByPhoneNormalized = useCustomerStore((s) => s.findByPhoneNormalized);

  const duplicateCustomer = phone.trim().length >= 8 ? findByPhoneNormalized(phone.trim()) : undefined;

  const handleCreateCustomer = () => {
    if (!name.trim()) return;
    const newCustomer = createCustomer({
      name: name.trim(),
      phone: phone.trim() || undefined,
    });
    if (memo.trim()) {
      const now = getNowInKoreaIso();
      appendSmallTalkNote(newCustomer.id, {
        id: `stn-${Date.now()}`,
        customerId: newCustomer.id,
        noteText: memo.trim(),
        createdAt: now,
        createdByDesignerId: activeDesignerId ?? '',
        createdByDesignerName: '',
      });
    }
    setShowAddModal(false);
    setName('');
    setPhone('');
    setMemo('');
    router.push(`/customers/${newCustomer.id}`);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const normalizedQ = normalizePhone(search || '');
    return customers.filter((c) => {
      if (role === 'staff' && activeDesignerId && c.assignedDesignerId !== activeDesignerId) {
        return false;
      }
      if (filterTab === 'vip' && !(c.isRegular || (c.visitCount ?? 0) >= 5)) return false;
      if (filterTab === 'regular' && (c.isRegular || (c.visitCount ?? 0) >= 5)) return false;
      if (!q && !normalizedQ) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        (normalizedQ.length > 0 && (normalizePhone(c.phone || '') || '').includes(normalizedQ)) ||
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
    <div className="flex flex-col gap-2 pb-6">
      {/* 헤더 */}
      <div className="px-4 md:px-0 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-text">고객 목록</h1>
          <span className="text-sm text-text-secondary tabular-nums">{customers.length}명</span>
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-dark active:scale-[0.97] transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          새 고객 등록
        </button>
      </div>

      {/* 검색 + 필터 탭 */}
      <div className="px-4 md:px-0 flex flex-col gap-2">
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
                'px-5 py-1.5 rounded-full text-xs font-medium transition-all',
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

      {/* 페이지네이션 */}
      {filtered.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-4 md:px-0">
          <div className="text-xs text-text-secondary">
            {filtered.length}명 중 {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filtered.length)}명
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-text-secondary disabled:opacity-40"
            >
              이전
            </button>
            <span className="min-w-10 text-center text-xs font-medium text-text">{currentPage}/{totalPages}</span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-text-secondary disabled:opacity-40"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* 2열 카드 그리드 */}
      <div className="px-4 md:px-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-base font-medium text-text-secondary">검색 결과가 없습니다</p>
            <p className="mt-1 text-sm text-text-muted">다른 검색어를 시도해보세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {paginatedCustomers.map((customer) => {
              const isVip = customer.isRegular || customer.visitCount >= 5;
              const recentTag = (customer.tags ?? []).find((t) => t.category === 'design');

              return (
                <button
                  key={customer.id}
                  onClick={() => router.push(`/customers/${customer.id}`)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-3 text-center hover:shadow-md active:bg-surface-alt transition-all"
                >
                  {/* 아바타 + 국기/safety overlay */}
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-base font-medium text-primary">
                    {customer.name.charAt(0)}
                    {customer.preferredLanguage && customer.preferredLanguage !== 'ko' && (
                      <span className="absolute -bottom-0.5 -right-0.5 text-[12px] leading-none drop-shadow-sm">
                        <FlagIcon language={customer.preferredLanguage} size="sm" />
                      </span>
                    )}
                  </div>

                  {/* 이름 + 뱃지 */}
                  <div className="flex items-center gap-1 min-w-0 max-w-full">
                    <span className="truncate text-sm font-semibold text-text">
                      {customer.name}
                      {customer.phone && <span className="text-text-muted font-normal text-[10px]"> ({customer.phone.slice(-4)})</span>}
                    </span>
                    {isVip && (
                      <span
                        className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium"
                        style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
                      >
                        단골
                      </span>
                    )}
                  </div>

                  {/* 최근 시술 */}
                  {recentTag && (
                    <span className="text-[10px] text-text-muted truncate max-w-full">{recentTag.value}</span>
                  )}

                  {/* 방문 + 금액 */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-text-muted">{customer.visitCount}회</span>
                    <span className={cn('font-semibold tabular-nums', customer.totalSpend > 0 ? 'text-primary' : 'text-text-muted')}>{formatPrice(customer.totalSpend)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="새 고객 등록">
        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">이름 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="고객 이름"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">전화번호</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            {duplicateCustomer && (
              <p className="mt-1 text-xs text-warning">
                이미 등록된 고객이에요 —{' '}
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); router.push(`/customers/${duplicateCustomer.id}`); }}
                  className="text-primary underline"
                >
                  고객 카드 보기
                </button>
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">메모</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="특이사항, 선호 스타일 등"
              rows={2}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-text-secondary"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleCreateCustomer}
              disabled={!name.trim()}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              등록
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
