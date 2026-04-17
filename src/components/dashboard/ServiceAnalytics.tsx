'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { useRecordsStore } from '@/store/records-store';
import {
  computeDesignScopeBreakdown,
  computeExpressionBreakdown,
  computePopularTreatments,
} from '@/lib/analytics';

// Primary 계열 색상 팔레트 (CSS 변수 기반)
const THEME_COLORS = [
  'var(--color-primary)',
  'var(--color-primary-dark)',
  'color-mix(in srgb, var(--color-primary) 70%, white)',
  'color-mix(in srgb, var(--color-primary) 50%, white)',
];

export function ServiceAnalytics() {
  const records = useRecordsStore((s) => s.records);
  const designScopeBreakdown = useMemo(() => computeDesignScopeBreakdown(records), [records]);
  const expressionBreakdown = useMemo(() => computeExpressionBreakdown(records), [records]);
  const popularTreatments = useMemo(() => computePopularTreatments(records), [records]);

  const maxCount = Math.max(...popularTreatments.map((t) => t.count), 1);
  const topServices = popularTreatments
    .slice(0, 5)
    .map((t) => ({ name: t.name, count: t.count, maxCount }));
  const topServiceName = topServices[0]?.name ?? null;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* 인기 서비스 소모품 알림 */}
      {topServiceName && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
          <p className="flex items-start gap-1.5 text-xs text-text-secondary">
            <svg aria-hidden className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 00-3 9v1a1 1 0 001 1h4a1 1 0 001-1v-1a5 5 0 00-3-9z" />
            </svg>
            <span><strong className="font-semibold text-text">{topServiceName}</strong> 고객이 많습니다. 관련 팁/파츠 재고를 확인하세요.</span>
          </p>
        </div>
      )}

      {/* 인기 시술 TOP 5 - 프로그레스 바 */}
      <div>
        <p className="mb-3 text-xs font-medium text-text-secondary">인기 시술 TOP 5</p>
        <div className="flex flex-col gap-2.5">
          {topServices.map((service, idx) => {
            const pct = Math.round((service.count / service.maxCount) * 100);
            return (
              <div key={service.name}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: THEME_COLORS[idx % THEME_COLORS.length] }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm font-medium text-text">{service.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-text-secondary">{service.count}건</span>
                </div>
                <div className="h-2 md:h-3 w-full overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: THEME_COLORS[idx % THEME_COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 바 차트: 표현 기법별 건수 */}
      <div>
        <p className="mb-3 text-xs font-medium text-text-secondary">표현 기법별 건수</p>
        <div className="h-[130px] md:h-44">
      <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={expressionBreakdown}
            margin={{ top: 0, right: 4, left: -25, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0];
                return (
                  <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-lg">
                    <p className="text-xs font-medium text-text">{d.name}</p>
                    <p className="text-xs text-text-secondary">{d.value}건</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {expressionBreakdown.map((_, i) => (
                <Cell key={i} fill={THEME_COLORS[i % THEME_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* 시술 범위별 비율 - 수평 프로그레스 바 */}
      <div>
        <p className="mb-3 text-xs font-medium text-text-secondary">시술 범위별 비율</p>
        <div className="flex flex-col gap-2">
          {designScopeBreakdown.map((d, i) => (
            <div key={d.name} className="flex items-center gap-3">
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: THEME_COLORS[i % THEME_COLORS.length] }}
              />
              <span className="w-20 flex-shrink-0 text-xs text-text">{d.name}</span>
              <div className="flex-1">
                <div className="h-2 md:h-3 w-full overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${d.percentage}%`,
                      backgroundColor: THEME_COLORS[i % THEME_COLORS.length],
                      opacity: 0.85,
                    }}
                  />
                </div>
              </div>
              <span className="w-10 text-right text-xs font-medium text-text-secondary">
                {d.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
