'use client';

import { useState, useMemo } from 'react';
import { CustomerTagChip } from '@/components/customer/CustomerTagChip';
import { Modal, Button, Input } from '@/components/ui';
import { useCustomerStore } from '@/store/customer-store';
import { useReservationStore } from '@/store/reservation-store';
import { normalizePhone } from '@/lib/phone';
import { cn } from '@/lib/cn';
import type { Customer } from '@/types/customer';

interface LinkCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservationId: string;
  reservationName: string;
  reservationPhone?: string;
  onLinked?: (customerId: string) => void;
}

export function LinkCustomerModal({
  isOpen,
  onClose,
  reservationId,
  reservationName,
  reservationPhone,
  onLinked,
}: LinkCustomerModalProps): React.ReactElement {
  const customers = useCustomerStore((s) => s.customers);
  const createCustomer = useCustomerStore((s) => s.createCustomer);
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);
  const updateReservation = useReservationStore((s) => s.updateReservation);

  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'create'>('search');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [linkSuccess, setLinkSuccess] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers.slice(0, 10);
    const q = searchQuery.toLowerCase();
    const qNorm = normalizePhone(searchQuery);
    return customers.filter((c) => {
      const nameMatch = c.name.toLowerCase().includes(q);
      const phoneMatch = qNorm && normalizePhone(c.phone).includes(qNorm);
      return nameMatch || phoneMatch;
    });
  }, [customers, searchQuery]);

  const handleSelectCustomer = (customer: Customer): void => {
    updateReservation(reservationId, { customerId: customer.id });
    onLinked?.(customer.id);
    setLinkSuccess(true);
    setTimeout(() => {
      setLinkSuccess(false);
      onClose();
    }, 800);
  };

  const handleCreateAndLink = (): void => {
    if (!newName.trim()) return;
    const newCustomer = createCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
    });
    updateReservation(reservationId, { customerId: newCustomer.id });
    onLinked?.(newCustomer.id);
    setLinkSuccess(true);
    setTimeout(() => {
      setLinkSuccess(false);
      onClose();
    }, 800);
  };

  const handleClose = (): void => {
    setSearchQuery('');
    setMode('search');
    setNewName('');
    setNewPhone('');
    setLinkSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="고객 연결">
      <div className="p-4 flex flex-col gap-4">
        {linkSuccess ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-success">고객이 연결되었습니다</p>
          </div>
        ) : (
          <>
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-xs text-text-muted mb-1">예약 정보</p>
              <p className="text-sm font-semibold text-text">{reservationName}</p>
              {reservationPhone && (
                <p className="text-xs text-text-secondary">{reservationPhone}</p>
              )}
            </div>

            <div className="flex rounded-xl bg-surface-alt border border-border p-1">
              <button
                onClick={() => setMode('search')}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                  mode === 'search'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text'
                )}
              >
                기존 고객 검색
              </button>
              <button
                onClick={() => {
                  setMode('create');
                  setNewName(reservationName);
                  setNewPhone(reservationPhone ?? '');
                }}
                className={cn(
                  'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
                  mode === 'create'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-muted hover:text-text'
                )}
              >
                새 고객 등록
              </button>
            </div>

            {mode === 'search' ? (
              <div className="flex flex-col gap-3">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="이름 또는 전화번호로 검색"
                  className="text-sm"
                />
                <div className="flex flex-col gap-2 max-h-64 overflow-y-auto overscroll-contain">
                  {filteredCustomers.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm text-text-muted">검색 결과가 없습니다</p>
                      <button
                        onClick={() => {
                          setMode('create');
                          setNewName(reservationName);
                          setNewPhone(reservationPhone ?? '');
                        }}
                        className="mt-2 text-xs font-semibold text-primary"
                      >
                        새 고객으로 등록하기
                      </button>
                    </div>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const pinnedTags = getPinnedTags(customer.id).slice(0, 3);
                      return (
                        <button
                          key={customer.id}
                          onClick={() => handleSelectCustomer(customer)}
                          className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:bg-surface-alt transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">
                              {customer.name.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text truncate">{customer.name}</p>
                            {customer.phone && (
                              <p className="text-xs text-text-secondary">{customer.phone}</p>
                            )}
                            {pinnedTags.length > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {pinnedTags.map((tag) => (
                                  <CustomerTagChip key={tag.id} tag={tag} size="sm" />
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-text-muted flex-shrink-0">
                            <span>방문 {customer.visitCount}회</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    이름 <span className="text-error">*</span>
                  </label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="고객 이름"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1">
                    전화번호 (선택)
                  </label>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="010-0000-0000"
                    type="tel"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => setMode('search')}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={handleCreateAndLink}
                    disabled={!newName.trim()}
                  >
                    등록 및 연결
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
