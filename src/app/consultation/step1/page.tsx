'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { PriceSummaryBar } from '@/components/consultation/PriceSummaryBar';
import { BodyPartSelector } from '@/components/consultation/BodyPartSelector';
import { OffSelector } from '@/components/consultation/OffSelector';
import { ExtensionSelector } from '@/components/consultation/ExtensionSelector';
import { ShapeSelector } from '@/components/consultation/ShapeSelector';
import { PortfolioBrowser } from '@/components/consultation/PortfolioBrowser';
import { MoodTagSelector } from '@/components/consultation/MoodTagSelector';
import { useT, useLocale, useKo } from '@/lib/i18n';
import { useConsultationGuard } from '@/lib/use-consultation-guard';

export default function Step1Page() {
  useConsultationGuard();
  const router = useRouter();
  const setStep = useConsultationStore((s) => s.setStep);
  const consultation = useConsultationStore((s) => s.consultation);
  const addReferenceImage = useConsultationStore((s) => s.addReferenceImage);
  const removeReferenceImage = useConsultationStore((s) => s.removeReferenceImage);
  const moodTags = useConsultationStore((s) => s.consultation.moodTags) ?? [];
  const toggleMoodTag = useConsultationStore((s) => s.toggleMoodTag);
  const entryPoint = useConsultationStore((s) => s.consultation.entryPoint);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const isRefImagesReadOnly = entryPoint === 'customer_link' && (consultation.referenceImages?.length ?? 0) > 0;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const current = consultation.referenceImages || [];
    Array.from(files).slice(0, 5 - current.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === 'string') {
          addReferenceImage(result);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleNext = () => {
    setStep(ConsultationStep.STEP2_DESIGN);
    router.push('/consultation/step2');
  };

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={1}
        totalSteps={3}
        title={t('consultation.step1Title')}
        titleKo={tKo('consultation.step1Title')}
        backHref="/consultation"
      />
      <PriceSummaryBar />

      <motion.main
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-y-auto px-4 md:px-8 pt-5 pb-28 md:pb-6"
      >
        <div className="max-w-2xl md:max-w-3xl mx-auto flex flex-col gap-6">
          {/* A-4: 포트폴리오 + 참고 이미지 (모든 모드 공통) */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-surface p-4 flex flex-col gap-4"
          >
            <div className="text-center">
              <h2 className="text-xl font-bold text-text">
                {t('consultation.photoUploadTitle')}
                {locale !== 'ko' && (
                  <span className="block text-sm font-medium text-text-muted opacity-70 mt-0.5">{tKo('consultation.photoUploadTitle')}</span>
                )}
              </h2>
              <p className="text-xs text-text-muted mt-1">
                {t('consultation.photoUploadDesc')}
                {locale !== 'ko' && (
                  <span className="block text-[10px] opacity-60">{tKo('consultation.photoUploadDesc')}</span>
                )}
              </p>
            </div>

            {(consultation.referenceImages || []).length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {(consultation.referenceImages || []).map((url, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border flex-shrink-0">
                    <Image src={url} alt="" fill unoptimized className="object-cover" />
                    {!isRefImagesReadOnly && (
                      <button
                        type="button"
                        onClick={() => removeReferenceImage(url)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isRefImagesReadOnly && (consultation.referenceImages || []).length < 5 && (
              <label className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-white/50 flex items-center justify-center gap-2 py-5 text-primary cursor-pointer hover:border-primary hover:bg-white/80 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span className="text-sm font-bold">
                  {t('consultation.referenceAdd')}
                  {locale !== 'ko' && (
                    <span className="ml-1 text-xs opacity-60">{tKo('consultation.referenceAdd')}</span>
                  )}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}

            <MoodTagSelector selected={moodTags} onToggle={toggleMoodTag} />

            <PortfolioBrowser
              onToggleSelect={(url) => {
                const current = consultation.referenceImages || [];
                if (current.includes(url)) {
                  removeReferenceImage(url);
                  return;
                }
                if (current.length < 5) {
                  addReferenceImage(url);
                }
              }}
              selectedUrls={consultation.referenceImages || []}
              shopId={consultation.sourceShopId}
              shopName={consultation.sourceShopName || ''}
            />
          </motion.div>

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
