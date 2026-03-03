'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { PriceSummaryBar } from '@/components/consultation/PriceSummaryBar';
import { DesignScopeSelector } from '@/components/consultation/DesignScopeSelector';
import { DesignPresetPicker } from '@/components/consultation/DesignPresetPicker';
import { usePartsStore, type DesignPreset } from '@/store/parts-store';
import { useT, useLocale, useKo } from '@/lib/i18n';

export default function Step2Page() {
  const router = useRouter();
  const setStep = useConsultationStore((s) => s.setStep);
  const setDesignScope = useConsultationStore((s) => s.setDesignScope);
  const setExpressions = useConsultationStore((s) => s.setExpressions);
  const setHasParts = useConsultationStore((s) => s.setHasParts);
  const setPartsSelections = useConsultationStore((s) => s.setPartsSelections);
  const customParts = usePartsStore((s) => s.customParts);
  const consultation = useConsultationStore((s) => s.consultation);
  const addReferenceImage = useConsultationStore((s) => s.addReferenceImage);
  const removeReferenceImage = useConsultationStore((s) => s.removeReferenceImage);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const current = consultation.referenceImages || [];
    for (let i = 0; i < files.length && current.length + i < 5; i++) {
      addReferenceImage(URL.createObjectURL(files[i]));
    }
    e.target.value = '';
  };

  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const handlePresetSelect = (preset: DesignPreset) => {
    setSelectedPresetId(preset.id);
    setDesignScope(preset.designScope);
    setExpressions(preset.expressions);
    setHasParts(preset.hasParts);
    if (preset.hasParts && preset.defaultParts && preset.defaultParts.length > 0) {
      const selections = preset.defaultParts
        .map((dp) => {
          const part = customParts.find((cp) => cp.id === dp.partId);
          if (!part) return null;
          return { grade: 'A' as const, quantity: dp.quantity, customPartId: dp.partId };
        })
        .filter((s): s is { grade: 'A'; quantity: number; customPartId: string } => s !== null);
      setPartsSelections(selections);
    } else {
      setPartsSelections([]);
    }
  };

  const handleNext = () => {
    setStep(ConsultationStep.STEP3_OPTIONS);
    router.push('/consultation/step3');
  };

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={3}
        totalSteps={5}
        title={t('consultation.step2Title')}
        titleKo={tKo('consultation.step2Title')}
        backHref="/consultation/step1"
      />
      <PriceSummaryBar />

      <motion.main
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-y-auto px-4 md:px-8 pt-5 pb-28 md:pb-6"
      >
        <div className="max-w-2xl md:max-w-3xl mx-auto flex flex-col gap-6">
          {/* 참고 이미지 섹션 */}
          {(() => {
            const images = consultation.referenceImages || [];
            return (
              <div>
                <p className="text-xs font-medium text-text-muted mb-2">
                  {t('consultation.referenceTitle')}
                  {locale !== 'ko' && <span className="ml-1 text-[10px] opacity-60">{tKo('consultation.referenceTitle')}</span>}
                  <span className="ml-1 opacity-50">(최대 5장)</span>
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2 flex-wrap">
                  {images.map((url, i) => (
                    <div key={i} className="relative w-40 h-40 rounded-xl overflow-hidden border border-border flex-shrink-0">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeReferenceImage(url)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="w-40 h-40 rounded-xl border border-dashed border-border bg-surface-alt flex flex-col items-center justify-center gap-1 text-text-muted cursor-pointer hover:border-primary hover:text-primary transition-colors flex-shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[10px]">{t('common.add')}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Visual Step Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/15"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              {/* Art palette icon */}
              <svg width="36" height="36" viewBox="0 0 56 56" fill="none" className="text-primary">
                <circle cx="28" cy="28" r="18" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
                <circle cx="20" cy="22" r="4" fill="currentColor" fillOpacity="0.6" />
                <circle cx="29" cy="17" r="4" fill="currentColor" fillOpacity="0.6" />
                <circle cx="37" cy="22" r="4" fill="currentColor" fillOpacity="0.6" />
                <circle cx="37" cy="31" r="4" fill="currentColor" fillOpacity="0.6" />
                <circle cx="34" cy="38" r="5" fill="currentColor" fillOpacity="0.9" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-0.5">
                {t('consultation.step2Title')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[9px] opacity-60 normal-case">{tKo('consultation.step2Title')}</span>
                )}
              </p>
              <h2 className="text-lg font-bold text-text">{t('consultation.step2Title')}</h2>
              <p className="text-xs text-text-muted mt-0.5">
                {t('consultation.designScope')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[9px] opacity-60">{tKo('consultation.designScope')}</span>
                )}
              </p>
            </div>
          </motion.div>

          {/* 디자인 프리셋 섹션 */}
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-sm font-bold text-text flex items-center gap-2">
                <span className="text-lg font-black">{t('step2.designPreset')}</span>
                {locale !== 'ko' && (
                  <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('step2.designPreset')}</span>
                )}
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                {t('consultation.presetSubtitle')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[9px] opacity-60">{tKo('consultation.presetSubtitle')}</span>
                )}
              </p>
            </div>
            <DesignPresetPicker
              onSelect={handlePresetSelect}
              selectedId={selectedPresetId}
            />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium flex flex-col items-center">
              <span className="text-lg font-black">{t('step2.colorTheme')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('step2.colorTheme')}</span>
              )}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <DesignScopeSelector />
        </div>
      </motion.main>

      <ConsultationFooter onNext={handleNext} />
    </div>
  );
}
