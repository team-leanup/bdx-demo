'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { PriceSummaryBar } from '@/components/consultation/PriceSummaryBar';
import { TAG_PRESETS } from '@/data/tag-presets';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';

export default function TraitsPage(): React.ReactElement {
  const router = useRouter();
  const setStep = useConsultationStore((s) => s.setStep);
  const selectedTraitValues = useConsultationStore((s) => s.consultation.selectedTraitValues) ?? [];
  const toggleTraitValue = useConsultationStore((s) => s.toggleTraitValue);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const etcPreset = TAG_PRESETS.find((p) => p.category === 'etc');
  const traitOptions = etcPreset?.options ?? [];

  const handleNext = (): void => {
    setStep(ConsultationStep.SUMMARY);
    router.push('/consultation/summary');
  };

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={5}
        totalSteps={6}
        title={t('consultation.traitsTitle')}
        titleKo={tKo('consultation.traitsTitle')}
        backHref="/consultation/step3"
      />
      <PriceSummaryBar />

      <motion.main
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-y-auto px-4 md:px-8 pt-5 pb-28 md:pb-6"
      >
        <div className="max-w-2xl md:max-w-3xl mx-auto flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-surface-alt border border-border"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-alt border border-border flex items-center justify-center flex-shrink-0">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-0.5">
                {t('consultation.traitsTitle')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[9px] opacity-60 normal-case">{tKo('consultation.traitsTitle')}</span>
                )}
              </p>
              <h2 className="text-lg font-bold text-text">{t('consultation.traitsTitle')}</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {t('consultation.traitsDescription')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[9px] opacity-60">{tKo('consultation.traitsDescription')}</span>
                )}
              </p>
            </div>
          </motion.div>

          {selectedTraitValues.length > 0 && (
            <div className="flex items-center justify-center">
              <span className="text-xs font-bold text-primary bg-gray-100 border border-border px-3 py-1.5 rounded-full">
                {t('consultation.traitsSelectedCount').replace('{count}', String(selectedTraitValues.length))}
                {locale !== 'ko' && (
                  <span className="ml-1 opacity-60">
                    {tKo('consultation.traitsSelectedCount').replace('{count}', String(selectedTraitValues.length))}
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-7 h-7 rounded-xl bg-surface-alt border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-base">{etcPreset?.icon ?? '📝'}</span>
              </div>
              <p className="text-sm font-extrabold text-text-secondary tracking-tight">
                {t('consultation.traitsCategoryEtc')}
                {locale !== 'ko' && (
                  <span className="ml-2 text-xs font-medium text-text-muted opacity-60">
                    {tKo('consultation.traitsCategoryEtc')}
                  </span>
                )}
              </p>
              <span className="ml-auto text-[10px] font-black text-text-muted bg-surface-alt px-3 py-1 rounded-full border border-border uppercase tracking-widest text-center">
                {t('selector.multiSelect')}
                {locale !== 'ko' && (
                  <span className="block text-[8px] opacity-60 normal-case tracking-normal mt-0.5">
                    {tKo('selector.multiSelect')}
                  </span>
                )}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {traitOptions.map((trait) => {
                const isSelected = selectedTraitValues.includes(trait);
                return (
                  <motion.button
                    key={trait}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleTraitValue(trait)}
                    className={cn(
                      'relative px-4 py-2.5 rounded-full border-2 transition-all duration-200 text-sm font-bold',
                      isSelected
                        ? 'border-2 border-primary bg-white text-primary shadow-sm'
                        : 'border-border bg-surface text-text-secondary hover:border-primary/30',
                    )}
                  >
                    {trait}
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path
                            d="M2 5l2 2 4-4"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-xs text-text-muted">
            {locale === 'ko' ? (
              '선택하지 않아도 다음 단계로 진행할 수 있습니다'
            ) : (
              <>
                <span>{locale === 'en' ? 'You can proceed without selecting any' : locale === 'zh' ? '不选择也可以继续' : '選択しなくても次に進めます'}</span>
                <span className="block opacity-60 mt-0.5">선택하지 않아도 다음 단계로 진행할 수 있습니다</span>
              </>
            )}
          </p>
        </div>
      </motion.main>

      <ConsultationFooter onNext={handleNext} showEstimated={false} />
    </div>
  );
}
