'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { MOCK_HOURLY_DISTRIBUTION } from '@/data/mock-dashboard';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs text-text-secondary">{label}</p>
      <p className="text-sm font-bold text-primary">{payload[0].value}건</p>
    </div>
  );
}

// 피크 시간대 탐지
const maxCount = Math.max(...MOCK_HOURLY_DISTRIBUTION.map((d) => d.count));

export function HourlyBookings() {
  const peakHour = MOCK_HOURLY_DISTRIBUTION.find((d) => d.count === maxCount);
  const totalBookings = MOCK_HOURLY_DISTRIBUTION.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* 피크 시간 요약 */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex-1 rounded-xl bg-primary/10 p-3 md:p-4">
          <p className="text-xs text-text-secondary">피크 시간대</p>
          <p className="text-base md:text-lg font-bold text-primary">{peakHour?.label ?? '-'}</p>
          <p className="text-xs text-text-muted">{peakHour?.count}건 집중</p>
        </div>
        <div className="flex-1 rounded-xl bg-surface-alt p-3 md:p-4">
          <p className="text-xs text-text-secondary">월 총 예약</p>
          <p className="text-base md:text-lg font-bold text-text">{totalBookings}건</p>
          <p className="text-xs text-text-muted">이달 기준</p>
        </div>
      </div>

      {/* 시간대별 바 차트 */}
      <div className="h-[140px] md:h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={MOCK_HOURLY_DISTRIBUTION}
          margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {MOCK_HOURLY_DISTRIBUTION.map((d) => (
              <Cell
                key={d.hour}
                fill={
                  d.count === maxCount
                    ? 'var(--color-primary)'
                    : 'var(--color-primary)'
                }
                opacity={d.count === maxCount ? 1 : 0.45 + (d.count / maxCount) * 0.45}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>

      {/* 시간대별 텍스트 리스트 (상위 3개 강조) */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-text-secondary">상위 예약 시간대</p>
        {[...MOCK_HOURLY_DISTRIBUTION]
          .sort((a, b) => b.count - a.count)
          .slice(0, 3)
          .map((d, idx) => (
            <div key={d.hour} className="flex items-center justify-between rounded-xl bg-surface-alt px-4 py-2">
              <div className="flex items-center gap-2">
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: 'var(--color-primary)', opacity: 1 - idx * 0.2 }}
                >
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-text">{d.label}</span>
              </div>
              <span className="text-sm font-semibold text-primary">{d.count}건</span>
            </div>
          ))}
      </div>
    </div>
  );
}
