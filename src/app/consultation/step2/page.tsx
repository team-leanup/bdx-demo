'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { PriceSummaryBar } from '@/components/consultation/PriceSummaryBar';
import { useT, useLocale, useKo } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { useConsultationGuard } from '@/lib/use-consultation-guard';

type TreatmentType = 'oneColor' | 'gradient' | 'magneticGel' | 'art';

interface TreatmentOption {
  id: TreatmentType;
  icon: string;
  labelKey: string;
  designScope: 'solid_tone' | 'full_art';
  expressions: ('solid' | 'gradient' | 'magnetic')[];
}

const TREATMENT_OPTIONS: TreatmentOption[] = [
  {
    id: 'oneColor',
    icon: '💅',
    labelKey: 'consultation.treatmentType.oneColor',
    designScope: 'solid_tone',
    expressions: ['solid'],
  },
  {
    id: 'gradient',
    icon: '🌈',
    labelKey: 'consultation.treatmentType.gradient',
    designScope: 'solid_tone',
    expressions: ['gradient'],
  },
  {
    id: 'magneticGel',
    icon: '✨',
    labelKey: 'consultation.treatmentType.magnetic',
    designScope: 'solid_tone',
    expressions: ['magnetic'],
  },
  {
    id: 'art',
    icon: '🎨',
    labelKey: 'consultation.treatmentType.art',
    designScope: 'full_art',
    expressions: ['solid'],
  },
];

export default function Step2Page() {
  useConsultationGuard();
  const router = useRouter();
  const setStep = useConsultationStore((s) => s.setStep);
  const setDesignScope = useConsultationStore((s) => s.setDesignScope);
  const setExpressions = useConsultationStore((s) => s.setExpressions);
  const consultation = useConsultationStore((s) => s.consultation);

  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const getInitialSelection = (): TreatmentType => {
    const { expressions } = consultation;
    if (expressions.includes('magnetic')) return 'magneticGel';
    if (expressions.includes('gradient')) return 'gradient';
    if (consultation.designScope === 'full_art') return 'art';
    return 'oneColor';
  };

  const [selectedType, setSelectedType] = useState<TreatmentType>(getInitialSelection);

  const handleSelect = (option: TreatmentOption) => {
    setSelectedType(option.id);
    setDesignScope(option.designScope);
    setExpressions(option.expressions);
  };

  const handleNext = () => {
    setStep(ConsultationStep.TRAITS);
    router.push('/consultation/traits');
  };

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={3}
        totalSteps={6}
        title={t('consultation.treatmentType.title')}
        titleKo={tKo('consultation.treatmentType.title')}
        backHref="/consultation/step1"
      />
      <PriceSummaryBar />

      <motion.main
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-y-auto px-4 md:px-8 pt-5 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] md:pb-6"
      >
        <div className="max-w-2xl md:max-w-3xl mx-auto flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-surface-alt border border-border"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-alt border border-border flex items-center justify-center flex-shrink-0">
              <svg width="36" height="36" viewBox="0 0 56 56" fill="none" className="text-primary">
                <path d="M20 12h16a4 4 0 014 4v12a12 12 0 01-24 0V16a4 4 0 014-4z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
                <path d="M28 40v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M22 48h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-0.5">
                STEP 3
              </p>
              <h2 className="text-lg font-bold text-text">
                {t('consultation.treatmentType.title')}
                {locale !== 'ko' && (
                  <span className="ml-2 text-sm font-medium text-text-muted opacity-60">
                    {tKo('consultation.treatmentType.title')}
                  </span>
                )}
              </h2>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {TREATMENT_OPTIONS.map((option, index) => {
              const isSelected = selectedType === option.id;
              return (
                <motion.button
                  key={option.id}
                  type="button"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-2 p-5 md:p-6 rounded-2xl border-2 transition-all duration-200',
                    isSelected
                      ? 'border-2 border-primary bg-white shadow-sm'
                      : 'border-border bg-surface hover:border-primary/40 hover:shadow-sm',
                  )}
                >
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2 7l3.5 3.5 6.5-6.5"
                          stroke="white"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  )}

                  <div
                    className={cn(
                      'w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-3xl md:text-4xl',
                      isSelected ? 'bg-surface-alt border border-primary' : 'bg-surface-alt',
                    )}
                  >
                    {option.icon}
                  </div>

                  <div className="text-center">
                    <p
                      className={cn(
                        'font-bold text-base md:text-lg',
                        isSelected ? 'text-primary' : 'text-text',
                      )}
                    >
                      {t(option.labelKey)}
                    </p>
                    {locale !== 'ko' && (
                      <p className="text-xs text-text-muted opacity-60 mt-0.5">
                        {tKo(option.labelKey)}
                      </p>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => {
              setStep(ConsultationStep.STEP3_OPTIONS);
              router.push('/consultation/step3');
            }}
            className="flex items-center justify-center gap-2 py-3 text-text-muted hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium">
              {t('consultation.treatmentType.detailedOptions')}
              {locale !== 'ko' && (
                <span className="ml-1 text-xs opacity-60">({tKo('consultation.treatmentType.detailedOptions')})</span>
              )}
            </span>
          </motion.button>
        </div>
      </motion.main>

      <ConsultationFooter onNext={handleNext} showEstimated={false} />
    </div>
  );
}
