'use client';

import { useEffect, useState } from 'react';
import { Card, Button, Modal, Toggle } from '@/components/ui';
import { useMembershipPlanStore } from '@/store/membership-plan-store';
import { formatPrice } from '@/lib/format';
import type { MembershipPlan } from '@/types/customer';

interface PlanFormState {
  name: string;
  price: string;
  totalSessions: string;
  validDays: string;
}

const EMPTY_FORM: PlanFormState = { name: '', price: '', totalSessions: '', validDays: '' };

export function MembershipPlansSection(): React.ReactElement {
  const plans = useMembershipPlanStore((s) => s.plans);
  const addPlan = useMembershipPlanStore((s) => s.addPlan);
  const updatePlan = useMembershipPlanStore((s) => s.updatePlan);
  const togglePlanActive = useMembershipPlanStore((s) => s.togglePlanActive);
  const removePlan = useMembershipPlanStore((s) => s.removePlan);
  const hydrate = useMembershipPlanStore((s) => s.hydrateFromDB);
  const dbReady = useMembershipPlanStore((s) => s._dbReady);

  useEffect(() => {
    if (!dbReady) void hydrate();
  }, [dbReady, hydrate]);

  const [modalMode, setModalMode] = useState<'closed' | 'create' | { mode: 'edit'; plan: MembershipPlan }>('closed');
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openCreate = (): void => {
    setForm(EMPTY_FORM);
    setModalMode('create');
  };

  const openEdit = (plan: MembershipPlan): void => {
    setForm({
      name: plan.name,
      price: String(plan.price),
      totalSessions: String(plan.totalSessions),
      validDays: plan.validDays != null ? String(plan.validDays) : '',
    });
    setModalMode({ mode: 'edit', plan });
  };

  const closeModal = (): void => {
    setModalMode('closed');
    setForm(EMPTY_FORM);
  };

  const handleSubmit = (): void => {
    const name = form.name.trim();
    const price = Number(form.price);
    const totalSessions = Number(form.totalSessions);
    if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(totalSessions) || totalSessions <= 0) {
      return;
    }
    const validDays = form.validDays.trim() === '' ? null : Number(form.validDays);
    if (validDays !== null && (!Number.isFinite(validDays) || validDays <= 0)) {
      return;
    }

    if (modalMode === 'create') {
      addPlan({ name, price, totalSessions, validDays });
    } else if (typeof modalMode === 'object' && modalMode.mode === 'edit') {
      updatePlan(modalMode.plan.id, { name, price, totalSessions, validDays });
    }
    closeModal();
  };

  const handleDelete = (planId: string): void => {
    removePlan(planId);
    setConfirmDeleteId(null);
  };

  const isFormValid = (() => {
    if (!form.name.trim()) return false;
    const price = Number(form.price);
    const total = Number(form.totalSessions);
    if (!Number.isFinite(price) || price < 0) return false;
    if (!Number.isFinite(total) || total <= 0) return false;
    if (form.validDays.trim() !== '') {
      const vd = Number(form.validDays);
      if (!Number.isFinite(vd) || vd <= 0) return false;
    }
    return true;
  })();

  const modalOpen = modalMode !== 'closed';
  const modalTitle = typeof modalMode === 'object' && modalMode.mode === 'edit' ? '회원권 상품 수정' : '회원권 상품 추가';

  return (
    <>
      <Card className="mx-4 md:mx-0">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-text">회원권 상품</p>
            <p className="mt-0.5 text-[11px] text-text-muted leading-snug">자주 판매하는 회원권을 등록해두면 고객 카드에서 빠르게 부여할 수 있어요</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex-shrink-0 whitespace-nowrap rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            + 상품 추가
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-alt/50 px-4 py-8 text-center">
            <p className="text-sm text-text-muted">등록된 회원권 상품이 없어요</p>
            <p className="mt-1 text-[11px] text-text-muted">예: 10만원 5회권, 20만원 10회권</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className={`rounded-xl border px-4 py-3 transition-colors ${
                  plan.isActive ? 'border-border bg-surface' : 'border-border/50 bg-surface-alt/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${plan.isActive ? 'text-text' : 'text-text-muted'}`}>
                        {plan.name}
                      </span>
                      {!plan.isActive && (
                        <span className="rounded-md bg-surface-alt px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                          비활성
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5 flex-wrap text-[11px] text-text-muted tabular-nums">
                      <span>{formatPrice(plan.price)}</span>
                      <span>·</span>
                      <span>{plan.totalSessions}회</span>
                      {plan.validDays != null && (
                        <>
                          <span>·</span>
                          <span>{plan.validDays}일 유효</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Toggle
                    checked={plan.isActive}
                    onChange={() => togglePlanActive(plan.id)}
                    aria-label={plan.isActive ? '비활성화' : '활성화'}
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(plan)}
                    className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-alt transition-colors"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(plan.id)}
                    className="flex-1 rounded-lg border border-border py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal isOpen={modalOpen} onClose={closeModal} title={modalTitle}>
        <div className="px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">상품명 *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="예: 10만원 5회권"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
              maxLength={40}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">판매 금액 *</label>
            <input
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value.replace(/[^0-9]/g, '') }))}
              inputMode="numeric"
              placeholder="예: 100000"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-muted focus:border-primary focus:outline-none tabular-nums"
            />
            {form.price && (
              <p className="mt-1 text-[11px] text-text-muted">{Number(form.price).toLocaleString('ko-KR')}원</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">총 횟수 *</label>
            <input
              value={form.totalSessions}
              onChange={(e) => setForm((f) => ({ ...f, totalSessions: e.target.value.replace(/[^0-9]/g, '') }))}
              inputMode="numeric"
              placeholder="예: 5"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-muted focus:border-primary focus:outline-none tabular-nums"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">유효기간 (일, 선택)</label>
            <input
              value={form.validDays}
              onChange={(e) => setForm((f) => ({ ...f, validDays: e.target.value.replace(/[^0-9]/g, '') }))}
              inputMode="numeric"
              placeholder="예: 365"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-muted focus:border-primary focus:outline-none tabular-nums"
            />
            <p className="mt-1 text-[11px] text-text-muted">비워두면 무기한</p>
          </div>
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-text-secondary"
            >
              취소
            </button>
            <button
              type="button"
              disabled={!isFormValid}
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              {modalMode === 'create' ? '추가' : '저장'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="회원권 상품 삭제"
      >
        <div className="px-5 py-4 flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            삭제된 상품은 목록에서 사라지지만, <strong className="text-text">이미 고객에게 부여된 회원권은 영향을 받지 않습니다</strong>.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setConfirmDeleteId(null)}>
              취소
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              className="!bg-red-500 hover:!bg-red-600"
            >
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
