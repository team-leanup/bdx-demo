'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui';
import { useShopStore } from '@/store/shop-store';
import { ConsultationStep } from '@/types/consultation';
import { cn } from '@/lib/cn';
import { useLocaleStore } from '@/store/locale-store';
import type { Locale } from '@/store/locale-store';
import { useT, useKo } from '@/lib/i18n';
import { useReservationStore } from '@/store/reservation-store';
import { CustomerLinkSplash } from '@/components/consultation/CustomerLinkSplash';

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

function StepFlowIcon({ type }: { type: 'customer' | 'basic' | 'treatment' | 'traits' | 'summary' }) {
  const size = 'w-5 h-5 md:w-6 md:h-6';
  switch (type) {
    case 'customer':
      return (
        <svg className={size} viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="18" r="9" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2.5" />
          <path d="M10 46C10 36 18 30 28 30C38 30 46 36 46 46" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'basic':
      return (
        <svg className={size} viewBox="0 0 56 56" fill="none">
          <rect x="14" y="8" width="28" height="38" rx="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
          <path d="M22 26l4 4 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 38h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'treatment':
      return (
        <svg className={size} viewBox="0 0 56 56" fill="none">
          <path d="M20 12h16a4 4 0 014 4v12a12 12 0 01-24 0V16a4 4 0 014-4z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
          <path d="M28 40v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M22 48h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'traits':
      return (
        <svg className={size} viewBox="0 0 56 56" fill="none">
          <path d="M32 10L46 24l-22 22H10V32L32 10z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="20" cy="36" r="3" fill="currentColor" fillOpacity="0.4" />
          <circle cx="28" cy="28" r="3" fill="currentColor" fillOpacity="0.4" />
          <circle cx="36" cy="20" r="3" fill="currentColor" fillOpacity="0.4" />
        </svg>
      );
    case 'summary':
      return (
        <svg className={size} viewBox="0 0 56 56" fill="none">
          <rect x="10" y="10" width="36" height="36" rx="4" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
          <path d="M20 22h16M20 30h16M20 38h10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
  }
}


export default function ConsultationStartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consultation = useConsultationStore((s) => s.consultation);
  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const setCustomerInfo = useConsultationStore((s) => s.setCustomerInfo);
  const setBookingId = useConsultationStore((s) => s.setBookingId);
  const setDesignerId = useConsultationStore((s) => s.setDesignerId);
  const setEntryPoint = useConsultationStore((s) => s.setEntryPoint);
  const setStep = useConsultationStore((s) => s.setStep);
  const setSourceShopId = useConsultationStore((s) => s.setSourceShopId);
  const setSourceShopName = useConsultationStore((s) => s.setSourceShopName);
  const reset = useConsultationStore((s) => s.reset);
  const updateReservation = useReservationStore((s) => s.updateReservation);
  const designers = useShopStore((s) => s.designers);
  const authDesignerId = useAuthStore((s) => s.activeDesignerId);
  const [selectedDesignerId, setSelectedDesignerId] = useState<string>(authDesignerId || '');
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [showEntrySplash, setShowEntrySplash] = useState(false);
  const { locale, setConsultationLocale } = useLocaleStore();
  const t = useT();
  const tKo = useKo();

  const prefillName = searchParams.get('name') ?? '';
  const prefillPhone = searchParams.get('phone') ?? '';
  const prefillNote = searchParams.get('note') ?? '';
  const prefillLang = searchParams.get('lang') as Locale | null;
  const prefillBookingId = searchParams.get('bookingId') ?? '';
  const prefillDesignerId = searchParams.get('designerId') ?? '';
  const prefillCustomerId = searchParams.get('customerId') ?? '';
  // M-10: shopId 기본 형식 검증 (빈 문자열, 공백만 있는 값 차단)
  const rawShopId = searchParams.get('shopId') ?? '';
  const prefillShopId = rawShopId.trim().length > 0 && rawShopId.trim().length <= 128 ? rawShopId.trim() : '';
  const prefillShopName = searchParams.get('shopName') ?? '';
  const prefillEntry: 'staff' | 'customer_link' = (searchParams.get('entry') === 'customer-link'
    || consultation.entryPoint === 'customer_link')
    ? 'customer_link'
    : 'staff';
  const isCustomerLinkFlow = prefillEntry === 'customer_link';
  const visibleShopName = prefillShopName || consultation.sourceShopName || '';
  const splashStorageKey = `customer-link-splash:${prefillBookingId || prefillShopName || 'default'}`;
  const initialRef = useRef({
    prefillName,
    prefillPhone,
    prefillNote,
    prefillLang,
    prefillBookingId,
    prefillDesignerId,
    prefillCustomerId,
    prefillShopId,
    prefillShopName,
    prefillEntry,
    customerName: consultation.customerName,
    customerPhone: consultation.customerPhone,
  });

  useEffect(() => {
    const {
      prefillName: name,
      prefillPhone: phone,
      prefillNote: note,
      prefillLang: lang,
      prefillBookingId: bookingId,
      prefillDesignerId: designerId,
      prefillCustomerId: customerId,
      prefillShopId: shopId,
      prefillShopName: shopName,
      prefillEntry: entryPoint,
      customerName,
      customerPhone,
    } = initialRef.current;

    if ((name || phone || customerId) && !customerName && !customerPhone) {
      setCustomerInfo(name, phone, customerId || undefined);
    }
    if (note) {
      sessionStorage.setItem('consultation_customer_memo', note);
    }
    if (lang && ['ko', 'en', 'zh', 'ja'].includes(lang)) {
      setConsultationLocale(lang);
    }
    if (bookingId) {
      setBookingId(bookingId);
    }
    if (designerId) {
      setDesignerId(designerId);
    }
    if (shopId) {
      setSourceShopId(shopId);
    }
    if (shopName) {
      setSourceShopName(shopName);
    }
    setEntryPoint(entryPoint);
  }, [setBookingId, setConsultationLocale, setCustomerInfo, setDesignerId, setEntryPoint, setSourceShopId, setSourceShopName]);

  useEffect(() => {
    if (!isCustomerLinkFlow) {
      setShowEntrySplash(false);
      return;
    }

    const hasSeenSplash = sessionStorage.getItem(splashStorageKey) === 'done';
    if (hasSeenSplash) {
      setShowEntrySplash(false);
      return;
    }

    setShowEntrySplash(true);
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(splashStorageKey, 'done');
      setShowEntrySplash(false);
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [isCustomerLinkFlow, splashStorageKey]);

  useEffect(() => {
    if (!isCustomerLinkFlow || showEntrySplash) {
      return;
    }

    if (consultation.currentStep === ConsultationStep.START) {
      setEntryPoint('customer_link');
      setStep(ConsultationStep.STEP1_BASIC);
      router.replace('/consultation/step1');
      return;
    }

    if (consultation.currentStep === ConsultationStep.CUSTOMER_INFO) {
      router.replace('/consultation/customer');
      return;
    }

    const routeByStep: Partial<Record<ConsultationStep, string>> = {
      [ConsultationStep.STEP1_BASIC]: '/consultation/step1',
      [ConsultationStep.STEP2_DESIGN]: '/consultation/step2',
      [ConsultationStep.CUSTOMER_INFO]: '/consultation/customer',
      [ConsultationStep.SUMMARY]: '/consultation/summary',
    };

    const targetRoute = routeByStep[consultation.currentStep];
    if (targetRoute) {
      router.replace(targetRoute);
    }
  }, [consultation, isCustomerLinkFlow, router, searchParams, setEntryPoint, setStep, showEntrySplash]);

  useEffect(() => {
    if (isCustomerLinkFlow) {
      return;
    }
    if (
      consultation.currentStep !== ConsultationStep.START
    ) {
      setShowResumeDialog(true);
    }
  }, [consultation.currentStep, isCustomerLinkFlow, showEntrySplash]);

  const STEP_FLOW = [
    { icon: <StepFlowIcon type="basic" />, label: t('consultation.step1Title'), koLabel: tKo('consultation.step1Title') },
    { icon: <StepFlowIcon type="treatment" />, label: t('consultation.treatmentType.title'), koLabel: tKo('consultation.treatmentType.title') },
    { icon: <StepFlowIcon type="customer" />, label: t('consultation.customerInfo'), koLabel: tKo('consultation.customerInfo') },
  ];

  const handleStartWithEntry = (ep: 'staff' | 'return_visit') => {
    const nextDesignerId = selectedDesignerId || consultation.designerId;
    const nextConsultation = {
      ...consultation,
      designerId: nextDesignerId,
      entryPoint: ep,
      currentStep: ConsultationStep.STEP1_BASIC,
    };

    hydrateConsultation(nextConsultation);

    if (consultation.bookingId && nextDesignerId) {
      updateReservation(consultation.bookingId, {
        designerId: nextDesignerId,
        preConsultationData: nextConsultation,
      });
    }

    router.push('/consultation/step1');
  };

  if (isCustomerLinkFlow) {
    if (showEntrySplash) {
      return (
        <CustomerLinkSplash
          shopName={visibleShopName}
          title={t('consultation.linkSplashTitle')}
          titleKo={tKo('consultation.linkSplashTitle')}
          description={t('consultation.linkSplashDesc')}
          descriptionKo={tKo('consultation.linkSplashDesc')}
        />
      );
    }

    return <div className="h-dvh bg-background" />;
  }

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
                  [ConsultationStep.CUSTOMER_INFO]: '/consultation/customer',
                  [ConsultationStep.SUMMARY]: '/consultation/summary',
                };
                const route = stepRoutes[consultation.currentStep] || '/consultation/step1';
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
      {!showEntrySplash && !isCustomerLinkFlow && (
      <>
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
        <h1 className="text-base md:text-lg font-bold text-text">
              {t('home.newConsultation')}
              {locale !== 'ko' && (
                <span className="ml-1 text-xs text-text-muted opacity-60 font-medium">{tKo('home.newConsultation')}</span>
              )}
            </h1>
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
            <div className="flex items-center justify-center mx-auto mb-4">
              <Image
                src="/bdx-logo/bdx-symbol.svg"
                alt="BDX"
                width={80}
                height={80}
                className="h-20 w-20"
                priority
              />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-text mb-1">
              {t('home.newConsultation')}
              {locale !== 'ko' && (
                <span className="block text-sm md:text-base text-text-muted opacity-60 font-medium mt-0.5">{tKo('home.newConsultation')}</span>
              )}
            </h2>
            <p className="text-sm md:text-base text-text-muted">
              {t('consultation.selectDesigner')}
              {locale !== 'ko' && (
                <span className="ml-1 text-xs opacity-60">{tKo('consultation.selectDesigner')}</span>
              )}
            </p>
          </div>

          {/* Step flow visual */}
          <div className="flex items-center justify-between bg-surface-alt rounded-2xl px-3 py-3 md:px-8 md:py-4 border border-border mb-6">
            {STEP_FLOW.map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-primary shadow-sm">
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

          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface-alt px-3 py-1 text-[11px] font-semibold text-text-muted">
              {t('consultation.canvasTitle')} {t('consultation.optional')}
              {locale !== 'ko' && <span className="opacity-60">{tKo('consultation.canvasTitle')} {tKo('consultation.optional')}</span>}
            </span>
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
              {designers.map((designer) => {
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
                        ? 'border-2 border-primary bg-primary/10 text-primary shadow-sm'
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
        <div className="w-full md:max-w-4xl md:mx-auto flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => handleStartWithEntry('staff')}
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
      </>
      )}
    </div>
  );
}
