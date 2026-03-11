'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { PriceSummaryBar } from '@/components/consultation/PriceSummaryBar';
import { BodyPartSelector } from '@/components/consultation/BodyPartSelector';
import { OffSelector } from '@/components/consultation/OffSelector';
import { ExtensionSelector } from '@/components/consultation/ExtensionSelector';
import { ShapeSelector } from '@/components/consultation/ShapeSelector';
import { useT, useLocale, useKo } from '@/lib/i18n';
import { useConsultationGuard } from '@/lib/use-consultation-guard';

export default function Step1Page() {
  useConsultationGuard();
  const router = useRouter();
  const setStep = useConsultationStore((s) => s.setStep);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const handleNext = () => {
    setStep(ConsultationStep.STEP2_DESIGN);
    router.push('/consultation/step2');
  };

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={2}
        totalSteps={5}
        title={t('consultation.step1Title')}
        titleKo={tKo('consultation.step1Title')}
        backHref="/consultation/customer"
      />
      <PriceSummaryBar />

      <motion.main
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-y-auto px-4 md:px-8 pt-5 pb-28 md:pb-6"
      >
        <div className="max-w-2xl md:max-w-3xl mx-auto flex flex-col gap-6">
          {/* Visual Step Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-surface-alt border border-border"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-alt border border-border flex items-center justify-center flex-shrink-0">
              <svg width="36" height="36" viewBox="0 0 56 56" fill="none" className="text-primary">
                <rect x="14" y="8" width="28" height="38" rx="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
                <path d="M22 26l4 4 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 38h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-0.5">
                {t('consultation.step1Title')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[9px] opacity-60 normal-case">{tKo('consultation.step1Title')}</span>
                )}
              </p>
              <h2 className="text-lg font-bold text-text">{t('consultation.step1Title')}</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {t('consultation.basicConditions')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[9px] opacity-60">{tKo('consultation.basicConditions')}</span>
                )}
              </p>
            </div>
          </motion.div>

          <BodyPartSelector />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium flex flex-col items-center">
              <span className="text-[15px] font-bold text-text">{t('step1.removalExtension')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('step1.removalExtension')}</span>
              )}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <OffSelector />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium flex flex-col items-center">
              <span className="text-[15px] font-bold text-text">{t('step1.extensionRepair')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('step1.extensionRepair')}</span>
              )}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <ExtensionSelector />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium flex flex-col items-center">
              <span className="text-[15px] font-bold text-text">{t('step1.nailShape')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('step1.nailShape')}</span>
              )}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <ShapeSelector />
        </div>
      </motion.main>

      <ConsultationFooter onNext={handleNext} showEstimated={false} />
    </div>
  );
}
