'use client';

import { BentoGrid, BentoCard } from '@/components/ui';
import { FeatureDiscovery } from '@/components/onboarding/FeatureDiscovery';
import { KPICards } from '@/components/dashboard/KPICards';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ServiceAnalytics } from '@/components/dashboard/ServiceAnalytics';
import { CustomerAnalytics } from '@/components/dashboard/CustomerAnalytics';
import { DesignerPerformance } from '@/components/dashboard/DesignerPerformance';
import { WeeklySummary } from '@/components/dashboard/WeeklySummary';
import { HourlyBookings } from '@/components/dashboard/HourlyBookings';
import { useAuthStore } from '@/store/auth-store';

// 인사이트 카드 데이터
const POPULAR_TREATMENTS = [
  { rank: 1, name: '원컬러+포인트', count: 42 },
  { rank: 2, name: '그라데이션', count: 38 },
  { rank: 3, name: '풀아트', count: 32 },
];

const REGULAR_VISIT_RATE = 68; // %

const PEAK_HOURS = [
  { time: '13:00~14:00', label: '점심 후', count: 24 },
  { time: '15:00~16:00', label: '오후', count: 19 },
  { time: '11:00~12:00', label: '오전 말', count: 15 },
];

export default function DashboardPage() {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });
  const role = useAuthStore((s) => s.role);
  const isOwner = useAuthStore((s) => s.isOwner);
  const activeDesignerName = useAuthStore((s) => s.activeDesignerName);

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
        description="매출 추이, 인기 서비스, 고객 분석 등 매장 운영 현황을 한눈에 확인하세요."
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
          {/* KPI Row: 4 × 1×1 BentoCards (returned as Fragment children) */}
          <KPICards />

          {/* 매출 추이: 2×2 */}
          <BentoCard span="2x2">
            <div className="p-4 md:p-5 h-full flex flex-col">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">매출 추이</h2>
              <div className="flex-1 min-h-0">
                <RevenueChart />
              </div>
            </div>
          </BentoCard>

          {/* 주간요약 + 디자이너 성과: 2×2 */}
          <BentoCard span="2x2">
            <div className="p-4 md:p-5 h-full flex flex-col gap-4">
              <div>
                <h2 className="text-sm font-semibold text-text-secondary mb-3">이번 주 요약</h2>
                <WeeklySummary />
              </div>
              <div className="flex-1 min-h-0">
                <h2 className="text-sm font-semibold text-text-secondary mb-3">선생님별 매출</h2>
                <DesignerPerformance />
              </div>
            </div>
          </BentoCard>

          {/* 시간대별 예약: 4×1 */}
          <BentoCard span="4x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">시간대별 예약</h2>
              <HourlyBookings />
            </div>
          </BentoCard>

          {/* 인기 시술 Top 3: 2×1 */}
          <BentoCard span="2x1" variant="accent">
            <div className="p-4 md:p-5 h-full flex flex-col">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">인기 시술 Top 3</h2>
              <div className="flex flex-col gap-2.5 flex-1">
                {POPULAR_TREATMENTS.map((t) => (
                  <div key={t.rank} className="flex items-center gap-3">
                    <div
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: 'var(--color-primary)' }}
                    >
                      {t.rank}
                    </div>
                    <span className="flex-1 text-sm text-text">{t.name}</span>
                    <span className="text-xs font-semibold text-primary">{t.count}건</span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* 단골 방문율: 1×1 */}
          <BentoCard span="1x1" variant="accent">
            <div className="p-4 h-full flex flex-col justify-between">
              <span className="text-xs font-semibold text-text-secondary">단골 방문율</span>
              <div className="flex flex-col gap-1">
                <span
                  className="text-3xl font-extrabold text-primary leading-none"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {REGULAR_VISIT_RATE}%
                </span>
                <div className="h-2 w-full rounded-full bg-surface-alt overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${REGULAR_VISIT_RATE}%`, background: 'var(--color-primary)' }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-text-muted">이번 달 기준</span>
            </div>
          </BentoCard>

          {/* 피크타임: 1×1 */}
          <BentoCard span="1x1" variant="accent">
            <div className="p-4 h-full flex flex-col gap-2">
              <span className="text-xs font-semibold text-text-secondary">피크타임</span>
              <div className="flex flex-col gap-1.5 flex-1">
                {PEAK_HOURS.map((h, i) => (
                  <div key={h.time} className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-full flex-1"
                      style={{
                        background: 'var(--color-primary)',
                        opacity: 1 - i * 0.25,
                      }}
                    />
                    <span className="text-[10px] text-text-secondary flex-shrink-0">{h.time.split('~')[0]}</span>
                  </div>
                ))}
              </div>
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
    </div>
  );
}
