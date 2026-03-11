'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { PriceSummaryBar } from '@/components/consultation/PriceSummaryBar';
import { TraitIcon } from '@/components/ui/TraitIcon';
import { TAG_PRESETS } from '@/data/tag-presets';
import { useT, useLocale, useKo } from '@/lib/i18n';

export default function TraitsPage(): React.ReactElement {
  const router = useRouter();
  const setStep = useConsultationStore((s) => s.setStep);
  const selectedTraitValues = useConsultationStore((s) => s.consultation.selectedTraitValues) ?? [];
  const toggleTraitValue = useConsultationStore((s) => s.toggleTraitValue);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const commPreset = TAG_PRESETS.find((p) => p.category === 'communication');
  const commOptions = commPreset?.options ?? [];
  const etcPreset = TAG_PRESETS.find((p) => p.category === 'etc');
  const traitOptions = etcPreset?.options ?? [];

  const handleNext = (): void => {
    setStep(ConsultationStep.CUSTOMER_INFO);
    router.push('/consultation/customer');
  };

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={3}
        totalSteps={5}
        title={t('consultation.traitsTitle')}
        titleKo={tKo('consultation.traitsTitle')}
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
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-surface-alt border border-border"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-alt border border-border flex items-center justify-center flex-shrink-0">
              <svg width="36" height="36" viewBox="0 0 56 56" fill="none" className="text-primary">
                <path d="M32 10L46 24l-22 22H10V32L32 10z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
                <circle cx="20" cy="36" r="3" fill="currentColor" fillOpacity="0.4" />
                <circle cx="28" cy="28" r="3" fill="currentColor" fillOpacity="0.4" />
                <circle cx="36" cy="20" r="3" fill="currentColor" fillOpacity="0.4" />
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
                <span className="text-base">{commPreset?.icon ?? '💬'}</span>
              </div>
              <p className="text-sm font-extrabold text-text-secondary tracking-tight">
                {t('consultation.traitsCategoryComm')}
                {locale !== 'ko' && (
                  <span className="ml-2 text-xs font-medium text-text-muted opacity-60">
                    {tKo('consultation.traitsCategoryComm')}
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

            <div className="grid grid-cols-2 gap-2">
              {commOptions.map((trait) => {
                const isSelected = selectedTraitValues.includes(trait.value);
                return (
                  <TraitIcon
                    key={trait.value}
                    value={trait.value}
                    icon={trait.icon}
                    size="md"
                    selected={isSelected}
                    onClick={() => toggleTraitValue(trait.value)}
                    className="w-full justify-start"
                  />
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-7 h-7 rounded-xl bg-surface-alt border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-base">{etcPreset?.icon ?? '📝'}</span>
              </div>
              <p className="text-sm font-bold text-text-secondary tracking-tight">
                {t('consultation.traitsCategoryEtc')}
                {locale !== 'ko' && (
                  <span className="ml-2 text-xs font-medium text-text-muted opacity-60">
                    {tKo('consultation.traitsCategoryEtc')}
                  </span>
                )}
              </p>
              <span className="ml-auto text-[10px] font-bold text-text-muted bg-surface-alt px-3 py-1 rounded-full border border-border uppercase tracking-widest text-center">
                {t('selector.multiSelect')}
                {locale !== 'ko' && (
                  <span className="block text-[8px] opacity-60 normal-case tracking-normal mt-0.5">
                    {tKo('selector.multiSelect')}
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {traitOptions.map((trait) => {
                const isSelected = selectedTraitValues.includes(trait.value);
                return (
                  <TraitIcon
                    key={trait.value}
                    value={trait.value}
                    icon={trait.icon}
                    size="md"
                    selected={isSelected}
                    onClick={() => toggleTraitValue(trait.value)}
                    className="w-full justify-start"
                  />
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
