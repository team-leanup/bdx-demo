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
import { useT } from '@/lib/i18n';

export default function Step1Page() {
  const router = useRouter();
  const setStep = useConsultationStore((s) => s.setStep);
  const t = useT();

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
            className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/15"
          >
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-0.5">Basic Conditions</p>
              <h2 className="text-lg font-bold text-text">{t('consultation.step1Title')}</h2>
              <p className="text-xs text-text-muted mt-0.5">시술 부위 · 제거 · 연장 · 쉐입</p>
            </div>
          </motion.div>

          <BodyPartSelector />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium">✨ 제거 · 연장</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <OffSelector />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium">🔧 연장/리페어</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <ExtensionSelector />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium">💅 네일 쉐입</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <ShapeSelector />
        </div>
      </motion.main>

      <ConsultationFooter onNext={handleNext} />
    </div>
  );
}
