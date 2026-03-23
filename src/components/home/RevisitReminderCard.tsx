'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useCustomerStore } from '@/store/customer-store';
import { formatRelativeDate } from '@/lib/format';

interface RevisitReminderCardProps {
  shopName: string;
  itemVariants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number; transition: { duration: number; ease: number[] } };
  };
}

const FOUR_WEEKS_MS = 28 * 24 * 60 * 60 * 1000;

export function RevisitReminderCard({
  shopName,
  itemVariants,
}: RevisitReminderCardProps): React.ReactElement | null {
  const customers = useCustomerStore((s) => s.customers);

  const overdueCustomers = useMemo(() => {
    const threshold = Date.now() - FOUR_WEEKS_MS;
    return customers
      .filter((c) => c.lastVisitDate && new Date(c.lastVisitDate).getTime() < threshold)
      .sort((a, b) => new Date(a.lastVisitDate).getTime() - new Date(b.lastVisitDate).getTime())
      .slice(0, 5);
  }, [customers]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (overdueCustomers.length === 0) return null;

  const copyMessage = (customerId: string, customerName: string): void => {
    const msg = `안녕하세요, ${customerName}님! ${shopName}입니다. 마지막 방문 이후 한 달이 지났네요. 예약을 도와드릴까요?`;
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedId(customerId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch((e) => console.warn('[clipboard] copy failed:', e));
  };

  return (
    <motion.div variants={itemVariants} className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span className="text-sm font-bold text-text">재방문 알림</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1.5 text-[10px] font-bold text-white">
          {overdueCustomers.length}
        </span>
        <span className="text-xs text-text-muted">· 4주 이상 미방문 단골</span>
      </div>

      <div className="flex flex-col">
        {overdueCustomers.map((customer, idx) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.3 }}
            className="flex items-center gap-3 px-4 py-3 border-t border-border"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
              <span className="text-sm font-bold text-primary">{customer.name.slice(0, 1)}</span>
            </div>
            <div className="flex flex-1 flex-col min-w-0">
              <span className="text-sm font-semibold text-text">{customer.name}</span>
              <span className="text-xs text-text-muted">마지막 방문 {formatRelativeDate(customer.lastVisitDate)}</span>
            </div>
            <button
              onClick={() => copyMessage(customer.id, customer.name)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white active:scale-95 transition-all ${copiedId === customer.id ? 'bg-green-600' : 'bg-primary'}`}
            >
              {copiedId === customer.id ? '복사 완료!' : '메시지 복사'}
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
