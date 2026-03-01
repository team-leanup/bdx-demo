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
import { MOCK_DESIGNER_STATS } from '@/data/mock-dashboard';
import { formatPrice } from '@/lib/format';

// 테마 색상 CSS 변수 사용 (hardcoded 색상 제거)
const DESIGNER_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-text">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-xs text-text-secondary">
          {p.name}: {p.name === '매출' ? formatPrice(p.value) : `${p.value}건`}
        </p>
      ))}
    </div>
  );
}

export function DesignerPerformance() {
  const chartData = MOCK_DESIGNER_STATS.map((d) => ({
    name: d.designerName,
    상담수: d.consultations,
    매출: d.revenue,
  }));

  // 총 매출 기준 최대값 (프로그레스 바용)
  const maxRevenue = Math.max(...MOCK_DESIGNER_STATS.map((d) => d.revenue));

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {/* 선생님별 매출 비교 - 수평 프로그레스 바 */}
      <div>
        <p className="mb-3 text-xs font-medium text-text-secondary">선생님별 매출 비교</p>
        <div className="flex flex-col gap-3 md:gap-4">
          {MOCK_DESIGNER_STATS.map((d, i) => {
            const pct = Math.round((d.revenue / maxRevenue) * 100);
            return (
              <div key={d.designerId}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: DESIGNER_COLORS[i % DESIGNER_COLORS.length] }}
                    >
                      {d.designerName.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-text">{d.designerName}</span>
                  </div>
                  <span className="text-sm font-bold text-primary">{formatPrice(d.revenue)}</span>
                </div>
                <div className="h-2.5 md:h-3 w-full overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: DESIGNER_COLORS[i % DESIGNER_COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 상담수 바 차트 */}
      <div>
        <p className="mb-3 text-xs font-medium text-text-secondary">선생님별 상담 건수</p>
        <div className="h-[130px] md:h-44">
      <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 8, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: 'var(--color-text)' }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="상담수" radius={[0, 6, 6, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={DESIGNER_COLORS[i % DESIGNER_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* 개인별 카드 */}
      <div className="flex flex-col gap-2">
        {MOCK_DESIGNER_STATS.map((d, i) => (
          <div
            key={d.designerId}
            className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 md:p-4"
          >
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: DESIGNER_COLORS[i % DESIGNER_COLORS.length] }}
            >
              {d.designerName.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text">{d.designerName}</span>
                <span className="text-sm font-bold text-primary">{formatPrice(d.revenue)}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-3 text-xs text-text-secondary">
                <span>상담 {d.consultations}건</span>
                <span>·</span>
                <span>평균 {formatPrice(d.averagePrice)}</span>
                <span>·</span>
                <span>인기: {d.topDesign}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
