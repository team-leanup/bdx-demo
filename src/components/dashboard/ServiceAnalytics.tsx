'use client';

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
import { MOCK_DESIGN_SCOPE_BREAKDOWN, MOCK_EXPRESSION_BREAKDOWN } from '@/data/mock-dashboard';

// Primary 계열 색상 팔레트 (CSS 변수 기반)
const THEME_COLORS = [
  'var(--color-primary)',
  'var(--color-primary-dark)',
  'color-mix(in srgb, var(--color-primary) 70%, white)',
  'color-mix(in srgb, var(--color-primary) 50%, white)',
];

// 인기 시술 TOP 5 데이터 (디자인 범위 + 기법 통합)
const TOP_SERVICES = [
  { name: '단색+포인트', count: 42, maxCount: 42 },
  { name: '원컬러', count: 35, maxCount: 42 },
  { name: '풀아트', count: 32, maxCount: 42 },
  { name: '그라데이션', count: 38, maxCount: 42 },
  { name: '이달의 아트', count: 18, maxCount: 42 },
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { percentage: number } }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-text">{d.name}</p>
      <p className="text-xs text-text-secondary">{d.payload.percentage}% · {d.value}건</p>
    </div>
  );
}

export function ServiceAnalytics() {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* 인기 시술 TOP 5 - 프로그레스 바 */}
      <div>
        <p className="mb-3 text-xs font-medium text-text-secondary">인기 시술 TOP 5</p>
        <div className="flex flex-col gap-2.5">
          {TOP_SERVICES.map((service, idx) => {
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
            data={MOCK_EXPRESSION_BREAKDOWN}
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
              {MOCK_EXPRESSION_BREAKDOWN.map((_, i) => (
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
          {MOCK_DESIGN_SCOPE_BREAKDOWN.map((d, i) => (
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
