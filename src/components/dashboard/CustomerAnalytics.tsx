'use client';

import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrice } from '@/lib/format';
import { useRecordsStore } from '@/store/records-store';
import { useCustomerStore } from '@/store/customer-store';
import { computeCustomerAnalytics } from '@/lib/analytics';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-text">{payload[0].name}</p>
      <p className="text-xs text-text-secondary">{payload[0].value}명</p>
    </div>
  );
}

export function CustomerAnalytics() {
  const records = useRecordsStore((s) => s.records);
  const customers = useCustomerStore((s) => s.customers);
  const analytics = useMemo(
    () => computeCustomerAnalytics(records, customers),
    [records, customers],
  );

  const pieData = [
    { name: '재방문', value: analytics.returningCustomers },
    { name: '신규', value: analytics.newCustomers },
  ];

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* 신규 vs 재방문 */}
      <div>
        <p className="mb-3 text-xs font-medium text-text-secondary">신규 vs 재방문</p>
        <div className="flex items-center gap-4 md:gap-6">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                dataKey="value"
                nameKey="name"
                paddingAngle={3}
              >
                <Cell fill="var(--color-primary)" />
                <Cell fill="var(--color-border)" />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-1 flex-col gap-3 md:gap-4">
            <div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-xs text-text">재방문</span>
              </div>
              <p className="mt-0.5 text-lg font-bold text-text">
                {analytics.returningCustomers}명
              </p>
              <p className="text-xs text-text-muted">
                {analytics.returningPercentage}%
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                <span className="text-xs text-text">신규</span>
              </div>
              <p className="mt-0.5 text-lg font-bold text-text">
                {analytics.newCustomers}명
              </p>
              <p className="text-xs text-text-muted">
                {analytics.newPercentage}%
              </p>
            </div>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-surface-alt p-3 text-center">
          <p className="text-xs text-text-secondary">
            평균 방문 주기: <span className="font-semibold text-primary">{analytics.averageVisitInterval}일</span>
          </p>
        </div>
      </div>

      {/* VIP 고객 */}
      <div>
        <p className="mb-3 text-xs font-medium text-text-secondary">VIP 고객 TOP 5</p>
        <div className="flex flex-col gap-2">
          {analytics.vipCustomers.map((vip, idx) => (
            <div
              key={vip.name}
              className="flex items-center gap-3 rounded-xl bg-surface-alt p-3 md:p-4"
            >
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text">{vip.name}</span>
                  <span className="text-sm font-bold text-primary">
                    {formatPrice(vip.totalSpend)}
                  </span>
                </div>
                <p className="text-xs text-text-secondary">방문 {vip.visitCount}회</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
