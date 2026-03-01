'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MOCK_DAILY_REVENUE } from '@/data/mock-dashboard';
import { formatPrice } from '@/lib/format';

// 이번 주 데이터 (월~오늘, 2026-02-23 ~ 2026-02-26)
const THIS_WEEK_DATA = MOCK_DAILY_REVENUE.filter((d) => {
  const date = new Date(d.date);
  // 2026년 2월 23일(월) ~ 26일(목) 데이터
  return d.date >= '2026-02-23' && d.date <= '2026-02-26';
}).map((d) => {
  const date = new Date(d.date);
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  return {
    label: dayNames[date.getDay()],
    revenue: d.revenue,
    consultations: d.consultations,
  };
});

// 이번 주 통계
const weekRevenue = THIS_WEEK_DATA.reduce((s, d) => s + d.revenue, 0);
const weekConsultations = THIS_WEEK_DATA.reduce((s, d) => s + d.consultations, 0);
const weekAvg = weekConsultations > 0 ? Math.round(weekRevenue / weekConsultations) : 0;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs text-text-secondary">{label}요일</p>
      <p className="text-sm font-bold text-primary">{formatPrice(payload[0].value)}</p>
    </div>
  );
}

export function WeeklySummary() {
  return (
    <div className="flex flex-col gap-4">
      {/* 주간 통계 요약 */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="flex flex-col items-center rounded-xl bg-surface-alt p-3 md:p-4">
          <span className="text-base md:text-lg font-bold text-primary">{formatPrice(weekRevenue)}</span>
          <span className="mt-0.5 text-[10px] md:text-xs text-text-muted">주간 매출</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-surface-alt p-3 md:p-4">
          <span className="text-base md:text-lg font-bold text-text">{weekConsultations}건</span>
          <span className="mt-0.5 text-[10px] md:text-xs text-text-muted">주간 상담</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-surface-alt p-3 md:p-4">
          <span className="text-base md:text-lg font-bold text-text">{formatPrice(weekAvg)}</span>
          <span className="mt-0.5 text-[10px] md:text-xs text-text-muted">평균 단가</span>
        </div>
      </div>

      {/* 미니 바 차트 */}
      <div className="h-[110px] md:h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={THIS_WEEK_DATA}
            margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="revenue"
              fill="var(--color-primary)"
              radius={[6, 6, 0, 0]}
              opacity={0.85}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
