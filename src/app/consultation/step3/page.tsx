'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { PriceSummaryBar } from '@/components/consultation/PriceSummaryBar';
import { ExpressionSelector } from '@/components/consultation/ExpressionSelector';
import { PartsSelector } from '@/components/consultation/PartsSelector';
import { ColorSelector } from '@/components/consultation/ColorSelector';
import { useT } from '@/lib/i18n';

export default function Step3Page() {
  const router = useRouter();
  const setStep = useConsultationStore((s) => s.setStep);
  const t = useT();

  const handleNext = () => {
    setStep(ConsultationStep.CANVAS);
    router.push('/consultation/canvas');
  };

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={4}
        totalSteps={5}
        title={t('consultation.step3Title')}
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
            className="flex items-center gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/15"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center flex-shrink-0">
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
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-0.5">Extra Options</p>
              <h2 className="text-lg font-bold text-text">{t('consultation.step3Title')}</h2>
              <p className="text-xs text-text-muted mt-0.5">발색 방법 · 파츠 · 컬러</p>
            </div>
          </motion.div>

          {/* PRO 안내 배너 */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
            <span className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full uppercase tracking-wider flex-shrink-0">
              PRO
            </span>
            <p className="text-xs text-amber-700">세부 시술 금액은 설정 &gt; 서비스 관리에서 변경 가능합니다</p>
          </div>

          <ExpressionSelector />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium">💎 파츠 추가</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <PartsSelector />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted font-medium">🌈 컬러 추가</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <ColorSelector />
        </div>
      </motion.main>

      <ConsultationFooter onNext={handleNext} />
    </div>
  );
}
