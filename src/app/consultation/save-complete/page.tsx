'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Suspense, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ConsultationSummaryCard } from '@/components/consultation/ConsultationSummaryCard';
import { useConsultationStore } from '@/store/consultation-store';
import { useT, useKo, useLocale } from '@/lib/i18n';

function SaveCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consultationId = searchParams.get('consultationId') ?? 'record-001';
  const mode = searchParams.get('mode') ?? 'default';
  const sourceShopId = useConsultationStore((s) => s.consultation.sourceShopId);
  const sourceShopName = useConsultationStore((s) => s.consultation.sourceShopName);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  useEffect(() => {
    if (mode !== 'preconsultation') {
      router.replace(`/records/${consultationId}`);
    }
  }, [mode, consultationId, router]);

  if (mode !== 'preconsultation') {
    return <div className="min-h-screen bg-background" />;
  }
  const customerLinkParams = new URLSearchParams();
  customerLinkParams.set('entry', 'customer-link');
  if (sourceShopId) customerLinkParams.set('shopId', sourceShopId);
  if (sourceShopName) customerLinkParams.set('shopName', sourceShopName);
  const customerLinkEntryHref = `/consultation?${customerLinkParams.toString()}`;

  return (
      <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="mb-4 flex flex-col items-center gap-3"
        >
          <Image src="/bdx-logo/bdx-symbol.svg" alt="BDX" width={80} height={80} className="h-20 w-20" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-text">{t('consultation.saveComplete.title')}</h1>
            {locale !== 'ko' && (
              <p className="text-xs text-text-muted opacity-60">{tKo('consultation.saveComplete.title')}</p>
            )}
            <p className="mt-1.5 text-sm text-text-secondary">
              {t('consultation.saveComplete.designConfirmed')}
            </p>
            {locale !== 'ko' && (
              <p className="text-xs text-text-muted opacity-60">{tKo('consultation.saveComplete.designConfirmed')}</p>
            )}
          </div>
        </motion.div>

        {sourceShopName && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="w-full max-w-sm mb-4 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Consultation Link</p>
            <p className="mt-1 text-sm font-bold text-text">{sourceShopName}</p>
            <p className="mt-1 text-xs text-text-muted">
              {t('consultation.saveComplete.shopLinkSaved').replace('{shopName}', sourceShopName ?? '')}
              {locale !== 'ko' && (
                <span className="block opacity-60 mt-0.5 text-[10px]">
                  {tKo('consultation.saveComplete.shopLinkSaved').replace('{shopName}', sourceShopName ?? '')}
                </span>
              )}
            </p>
          </motion.div>
        )}

        {/* 매장 도착 안내 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="w-full max-w-sm mb-4 flex items-start gap-3 p-4 rounded-2xl border border-primary/20 bg-primary/5"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <svg className="h-5 w-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349M3.75 21H6m0 0h2.25m0-11.177v-.958c0-.568.422-1.048.987-1.106a48.554 48.554 0 019.526 0 1.114 1.114 0 01.987 1.106v.958" />
            </svg>
          </div>
          <p className="text-sm text-text-secondary">
            {t('consultation.saveComplete.showAtArrival')}
            {locale !== 'ko' && (
              <span className="block text-xs text-text-muted opacity-60 mt-0.5">
                {tKo('consultation.saveComplete.showAtArrival')}
              </span>
            )}
          </p>
        </motion.div>

        {/* 상담 요약 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="w-full max-w-sm mb-4"
        >
          <ConsultationSummaryCard />
        </motion.div>

        <div className="w-full max-w-sm flex flex-col gap-3">
          <button
            onClick={() => router.push(customerLinkEntryHref)}
            className="w-full rounded-2xl bg-primary px-5 py-4 text-left text-white transition-all active:scale-[0.98]"
          >
            <p className="text-base font-bold">{t('consultation.saveComplete.newConsultation')}</p>
            {locale !== 'ko' && (
              <p className="text-xs opacity-60">{tKo('consultation.saveComplete.newConsultation')}</p>
            )}
            <p className="mt-1 text-sm opacity-85">{t('consultation.saveComplete.newConsultationDesc')}</p>
            {locale !== 'ko' && (
              <p className="text-xs opacity-60">{tKo('consultation.saveComplete.newConsultationDesc')}</p>
            )}
          </button>
        </div>
      </div>
  );
}

export default function SaveCompletePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SaveCompleteContent />
    </Suspense>
  );
}
