'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { PriceSummaryBar } from '@/components/consultation/PriceSummaryBar';

import { PartsSelector } from '@/components/consultation/PartsSelector';
import { ColorSelector } from '@/components/consultation/ColorSelector';
import { useT, useLocale, useKo } from '@/lib/i18n';

export default function Step3Page() {
  const router = useRouter();
  const setStep = useConsultationStore((s) => s.setStep);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const handleNext = () => {
    setStep(ConsultationStep.STEP3_OPTIONS);
    router.push('/consultation/traits');
  };

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={4}
        totalSteps={6}
        title={t('consultation.step3Title')}
        titleKo={tKo('consultation.step3Title')}
        backHref="/consultation/step2"
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
              {/* Sparkles icon */}
              <svg width="36" height="36" viewBox="0 0 56 56" fill="none" className="text-primary">
                <path d="M28 8 L30 20 L42 22 L30 24 L28 36 L26 24 L14 22 L26 20 Z" fill="currentColor" fillOpacity="0.8" />
                <path d="M44 4 L45 10 L51 11 L45 12 L44 18 L43 12 L37 11 L43 10 Z" fill="currentColor" fillOpacity="0.6" />
                <path d="M12 36 L13 40 L17 41 L13 42 L12 46 L11 42 L7 41 L11 40 Z" fill="currentColor" fillOpacity="0.5" />
                <circle cx="44" cy="36" r="2.5" fill="currentColor" fillOpacity="0.4" />
                <circle cx="14" cy="14" r="2" fill="currentColor" fillOpacity="0.4" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-0.5">
                {t('consultation.step3Title')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[9px] opacity-60 normal-case">{tKo('consultation.step3Title')}</span>
                )}
              </p>
              <h2 className="text-lg font-bold text-text">{t('consultation.step3Title')}</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {t('consultation.additionalOptions')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[9px] opacity-60">{tKo('consultation.additionalOptions')}</span>
                )}
              </p>
            </div>
          </motion.div>

          <PartsSelector />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium flex flex-col items-center">
              <span className="text-[15px] font-bold text-text">{t('step3.colorTitle')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('step3.colorTitle')}</span>
              )}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <ColorSelector />

          <div className="flex items-center justify-center pt-4">
            <button
              onClick={() => {
                setStep(ConsultationStep.CANVAS);
                router.push('/consultation/canvas');
              }}
              className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-alt rounded-xl hover:bg-surface-alt/80 transition-colors"
            >
              캔버스 (선택)
              {locale !== 'ko' && (
                <span className="ml-1 text-xs opacity-60">Canvas (Optional)</span>
              )}
            </button>
          </div>
        </div>
      </motion.main>

      <ConsultationFooter onNext={handleNext} showEstimated={false} />
    </div>
  );
}
