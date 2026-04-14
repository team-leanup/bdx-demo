'use client';

import { useMemo } from 'react';
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
import { useReservationStore } from '@/store/reservation-store';
import { computeHourlyDistribution } from '@/lib/analytics';

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

export function HourlyBookings() {
  const reservations = useReservationStore((s) => s.reservations);
  const hourlyData = useMemo(() => computeHourlyDistribution(reservations), [reservations]);
  const maxCount = Math.max(...hourlyData.map((d) => d.count), 0);
  const peakHour = hourlyData.find((d) => d.count === maxCount && maxCount > 0);
  const totalBookings = hourlyData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      {/* 피크 시간 요약 */}
      <div className="flex items-center gap-3 md:gap-4">
        <div className="flex-1 rounded-xl bg-primary/10 p-3 md:p-4">
          <p className="text-xs text-text-secondary">피크 시간대</p>
          <p className="text-base md:text-lg font-bold text-primary">{peakHour?.label ?? '-'}</p>
          <p className="text-xs text-text-muted">{peakHour ? `${peakHour.count}건 집중` : '데이터 없음'}</p>
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
          data={hourlyData}
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
            {hourlyData.map((d) => (
              <Cell
                key={d.hour}
                fill="var(--color-primary)"
                opacity={maxCount > 0 && d.count === maxCount ? 1 : 0.45 + (maxCount > 0 ? (d.count / maxCount) * 0.45 : 0)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>

      {/* 피크 타임 운영 팁 */}
      {peakHour && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
          <p className="text-xs text-text-secondary">
            💡 <strong className="font-semibold text-text">{peakHour.hour}시</strong>가 가장 바쁩니다. 보조 인력 배치를 고려해보세요.
          </p>
        </div>
      )}

      {/* 시간대별 텍스트 리스트 (상위 3개 강조) */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-text-secondary">상위 예약 시간대</p>
        {[...hourlyData]
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
