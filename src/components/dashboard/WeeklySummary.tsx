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
} from 'recharts';
import { useRecordsStore } from '@/store/records-store';
import { computeDailyConsultations } from '@/lib/analytics';

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
      <p className="text-sm font-bold text-primary">{payload[0].value}건</p>
    </div>
  );
}

export function WeeklySummary() {
  const records = useRecordsStore((s) => s.records);

  const THIS_WEEK_DATA = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const mondayStr = monday.toISOString().slice(0, 10);
    const sundayStr = sunday.toISOString().slice(0, 10);

    const daily = computeDailyConsultations(records, 14);
    return daily
      .filter((d) => d.date >= mondayStr && d.date <= sundayStr)
      .map((d) => {
        const date = new Date(d.date + 'T00:00:00');
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        return { label: dayNames[date.getDay()], consultations: d.consultations };
      });
  }, [records]);

  const weekConsultations = THIS_WEEK_DATA.reduce((s, d) => s + d.consultations, 0);
  const workDays = THIS_WEEK_DATA.filter((d) => d.consultations > 0).length;
  const dayAvg = workDays > 0 ? Math.round(weekConsultations / workDays) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* 주간 통계 요약 */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="flex flex-col items-center rounded-xl bg-surface-alt p-3 md:p-4">
          <span className="text-base md:text-lg font-bold text-primary">{weekConsultations}건</span>
          <span className="mt-0.5 text-[10px] md:text-xs text-text-muted">주간 상담</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-surface-alt p-3 md:p-4">
          <span className="text-base md:text-lg font-bold text-text">{workDays}일</span>
          <span className="mt-0.5 text-[10px] md:text-xs text-text-muted">영업일</span>
        </div>
        <div className="flex flex-col items-center rounded-xl bg-surface-alt p-3 md:p-4">
          <span className="text-base md:text-lg font-bold text-text">{dayAvg}건</span>
          <span className="mt-0.5 text-[10px] md:text-xs text-text-muted">일 평균</span>
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
              tickFormatter={(v) => `${v}건`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="consultations"
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
