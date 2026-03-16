'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { PriceSummaryBar } from '@/components/consultation/PriceSummaryBar';
import { Accordion } from '@/components/ui';
import { BodyPartSelector } from '@/components/consultation/BodyPartSelector';
import { OffSelector } from '@/components/consultation/OffSelector';
import { ExtensionSelector } from '@/components/consultation/ExtensionSelector';
import { ShapeSelector } from '@/components/consultation/ShapeSelector';
import { DesignScopeSelector } from '@/components/consultation/DesignScopeSelector';
import { ExpressionSelector } from '@/components/consultation/ExpressionSelector';
import { PartsSelector } from '@/components/consultation/PartsSelector';
import { ColorSelector } from '@/components/consultation/ColorSelector';
import { DiscountModal } from '@/components/consultation/DiscountModal';
import { calculatePrice, buildServicePricingFromShopSettings } from '@/lib/price-calculator';
import { useAppStore } from '@/store/app-store';
import { formatPrice } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useT, useLocale, useKo } from '@/lib/i18n';
import { useConsultationGuard } from '@/lib/use-consultation-guard';

export default function ProPage() {
  useConsultationGuard();
  const router = useRouter();
  const consultation = useConsultationStore((s) => s.consultation);
  const setStep = useConsultationStore((s) => s.setStep);
  const [discountOpen, setDiscountOpen] = useState(false);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const shopSettings = useAppStore((s) => s.shopSettings);
  const pricing = useMemo(() => buildServicePricingFromShopSettings(shopSettings), [shopSettings]);

  const breakdown = calculatePrice(consultation, pricing);

  const handleNext = () => {
    setStep(ConsultationStep.CANVAS);
    router.push('/consultation/canvas');
  };

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={2}
        totalSteps={3}
        title={t('pro.title')}
        titleKo={tKo('pro.title')}
        backHref="/consultation/customer"
      />
      <PriceSummaryBar />

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] md:pb-6"
      >
        <div className="max-w-lg mx-auto flex flex-col gap-3">
          {/* Pro mode badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-surface-alt rounded-xl border border-border mb-2">
            <span className="text-sm font-semibold text-text">
              <span className="text-[15px] font-bold text-text">{t('pro.title')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold ml-1">{tKo('pro.title')}</span>
              )}
            </span>
            <span className="text-xs text-text-muted">— {t('consultation.proGuide')}</span>
          </div>

          {/* 기본 조건 */}
          <Accordion title={
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-text">{t('consultation.basicConditions')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('consultation.basicConditions')}</span>
              )}
            </span>
          } defaultOpen>
            <div className="flex flex-col gap-5 py-2">
              <BodyPartSelector />
              <OffSelector />
              <ExtensionSelector />
              <ShapeSelector />
            </div>
          </Accordion>

          {/* 시술 범위 */}
          <Accordion title={
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-text">{t('consultation.designScope')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('consultation.designScope')}</span>
              )}
            </span>
          } defaultOpen>
            <div className="py-2">
              <DesignScopeSelector />
            </div>
          </Accordion>

          {/* 표현 기법 */}
          <Accordion title={
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-text">{t('consultation.expressionTitle')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('consultation.expressionTitle')}</span>
              )}
            </span>
          }>
            <div className="py-2">
              <ExpressionSelector />
            </div>
          </Accordion>

          {/* 파츠 & 컬러 */}
          <Accordion title={
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-text">{t('consultation.addParts')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('consultation.addParts')}</span>
              )}
            </span>
          }>
            <div className="flex flex-col gap-5 py-2">
              <PartsSelector />
              <ColorSelector />
            </div>
          </Accordion>

          {/* 할인 & 예약금 */}
          <Accordion title={
            <span className="flex items-center gap-2">
              <span className="text-[15px] font-bold text-text">{t('consultation.discountApply')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('consultation.discountApply')}</span>
              )}
            </span>
          }>
            <div className="py-2">
              <button
                type="button"
                onClick={() => setDiscountOpen(true)}
                className="w-full py-3 px-4 rounded-xl border border-border bg-surface hover:bg-surface-alt transition-colors text-sm font-medium text-text flex items-center justify-between"
              >
                <span>
                  {t('consultation.discountApply')}
                  {locale !== 'ko' && (
                    <span className="ml-1 text-xs text-text-muted opacity-60">{tKo('consultation.discountApply')}</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  {(breakdown.discountAmount > 0 || breakdown.depositAmount > 0) && (
                    <span className="text-xs text-primary font-semibold">
                      -{formatPrice(breakdown.discountAmount + breakdown.depositAmount)}
                    </span>
                  )}
                  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </button>
            </div>
          </Accordion>
        </div>
      </motion.main>

      <ConsultationFooter onNext={handleNext} />
      <DiscountModal isOpen={discountOpen} onClose={() => setDiscountOpen(false)} />
    </div>
  );
}
