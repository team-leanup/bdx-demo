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
import { useReservationStore } from '@/store/reservation-store';
import { useShopStore } from '@/store/shop-store';
import { computeDesignerStats } from '@/lib/analytics';
import { formatPrice } from '@/lib/format';

// 테마 색상 CSS 변수 사용 (hardcoded 색상 제거)
// 디자이너별 고유 색상 — primary 계열 농도를 넓게 분산하여 겹치지 않도록
const DESIGNER_COLORS = [
  'var(--color-primary)',                                          // 100%
  'color-mix(in srgb, var(--color-primary) 70%, white)',           // 70%
  'color-mix(in srgb, var(--color-primary) 45%, white)',           // 45%
  'color-mix(in srgb, var(--color-primary) 75%, #6B21A8)',         // 보라 쉬프트
  'color-mix(in srgb, var(--color-primary) 70%, #F97316)',         // 코럴 쉬프트
  'color-mix(in srgb, var(--color-primary) 25%, white)',           // 25%
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
          {p.name}: {p.name.includes('율') ? `${p.value}%` : `${p.value}건`}
        </p>
      ))}
    </div>
  );
}

export function DesignerPerformance() {
  const records = useRecordsStore((s) => s.records);
  const reservations = useReservationStore((s) => s.reservations);
  const designers = useShopStore((s) => s.designers);
  const designerStats = useMemo(
    () => computeDesignerStats(records, designers, reservations),
    [records, designers, reservations],
  );

  const rateChartData = designerStats.map((d) => ({
    name: d.designerName,
    '예약 배정률': d.assignedBookingRate,
    '상담 완료율': d.consultationCompletionRate,
  }));

  // 상담 건수 기준 최대값 (프로그레스 바용)
  const maxConsultations = Math.max(...designerStats.map((d) => d.consultations), 1);

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {/* 디자이너별 상담 건수 비교 - 수평 프로그레스 바 */}
      <div>
        <p className="mb-3 text-xs font-medium text-text-secondary">디자이너별 상담 건수 비교</p>
        <div className="flex flex-col gap-3 md:gap-4">
          {designerStats.map((d, i) => {
            const pct = Math.round((d.consultations / maxConsultations) * 100);
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
                    <div>
                      <span className="text-sm font-medium text-text">{d.designerName}</span>
                      <p className="text-[11px] text-text-muted">매출 {formatPrice(d.revenue)}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary">{d.consultations}건</span>
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

      <div>
        <p className="mb-3 text-xs font-medium text-text-secondary">예약 배정률 / 상담 완료율</p>
        <div className="h-[160px] md:h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rateChartData} margin={{ top: 0, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--color-text)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}%`}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="예약 배정률" radius={[6, 6, 0, 0]} fill="var(--color-primary)" minPointSize={2} />
              <Bar dataKey="상담 완료율" radius={[6, 6, 0, 0]} fill="color-mix(in srgb, var(--color-primary) 50%, white)" minPointSize={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 개인별 카드 */}
      <div className="flex flex-col gap-2">
        {designerStats.map((d, i) => (
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
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-text-secondary">
                <div className="rounded-lg bg-surface-alt px-3 py-2">
                  <p className="text-[10px] text-text-muted">상담 건수</p>
                  <p className="mt-0.5 font-semibold text-text">{d.consultations}건</p>
                </div>
                <div className="rounded-lg bg-surface-alt px-3 py-2">
                  <p className="text-[10px] text-text-muted">예약 배정률</p>
                  <p className="mt-0.5 font-semibold text-text">{d.assignedBookingRate}%</p>
                </div>
                <div className="rounded-lg bg-surface-alt px-3 py-2">
                  <p className="text-[10px] text-text-muted">상담 완료율</p>
                  <p className="mt-0.5 font-semibold text-text">{d.consultationCompletionRate}%</p>
                </div>
                <div className="rounded-lg bg-surface-alt px-3 py-2">
                  <p className="text-[10px] text-text-muted">완료 예약</p>
                  <p className="mt-0.5 font-semibold text-text">{d.completedReservations}/{d.bookings}건</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
                <span>인기: {d.topDesign}</span>
                <span>·</span>
                <span>인기 쉐입: {d.topShape}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
