'use client';

import { useState, useMemo, useEffect } from 'react';
import type { KPICard } from '@/lib/analytics';
import {
  computeKPICards,
  computeDesignScopeBreakdown,
  computeReturnRate,
  computeCustomerAnalytics,
  getRecordStatus,
} from '@/lib/analytics';
import type { ConsultationRecord, BookingRequest } from '@/types/consultation';
import type { Customer } from '@/types/customer';
import { BentoCard } from '@/components/ui';
import { useRecordsStore } from '@/store/records-store';
import { useCustomerStore } from '@/store/customer-store';
import { useReservationStore } from '@/store/reservation-store';
import { getTodayInKorea, toKoreanDateString } from '@/lib/format';

function buildKPIDetail(
  label: string,
  records: ConsultationRecord[],
  customers: Customer[],
  reservations: BookingRequest[],
): React.ReactNode {
  switch (label) {
    case '이달 상담 건수': {
      const today = getTodayInKorea();
      const prefix = today.slice(0, 7);
      const thisMonth = records.filter((r) => toKoreanDateString(r.createdAt).startsWith(prefix));
      const completedCount = thisMonth.filter((r) => getRecordStatus(r) === 'completed').length;
      const inProgressCount = thisMonth.filter((r) => getRecordStatus(r) === 'in_progress').length;
      const preConsultCount = thisMonth.filter((r) => getRecordStatus(r) === 'pre_consultation').length;
      const countExcludingPre = completedCount + inProgressCount;
      const [y, m, d] = today.split('-').map(Number);
      const daysInMonth = new Date(y, m, 0).getDate();
      const daysPassed = d;
      const dailyAvg = daysPassed > 0 ? (countExcludingPre / daysPassed).toFixed(1) : '0';
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
            <span className="text-sm text-text-secondary">완료된 상담</span>
            <span className="font-bold text-text">{completedCount}건</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
            <span className="text-sm text-text-secondary">미확정 상담</span>
            <span className="font-bold text-text">{inProgressCount}건</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-blue-50 p-3">
            <span className="text-sm text-text-secondary">사전 상담 접수</span>
            <span className="font-bold text-blue-600">{preConsultCount}건</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
            <span className="text-sm text-text-secondary">하루 평균</span>
            <span className="font-bold text-text">약 {dailyAvg}건</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3">
            <span className="text-sm font-semibold text-primary">이번 달 일수</span>
            <span className="font-bold text-primary">{daysPassed}/{daysInMonth}일</span>
          </div>
        </div>
      );
    }
    case '인기 디자인': {
      const breakdown = computeDesignScopeBreakdown(records);
      return (
        <div className="flex flex-col gap-3">
          {breakdown.map((item, idx) => (
            <div
              key={item.name}
              className={`flex items-center justify-between rounded-xl p-3 ${idx === 0 ? 'bg-primary/10' : 'bg-surface-alt'}`}
            >
              <span className={`text-sm ${idx === 0 ? 'font-semibold text-primary' : 'text-text-secondary'}`}>
                {item.name}
              </span>
              <span className={`font-bold ${idx === 0 ? 'text-primary' : 'text-text'}`}>
                {item.percentage}% ({item.count}건)
              </span>
            </div>
          ))}
          {breakdown.length === 0 && (
            <p className="text-center text-sm text-text-muted">데이터가 없습니다.</p>
          )}
        </div>
      );
    }
    case '평균 옵션 선택': {
      if (records.length === 0) return <p className="text-center text-sm text-text-muted">데이터가 없습니다.</p>;
      const optCounts = records.map((r) => {
        const c = r.consultation;
        let opts = 0;
        if (c.bodyPart) opts++;
        if (c.offType && c.offType !== 'none') opts++;
        if (c.extensionType && c.extensionType !== 'none') opts++;
        if (c.nailShape) opts++;
        if (c.designScope) opts++;
        if (Array.isArray(c.expressions)) opts += c.expressions.length;
        if (c.hasParts) opts++;
        return opts;
      });
      const avg = (optCounts.reduce((s, v) => s + v, 0) / optCounts.length).toFixed(1);
      const offCount = records.filter((r) => r.consultation.offType && r.consultation.offType !== 'none').length;
      const offRate = Math.round((offCount / records.length) * 100);
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
            <span className="text-sm text-text-secondary">상담당 평균</span>
            <span className="font-bold text-text">{avg}개</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
            <span className="text-sm text-text-secondary">오프 포함 비율</span>
            <span className="font-bold text-text">{offRate}%</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3">
            <span className="text-sm font-semibold text-primary">총 상담</span>
            <span className="font-bold text-primary">{records.length}건</span>
          </div>
        </div>
      );
    }
    case '재방문율': {
      const analytics = computeCustomerAnalytics(records, customers);
      const returnRate = computeReturnRate(records, customers);
      return (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
            <span className="text-sm text-text-secondary">재방문 고객</span>
            <span className="font-bold text-text">{analytics.returningCustomers}명</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
            <span className="text-sm text-text-secondary">신규 고객</span>
            <span className="font-bold text-text">{analytics.newCustomers}명</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
            <span className="text-sm text-text-secondary">평균 방문 주기</span>
            <span className="font-bold text-text">{analytics.averageVisitInterval}일</span>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3">
            <span className="text-sm font-semibold text-primary">재방문율</span>
            <span className="font-bold text-primary">{returnRate}%</span>
          </div>
        </div>
      );
    }
    case '단골 고객': {
      const regulars = [...customers]
        .filter((c) => c.visitCount >= 3)
        .sort((a, b) => b.visitCount - a.visitCount)
        .slice(0, 12);
      return (
        <div className="flex flex-col gap-2">
          <p className="mb-1 text-xs text-text-muted">3회 이상 방문 고객 기준</p>
          {regulars.map((customer, idx) => (
            <div
              key={customer.id}
              className="flex items-center justify-between rounded-xl bg-surface-alt px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 text-xs text-text-muted">{idx + 1}</span>
                <span className="text-sm font-medium text-text">{customer.name}</span>
              </div>
              <span className="text-sm text-text-secondary">{customer.visitCount}회 방문</span>
            </div>
          ))}
          {regulars.length === 0 && (
            <p className="text-center text-sm text-text-muted">3회 이상 방문 고객이 없습니다.</p>
          )}
        </div>
      );
    }
    case '오늘 예약': {
      const today = getTodayInKorea();
      const todayRes = reservations
        .filter((r) => r.reservationDate === today && r.status !== 'cancelled')
        .sort((a, b) => a.reservationTime.localeCompare(b.reservationTime));
      const channelLabel: Record<string, string> = {
        kakao: '카카오톡',
        naver: '네이버',
        phone: '전화',
        walk_in: '워크인',
      };
      return (
        <div className="flex flex-col gap-2">
          {todayRes.map((appt) => (
            <div
              key={appt.id}
              className="flex items-center justify-between rounded-xl bg-surface-alt px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-12 text-sm font-bold text-primary">{appt.reservationTime}</span>
                <span className="text-sm font-medium text-text">{appt.customerName}</span>
              </div>
              <span className="rounded-full bg-border px-2 py-0.5 text-xs text-text-muted">
                {channelLabel[appt.channel] ?? appt.channel}
              </span>
            </div>
          ))}
          {todayRes.length === 0 && (
            <p className="text-center text-sm text-text-muted">오늘 예약이 없습니다.</p>
          )}
        </div>
      );
    }
    default:
      return null;
  }
}

interface BottomSheetProps {
  kpi: KPICard;
  onClose: () => void;
}

function KPIBottomSheet({ kpi, onClose }: BottomSheetProps) {
  const records = useRecordsStore((s) => s.records);
  const customers = useCustomerStore((s) => s.customers);
  const reservations = useReservationStore((s) => s.reservations);
  const detail = buildKPIDetail(kpi.label, records, customers, reservations);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      {/* 바텀시트 패널 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-2xl bg-background shadow-sm pb-safe md:bottom-auto md:top-1/2 md:left-1/2 md:right-auto md:w-full md:max-h-[85vh] md:max-w-lg md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:pb-0">
        {/* 핸들 */}
        <div className="flex flex-shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {/* 헤더 */}
        <div className="flex flex-shrink-0 items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{kpi.icon}</span>
            <h3 className="text-base font-bold text-text">{kpi.label}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-surface-alt text-text-muted"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {/* 현재 값 */}
          <div className="px-5 pb-3">
            <p className="text-3xl font-bold text-text">{kpi.value}</p>
            {kpi.changeDirection !== 'neutral' && (
              <p
                className={`mt-0.5 text-sm ${
                  kpi.changeDirection === 'up' ? 'text-success' : 'text-error'
                }`}
              >
                {kpi.changeDirection === 'up' ? '▲' : '▼'} 전월 대비 {Math.abs(kpi.change)}%
              </p>
            )}
          </div>
          {/* 구분선 */}
          <div className="mx-5 mb-4 h-px bg-border" />
          {/* 상세 내용 */}
          <div className="px-5 pb-8">
            {detail ?? (
              <p className="text-center text-sm text-text-muted">상세 정보가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// KPI 레이블 → 텍스트/심볼 아이콘 매핑
const KPI_SYMBOL: Record<string, string> = {
  '이달 상담 건수': '#',
  '인기 디자인': '🎨',
  '평균 옵션 선택': 'avg',
  '재방문율': '%',
  '단골 고객': 'vip',
  '오늘 예약': 'cal',
};

const KPI_DESCRIPTION: Record<string, string> = {
  '이달 상담 건수': '이번 달 진행된 상담 건수 (완료+미확정, 사전상담 제외, 전월 대비 변화율)',
  '인기 디자인': '전체 상담 중 가장 많이 선택된 디자인 유형',
  '재방문율': '2회 이상 방문 고객 / 전체 고객 비율',
  '오늘 예약': '오늘 날짜에 등록된 예약 건수',
  '평균 옵션 선택': '상담 당 평균 추가 옵션 선택 개수',
  '단골 고객': '3회 이상 방문한 고객 수',
};

const VISIBLE_KPI_LABELS = new Set([
  '이달 상담 건수',
  '인기 디자인',
  '재방문율',
  '오늘 예약',
]);

export function KPICards() {
  const [selectedKPI, setSelectedKPI] = useState<KPICard | null>(null);
  const records = useRecordsStore((s) => s.records);
  const customers = useCustomerStore((s) => s.customers);
  const reservations = useReservationStore((s) => s.reservations);
  const kpiCards = useMemo(
    () => computeKPICards(records, customers, reservations),
    [records, customers, reservations],
  );
  const visibleKpiCards = useMemo(
    () => kpiCards.filter((kpi) => VISIBLE_KPI_LABELS.has(kpi.label)),
    [kpiCards],
  );

  return (
    <>
      {visibleKpiCards.map((kpi) => (
        <BentoCard
          key={kpi.label}
          span="1x1"
          variant="accent"
          hoverable
          onClick={() => setSelectedKPI(kpi)}
        >
          <div className="p-4 h-full flex flex-col justify-between">
            {/* Top: text symbol badge + info icon */}
            <div className="flex items-center justify-between">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
                style={{ background: 'var(--color-primary)' }}
              >
                {KPI_SYMBOL[kpi.label] ?? '#'}
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelectedKPI(kpi); }}
                className="group relative flex min-h-[44px] min-w-[44px] -m-[10px] items-center justify-center text-text-muted hover:text-primary transition-colors"
                aria-label={`${kpi.label} 설명`}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-text-muted/10 group-hover:bg-primary/10 transition-colors">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01" />
                  </svg>
                </span>
                <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[180px] rounded-lg bg-text px-2.5 py-1.5 text-[10px] leading-snug text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {KPI_DESCRIPTION[kpi.label] ?? ''}
                </span>
              </button>
            </div>

            {/* Middle: large value */}
            <div
              className="text-xl md:text-2xl font-extrabold text-primary leading-tight"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {kpi.value}
            </div>

            {/* Bottom row: label + change indicator */}
            <div className="flex items-end justify-between gap-1">
              <span className="text-xs text-text-secondary leading-tight">{kpi.label}</span>
              <div
                className={`flex items-center gap-0.5 text-xs font-medium flex-shrink-0 ${
                  kpi.changeDirection === 'up'
                    ? 'text-success'
                    : kpi.changeDirection === 'down'
                      ? 'text-error'
                      : 'text-text-muted'
                }`}
              >
                {kpi.changeDirection === 'up' ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                ) : kpi.changeDirection === 'down' ? (
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                ) : null}
                {kpi.changeDirection !== 'neutral' ? `${Math.abs(kpi.change)}%` : '—'}
              </div>
            </div>
          </div>
        </BentoCard>
      ))}

      {selectedKPI && (
        <KPIBottomSheet kpi={selectedKPI} onClose={() => setSelectedKPI(null)} />
      )}
    </>
  );
}
