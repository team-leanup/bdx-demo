'use client';

import { useMemo, useState } from 'react';
import { BentoGrid, BentoCard, Button, ToastContainer } from '@/components/ui';
import type { ToastData } from '@/components/ui';
import { FeatureDiscovery } from '@/components/onboarding/FeatureDiscovery';
import { KPICards } from '@/components/dashboard/KPICards';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ServiceAnalytics } from '@/components/dashboard/ServiceAnalytics';
import { CustomerAnalytics } from '@/components/dashboard/CustomerAnalytics';
import { DesignerPerformance } from '@/components/dashboard/DesignerPerformance';
import { WeeklySummary } from '@/components/dashboard/WeeklySummary';
import { HourlyBookings } from '@/components/dashboard/HourlyBookings';
import { formatDateDot, formatPrice } from '@/lib/format';
import { DESIGN_SCOPE_LABEL } from '@/lib/labels';
import { useAuthStore } from '@/store/auth-store';
import { useRecordsStore } from '@/store/records-store';
import { useCustomerStore } from '@/store/customer-store';
import { useReservationStore } from '@/store/reservation-store';
import {
  computeRegularVisitRate,
  computeUpsellMetrics,
  computeForeignReservationSummary,
  computeGoldenTimeTargets,
} from '@/lib/analytics';

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });
  const role = useAuthStore((s) => s.role);
  const isOwner = useAuthStore((s) => s.isOwner);
  const activeDesignerName = useAuthStore((s) => s.activeDesignerName);
  const records = useRecordsStore((s) => s.records);
  const customers = useCustomerStore((s) => s.customers);
  const reservations = useReservationStore((s) => s.reservations);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const regularVisitRate = useMemo(() => computeRegularVisitRate(customers), [customers]);
  const upsellMetrics = useMemo(() => computeUpsellMetrics(records), [records]);
  const foreignReservationSummary = useMemo(
    () => computeForeignReservationSummary(reservations),
    [reservations],
  );
  const goldenTimeTargets = useMemo(
    () => computeGoldenTimeTargets(customers, reservations),
    [customers, reservations],
  );

  const handleDismissToast = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const handleCopyReminder = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setToasts((current) => [
        ...current,
        { id: `toast-${Date.now()}`, type: 'success', message: '리마인더 문구를 복사했어요' },
      ]);
    } catch {
      setToasts((current) => [
        ...current,
        { id: `toast-${Date.now()}`, type: 'error', message: '복사에 실패했어요. 다시 시도해 주세요' },
      ]);
    }
  };

  if (!isOwner()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center">
          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-lg font-bold text-text">원장님 전용 페이지입니다</p>
          <p className="text-sm text-text-muted">대시보드는 원장 모드에서만 접근할 수 있습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <FeatureDiscovery
        featureId="dashboard-intro"
        icon="📊"
        title="대시보드"
        description={"상담 건수, 인기 디자인, 선택 패턴 등\n상담 기록 기반 현황을 한눈에 확인하세요."}
      />
      {/* 헤더 */}
      <div className="px-4 md:px-0 pt-4">
        <h1 className="text-2xl font-bold text-text">대시보드</h1>
        <p className="mt-0.5 text-sm text-text-secondary">{today} 기준</p>
      </div>

      {/* Staff banner */}
      {role === 'staff' && activeDesignerName && (
        <div className="mx-4 md:mx-0 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5">
          <svg className="h-4 w-4 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-xs font-medium text-primary">{activeDesignerName}님의 대시보드</p>
        </div>
      )}

      {/* Full Bento Grid */}
      <div className="px-4 md:px-0">
        <BentoGrid cols={4}>
          <BentoCard span="4x1" variant="accent">
            <div className="flex h-full flex-col gap-4 p-4 md:p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-secondary">업셀링 리포트</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-extrabold leading-none text-primary md:text-4xl">
                      {formatPrice(upsellMetrics.totalUpsellRevenue)}
                    </span>
                    <span className="pb-1 text-xs font-medium text-text-muted">BDX 상담으로 추가된 옵션 매출</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-surface/80 px-4 py-3">
                  <p className="text-[11px] text-text-muted">업셀링 적용 상담</p>
                  <p className="mt-1 text-lg font-bold text-text">{upsellMetrics.upsellConsultations}건</p>
                  <p className="text-[11px] text-text-muted">전체 상담의 {upsellMetrics.upsellRate}%</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface/80 px-4 py-3">
                <p className="text-[11px] font-semibold text-text-muted">업셀링 포인트</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-[11px] text-text-muted">파츠 추가</p>
                    <p className="mt-1 text-lg font-bold text-text">총 {upsellMetrics.partsUpsellCount}개</p>
                    <p className="text-[11px] text-text-muted">{upsellMetrics.partsUpsellConsultations}건의 상담에서 선택</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-muted">컬러 추가</p>
                    <p className="mt-1 text-lg font-bold text-text">총 {upsellMetrics.colorUpsellCount}색</p>
                    <p className="text-[11px] text-text-muted">{upsellMetrics.colorUpsellConsultations}건의 상담에서 선택</p>
                  </div>
                </div>
              </div>

            </div>
          </BentoCard>

          {/* KPI Row: 4 × 1×1 BentoCards (returned as Fragment children) */}
          <KPICards />

          {/* 이번 주 요약: 4×1 */}
          <BentoCard span="4x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">이번 주 요약</h2>
              <WeeklySummary />
            </div>
          </BentoCard>

          {/* 상담 추이: 4×1 */}
          <BentoCard span="4x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">상담 추이</h2>
              <RevenueChart />
            </div>
          </BentoCard>

          {/* 디자이너별 상담 현황: 4×1 */}
          <BentoCard span="4x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">디자이너별 상담 현황</h2>
              <DesignerPerformance />
            </div>
          </BentoCard>

          {/* 시간대별 예약: 4×1 */}
          <BentoCard span="4x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">시간대별 예약</h2>
              <HourlyBookings />
            </div>
          </BentoCard>

          <BentoCard span="2x1">
            <div className="flex h-full flex-col gap-4 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-text-secondary">외국인 예약 현황</h2>
                  <p className="mt-1 text-xs text-text-muted">오늘 외국어 예약과 언어별 상담 준비 상태</p>
                </div>
                <div className="rounded-2xl bg-primary/10 px-3 py-2 text-right">
                  <p className="text-[10px] text-primary">오늘의 외국인 예약</p>
                  <p className="text-2xl font-extrabold text-primary">{foreignReservationSummary.foreignerCount}명</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-surface-alt px-4 py-3">
                  <p className="text-[11px] text-text-muted">준비 완료</p>
                  <p className="mt-1 text-lg font-bold text-text">{foreignReservationSummary.totalReady}건</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-alt px-4 py-3">
                  <p className="text-[11px] text-text-muted">추가 준비 필요</p>
                  <p className="mt-1 text-lg font-bold text-text">{foreignReservationSummary.totalPending}건</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {foreignReservationSummary.statuses.map((status) => (
                  <div
                    key={status.language}
                    className={`rounded-2xl border border-border px-4 py-3 ${status.total === 0 ? 'bg-surface/50 opacity-60' : 'bg-surface-alt'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-bold text-primary">{status.flag}</span>
                        <div>
                          <p className="text-sm font-semibold text-text">{status.label}</p>
                          <p className="text-[11px] text-text-muted">예약 {status.total}건 · 준비 완료 {status.ready}건</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary">{status.readyRate}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${status.readyRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          <BentoCard span="2x1">
            <div className="flex h-full flex-col gap-4 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-text-secondary">재방문 골든타임 알림</h2>
                  <p className="mt-1 text-xs text-text-muted">평균 주기 28일 기준 이번 주 리마인더 대상</p>
                </div>
                <div className="rounded-2xl bg-primary/10 px-3 py-2 text-right">
                  <p className="text-[10px] text-primary">이번 주 대상</p>
                  <p className="text-2xl font-extrabold text-primary">{goldenTimeTargets.length}명</p>
                </div>
              </div>

              {goldenTimeTargets.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-surface-alt px-4 text-center text-sm text-text-muted">
                  이번 주에는 별도 리마인더가 필요한 고객이 없습니다.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {goldenTimeTargets.map((target) => (
                    <div key={target.customerId} className="rounded-2xl border border-border bg-surface-alt px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text">{target.customerName}</p>
                          <p className="mt-0.5 text-[11px] text-text-muted">
                            {target.assignedDesignerName} · {target.recentServiceLabel} · 마지막 방문 후 {target.daysSinceLastVisit}일
                          </p>
                          <p className="mt-1 text-[11px] text-text-muted">권장 연락일 {formatDateDot(target.expectedReservationDate)}</p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => handleCopyReminder(target.reminderMessage)}>
                          문구 복사
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BentoCard>

          {/* 인기 서비스: 2×1 */}
          <BentoCard span="2x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">인기 서비스</h2>
              <ServiceAnalytics />
            </div>
          </BentoCard>

          {/* 고객 분석: 2×1 */}
          <BentoCard span="2x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">고객 분석</h2>
              <CustomerAnalytics />
            </div>
          </BentoCard>
        </BentoGrid>
      </div>

      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
