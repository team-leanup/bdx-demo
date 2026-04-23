'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useCustomerStore } from '@/store/customer-store';
import { useAppStore } from '@/store/app-store';
import { formatRelativeDate } from '@/lib/format';
import { renderRevisitMessage } from '@/components/settings/RevisitMessageSection';

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
  // 0423 반영: 설정 탭의 기본 문구틀을 사용 (없으면 기본값)
  const revisitTemplate = useAppStore((s) => s.shopSettings.revisitMessageTemplate);

  const overdueCustomers = useMemo(() => {
    const threshold = Date.now() - FOUR_WEEKS_MS;
    return customers
      .filter((c) => c.lastVisitDate && new Date(c.lastVisitDate).getTime() < threshold)
      .sort((a, b) => {
        // H-7: 단골 우선 정렬, 같은 그룹 내에서는 마지막 방문 오래된 순
        if (a.isRegular && !b.isRegular) return -1;
        if (!a.isRegular && b.isRegular) return 1;
        return new Date(a.lastVisitDate).getTime() - new Date(b.lastVisitDate).getTime();
      })
      .slice(0, 5);
  }, [customers]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (overdueCustomers.length === 0) return null;

  const buildMessage = (customerName: string): string =>
    renderRevisitMessage(revisitTemplate ?? '', { customerName, shopName });

  const copyMessage = (customerId: string, customerName: string): void => {
    const msg = buildMessage(customerName);
    navigator.clipboard.writeText(msg).then(() => {
      setCopiedId(customerId);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch((e) => console.warn('[clipboard] copy failed:', e));
  };

  const sendSms = (phone: string, customerName: string): void => {
    const msg = buildMessage(customerName);
    const cleaned = phone.replace(/\D/g, '');
    window.open(`sms:${cleaned}?body=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <motion.div variants={itemVariants} className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span className="text-sm font-semibold text-text">재방문 알림</span>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1.5 text-[10px] font-medium text-white">
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
              <span className="text-sm font-medium text-primary">{customer.name.slice(0, 1)}</span>
            </div>
            <div className="flex flex-1 flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-text truncate">{customer.name}</span>
                {/* H-7: 단골 배지 */}
                {customer.isRegular && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 leading-none">
                    단골
                  </span>
                )}
              </div>
              <span className="text-xs text-text-muted">마지막 방문 {formatRelativeDate(customer.lastVisitDate)}</span>
            </div>
            {/* H-6: SMS 버튼 + 복사 버튼 그룹 */}
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={() => sendSms(customer.phone, customer.name)}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface-alt text-text-secondary active:scale-95 transition-all hover:bg-border"
                title="문자 보내기"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
                </svg>
              </button>
              <button
                onClick={() => copyMessage(customer.id, customer.name)}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white active:scale-95 transition-all ${copiedId === customer.id ? 'bg-green-600' : 'bg-primary'}`}
              >
                {copiedId === customer.id ? '복사 완료!' : '복사'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
