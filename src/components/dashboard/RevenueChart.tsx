'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/cn';
import { MOCK_DAILY_CONSULTATIONS } from '@/data/mock-dashboard';

type Period = 'daily' | 'weekly' | 'monthly';

function aggregateWeekly() {
  const weeks: Record<string, { consultations: number }> = {};
  for (const d of MOCK_DAILY_CONSULTATIONS) {
    const date = new Date(d.date);
    const day = date.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(date);
    monday.setDate(date.getDate() - diff);
    const key = `${monday.getMonth() + 1}/${monday.getDate()}주`;
    if (!weeks[key]) weeks[key] = { consultations: 0 };
    weeks[key].consultations += d.consultations;
  }
  return Object.entries(weeks).map(([label, v]) => ({ label, ...v }));
}

function aggregateMonthly() {
  const months: Record<string, { consultations: number }> = {};
  for (const d of MOCK_DAILY_CONSULTATIONS) {
    const date = new Date(d.date);
    const key = `${date.getMonth() + 1}월`;
    if (!months[key]) months[key] = { consultations: 0 };
    months[key].consultations += d.consultations;
  }
  return Object.entries(months).map(([label, v]) => ({ label, ...v }));
}

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

const PERIOD_LABELS: { key: Period; label: string }[] = [
  { key: 'daily', label: '일별' },
  { key: 'weekly', label: '주별' },
  { key: 'monthly', label: '월별' },
];

export function RevenueChart() {
  const [period, setPeriod] = useState<Period>('daily');

  const data = (() => {
    if (period === 'daily') {
      return MOCK_DAILY_CONSULTATIONS.slice(-14).map((d) => ({
        label: d.date.slice(5).replace('-', '/'),
        consultations: d.consultations,
      }));
    }
    if (period === 'weekly') return aggregateWeekly();
    return aggregateMonthly();
  })();

  return (
    <div>
      {/* 기간 토글 */}
      <div className="mb-4 flex gap-2">
        {PERIOD_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm font-medium transition-all',
              period === key
                ? 'bg-primary text-white shadow-sm'
                : 'bg-surface-alt text-text-secondary',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 차트 */}
      <div className="h-36 md:h-44">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="consultationGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}건`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="consultations"
            stroke="var(--color-primary)"
            strokeWidth={2}
            fill="url(#consultationGrad)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--color-primary)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
