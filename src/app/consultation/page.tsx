'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui';
import { MOCK_DESIGNERS } from '@/data/mock-shop';
import { ConsultationStep } from '@/types/consultation';
import { cn } from '@/lib/cn';
import { useLocaleStore } from '@/store/locale-store';
import type { Locale } from '@/store/locale-store';
import { useT, useKo } from '@/lib/i18n';

const LANGUAGE_OPTIONS: { value: Locale; flag: string; label: string }[] = [
  { value: 'ko', flag: '🇰🇷', label: '한국어' },
  { value: 'en', flag: '🇺🇸', label: 'English' },
  { value: 'zh', flag: '🇨🇳', label: '中文' },
  { value: 'ja', flag: '🇯🇵', label: '日本語' },
];

// Per-designer gender mapping (keyed by designer id)
const DESIGNER_GENDER: Record<string, 'male' | 'female'> = {
  'designer-001': 'female',
  'designer-002': 'male',
  'designer-003': 'female',
};

function MaleSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" fill="none" className={className}>
      {/* Head */}
      <circle cx="28" cy="16" r="10" fill="currentColor" fillOpacity="0.9" />
      {/* Shoulders / body */}
      <path
        d="M10 50 C10 36 18 30 28 30 C38 30 46 36 46 50"
        fill="currentColor"
        fillOpacity="0.9"
      />
    </svg>
  );
}

function FemaleSilhouette({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" fill="none" className={className}>
      {/* Head */}
      <circle cx="28" cy="15" r="10" fill="currentColor" fillOpacity="0.9" />
      {/* Hair */}
      <path
        d="M18 15 Q16 8 28 6 Q40 8 38 15 Q36 20 28 22 Q20 20 18 15Z"
        fill="currentColor"
        fillOpacity="0.7"
      />
      {/* Shoulders / body with slightly narrower waist */}
      <path
        d="M12 50 C12 38 18 32 28 31 C38 32 44 38 44 50"
        fill="currentColor"
        fillOpacity="0.9"
      />
    </svg>
  );
}

const STEP_FLOW_ICONS = ['👤', '✋', '💅', '🏷️', '📋'];

export default function ConsultationStartPage() {
  const router = useRouter();
  const consultation = useConsultationStore((s) => s.consultation);
  const reset = useConsultationStore((s) => s.reset);
  const setDesignerId = useConsultationStore((s) => s.setDesignerId);
  const setStep = useConsultationStore((s) => s.setStep);
  const authDesignerId = useAuthStore((s) => s.activeDesignerId);
  const [selectedDesignerId, setSelectedDesignerId] = useState<string>(authDesignerId || '');
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const { locale, setConsultationLocale } = useLocaleStore();
  const t = useT();
  const tKo = useKo();

  useEffect(() => {
    if (
      consultation.currentStep !== ConsultationStep.START &&
      consultation.currentStep !== ConsultationStep.CUSTOMER_INFO &&
      consultation.customerName
    ) {
      setShowResumeDialog(true);
    }
  }, [consultation.currentStep, consultation.customerName]);

  const STEP_FLOW = [
    { icon: STEP_FLOW_ICONS[0], label: t('consultation.customerInfo'), koLabel: tKo('consultation.customerInfo') },
    { icon: STEP_FLOW_ICONS[1], label: t('consultation.step1Title'), koLabel: tKo('consultation.step1Title') },
    { icon: STEP_FLOW_ICONS[2], label: t('step2.treatmentTypeTitle'), koLabel: tKo('step2.treatmentTypeTitle') },
    { icon: STEP_FLOW_ICONS[3], label: t('consultation.traitsTitle'), koLabel: tKo('consultation.traitsTitle') },
    { icon: STEP_FLOW_ICONS[4], label: t('consultation.summaryTitle'), koLabel: tKo('consultation.summaryTitle') },
  ];

  const handleStart = () => {
    reset();
    if (selectedDesignerId) {
      setDesignerId(selectedDesignerId);
    }
    setStep(ConsultationStep.CUSTOMER_INFO);
    router.push('/consultation/customer');
  };

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      {/* Resume dialog */}
      {showResumeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-2xl bg-surface p-6 shadow-sm">
            <h3 className="text-lg font-bold text-text mb-2">
              {tKo('consultation.resumeTitle')}
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              {tKo('consultation.resumeDesc')}
            </p>
            <div className="flex flex-col gap-2">
              <Button variant="primary" fullWidth onClick={() => {
                setShowResumeDialog(false);
                const stepRoutes: Record<string, string> = {
                  [ConsultationStep.STEP1_BASIC]: '/consultation/step1',
                  [ConsultationStep.STEP2_DESIGN]: '/consultation/step2',
                  [ConsultationStep.STEP3_OPTIONS]: '/consultation/step3',
                  [ConsultationStep.TRAITS]: '/consultation/traits',
                  [ConsultationStep.CANVAS]: '/consultation/canvas',
                  [ConsultationStep.SUMMARY]: '/consultation/summary',
                };
                const route = stepRoutes[consultation.currentStep] || '/consultation/customer';
                router.push(route);
              }}>
                {tKo('consultation.resumeBtn')}
              </Button>
              <Button variant="ghost" fullWidth onClick={() => {
                setShowResumeDialog(false);
                reset();
              }}>
                {tKo('consultation.newBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-8 py-4 bg-surface border-b border-border">
        <button
          type="button"
          onClick={() => router.push('/home')}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-surface-alt transition-colors"
        >
          <svg
            className="w-5 h-5 text-text"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-base md:text-lg font-bold text-text">{t('home.newConsultation')}</h1>
        <div className="w-9" />
      </header>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col px-4 md:px-6 pt-6 pb-28 gap-6 md:gap-8 max-w-lg md:max-w-4xl mx-auto w-full overflow-y-auto"
      >
        {/* Single column layout: Hero → Steps → Designer → Language */}
        <div className="flex flex-col">
          {/* Visual hero header */}
          <div className="text-center py-2 mb-5">
            <div className="w-20 h-20 bg-surface-alt border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg width="42" height="42" viewBox="0 0 56 56" fill="none" className="text-primary">
                <rect x="19" y="28" width="18" height="22" rx="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
                <rect x="22" y="20" width="12" height="10" rx="3" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" />
                <rect x="25" y="14" width="6" height="8" rx="2" fill="currentColor" fillOpacity="0.5" stroke="currentColor" strokeWidth="2" />
                <path d="M22 38 Q28 34 34 38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-text mb-1">{t('home.newConsultation')}</h2>
            <p className="text-sm md:text-base text-text-muted">{t('consultation.selectDesigner')}</p>
          </div>

          {/* Step flow visual */}
          <div className="flex items-center justify-between bg-surface-alt rounded-2xl px-3 py-3 md:px-8 md:py-4 border border-border mb-6">
            {STEP_FLOW.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-base md:text-xl shadow-sm">
                    {step.icon}
                  </div>
                  <span className="text-[9px] md:text-xs text-text-muted font-medium leading-tight text-center whitespace-nowrap">
                    {step.label}
                    {locale !== 'ko' && (
                      <span className="block text-[7px] md:text-[9px] opacity-60">{step.koLabel}</span>
                    )}
                  </span>
                </div>
                {i < STEP_FLOW.length - 1 && (
                  <svg className="w-3 h-3 md:w-4 md:h-4 text-text-muted mx-0.5 md:mx-1.5 mb-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>
            ))}
          </div>

          {/* Designer selection */}
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
              <p className="text-sm font-bold text-text">
                {t('consultation.selectDesigner')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-xs text-text-muted opacity-60 font-medium">{tKo('consultation.selectDesigner')}</span>
                )}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {MOCK_DESIGNERS.map((designer) => {
                const isSelected = selectedDesignerId === designer.id;
                const gender = DESIGNER_GENDER[designer.id] ?? 'female';
                return (
                  <motion.button
                    key={designer.id}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedDesignerId(designer.id)}
                    className={cn(
                      'flex items-center gap-4 p-4 md:p-5 rounded-2xl transition-all duration-200 text-left relative overflow-hidden',
                      isSelected
                        ? 'border-2 border-primary bg-white shadow-sm'
                        : 'border border-border bg-white hover:border-gray-300 hover:shadow-sm',
                    )}
                  >
                    {/* Avatar */}
                    <div
                      className={cn(
                        'w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white shadow-sm overflow-hidden',
                        isSelected ? 'bg-primary' : 'bg-gray-400',
                      )}
                    >
                      {gender === 'female' ? (
                        <FemaleSilhouette className="w-10 h-10" />
                      ) : (
                        <MaleSilhouette className="w-10 h-10" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={cn('font-bold text-base md:text-lg', isSelected ? 'text-primary' : 'text-text')}>
                          {designer.name}{t('common.designerSuffix')}
                        </p>
                      </div>
                      <span className={cn(
                        'inline-block px-2 py-0.5 text-[10px] font-bold rounded-full',
                        designer.role === 'owner'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-surface-alt text-text-muted border border-border',
                      )}>
                        {designer.role === 'owner' ? t('common.roleOwner') : t('common.roleStaff')}
                      </span>
                    </div>

                    {/* Selected checkmark */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 7l3.5 3.5 6.5-6.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Language selector */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
              </svg>
              <p className="text-sm font-bold text-text">
                {t('consultation.consultLanguage')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-xs text-text-muted opacity-60 font-medium">{tKo('consultation.consultLanguage')}</span>
                )}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {LANGUAGE_OPTIONS.map((opt) => {
                const isLangSelected = locale === opt.value;
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setConsultationLocale(opt.value)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                      isLangSelected
                        ? 'border-2 border-primary bg-white text-primary shadow-sm'
                        : 'border border-border bg-white text-text-secondary hover:border-gray-300',
                    )}
                  >
                    <span>{opt.flag}</span>
                    <span>{opt.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-border px-4 py-4 safe-bottom md:static md:flex-shrink-0 md:px-8">
        <div className="md:max-w-4xl md:mx-auto">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleStart}
          disabled={!selectedDesignerId}
          className="shadow-sm"
        >
          <span>{t('consultation.startConsultation')}</span>
          {locale !== 'ko' && (
            <span className="ml-1 text-xs opacity-70">{tKo('consultation.startConsultation')}</span>
          )}
        </Button>
        </div>
      </footer>
    </div>
  );
}
