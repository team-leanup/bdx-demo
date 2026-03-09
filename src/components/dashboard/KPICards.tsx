'use client';

import { useState, useMemo } from 'react';
import type { KPICard } from '@/lib/analytics';
import { BentoCard } from '@/components/ui';
import { useRecordsStore } from '@/store/records-store';
import { useCustomerStore } from '@/store/customer-store';
import { useReservationStore } from '@/store/reservation-store';
import { computeKPICards } from '@/lib/analytics';

// KPI별 드릴다운 상세 데이터
const KPI_DETAIL_MAP: Record<string, React.ReactNode> = {
  '이달 상담 건수': (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">완료된 상담</span>
        <span className="font-bold text-text">127건</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">하루 평균</span>
        <span className="font-bold text-text">약 5.8건</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">전월 대비</span>
        <span className="font-bold text-success">+5% ▲</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3">
        <span className="text-sm font-semibold text-primary">이번 주 누계</span>
        <span className="font-bold text-primary">14건</span>
      </div>
    </div>
  ),
  '인기 디자인': (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">원컬러</span>
        <span className="font-bold text-text">28% (35건)</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3">
        <span className="text-sm font-semibold text-primary">단색+포인트</span>
        <span className="font-bold text-primary">33% (42건)</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">풀아트</span>
        <span className="font-bold text-text">25% (32건)</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">이달의 아트</span>
        <span className="font-bold text-text">14% (18건)</span>
      </div>
    </div>
  ),
  '평균 옵션 선택': (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">상담당 평균</span>
        <span className="font-bold text-text">3.2개</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">최다 선택 조합</span>
        <span className="font-bold text-text">부위+쉐입+파츠</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">오프 포함 비율</span>
        <span className="font-bold text-text">41%</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3">
        <span className="text-sm font-semibold text-primary">전월 대비</span>
        <span className="font-bold text-success">+6% ▲</span>
      </div>
    </div>
  ),
  '재방문율': (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">재방문 고객</span>
        <span className="font-bold text-text">37명</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">신규 고객</span>
        <span className="font-bold text-text">8명</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-surface-alt p-3">
        <span className="text-sm text-text-secondary">평균 방문 주기</span>
        <span className="font-bold text-text">28일</span>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3">
        <span className="text-sm font-semibold text-primary">재방문율</span>
        <span className="font-bold text-primary">82.2%</span>
      </div>
    </div>
  ),
  '단골 고객': (
    <div className="flex flex-col gap-2">
      <p className="mb-1 text-xs text-text-muted">3회 이상 방문 고객 기준</p>
      {[
        { name: '이수진', visits: 12 },
        { name: '윤서연', visits: 9 },
        { name: '박지현', visits: 8 },
        { name: '김미영', visits: 5 },
        { name: '최은서', visits: 4 },
        { name: '정다은', visits: 4 },
        { name: '한지수', visits: 3 },
        { name: '오수빈', visits: 3 },
        { name: '강하은', visits: 3 },
        { name: '임채원', visits: 3 },
        { name: '서예린', visits: 3 },
        { name: '유지아', visits: 3 },
      ].map((customer, idx) => (
        <div
          key={customer.name}
          className="flex items-center justify-between rounded-xl bg-surface-alt px-4 py-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="w-5 text-xs text-text-muted">{idx + 1}</span>
            <span className="text-sm font-medium text-text">{customer.name}</span>
          </div>
          <span className="text-sm text-text-secondary">{customer.visits}회 방문</span>
        </div>
      ))}
    </div>
  ),
  '오늘 예약': (
    <div className="flex flex-col gap-2">
      {[
        { time: '10:00', name: '한소희', channel: '카카오톡' },
        { time: '13:00', name: '이지은', channel: '네이버' },
        { time: '15:30', name: '강민지', channel: '전화' },
        { time: '17:00', name: '오지영', channel: '워크인' },
      ].map((appt) => (
        <div
          key={appt.time}
          className="flex items-center justify-between rounded-xl bg-surface-alt px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <span className="w-12 text-sm font-bold text-primary">{appt.time}</span>
            <span className="text-sm font-medium text-text">{appt.name}</span>
          </div>
          <span className="rounded-full bg-border px-2 py-0.5 text-xs text-text-muted">
            {appt.channel}
          </span>
        </div>
      ))}
    </div>
  ),
};

interface BottomSheetProps {
  kpi: KPICard;
  onClose: () => void;
}

function KPIBottomSheet({ kpi, onClose }: BottomSheetProps) {
  const detail = KPI_DETAIL_MAP[kpi.label];

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
      />
      {/* 바텀시트 패널 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-background shadow-sm md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-lg md:rounded-2xl">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{kpi.icon}</span>
            <h3 className="text-base font-bold text-text">{kpi.label}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-text-muted"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
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

export function KPICards() {
  const [selectedKPI, setSelectedKPI] = useState<KPICard | null>(null);
  const records = useRecordsStore((s) => s.records);
  const customers = useCustomerStore((s) => s.customers);
  const reservations = useReservationStore((s) => s.reservations);
  const kpiCards = useMemo(
    () => computeKPICards(records, customers, reservations),
    [records, customers, reservations],
  );

  return (
    <>
      {kpiCards.map((kpi) => (
        <BentoCard
          key={kpi.label}
          span="1x1"
          variant="accent"
          hoverable
          onClick={() => setSelectedKPI(kpi)}
        >
          <div className="p-4 h-full flex flex-col justify-between">
            {/* Top: text symbol badge */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              {KPI_SYMBOL[kpi.label] ?? '#'}
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
