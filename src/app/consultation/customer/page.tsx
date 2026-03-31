'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { PriceSummaryBar } from '@/components/consultation/PriceSummaryBar';
import { CustomerInfoForm } from '@/components/consultation/CustomerInfoForm';
import type { Customer } from '@/types/customer';
import { useLocaleStore } from '@/store/locale-store';
import type { Locale } from '@/store/locale-store';
import { useT, useLocale, useKo } from '@/lib/i18n';
import { CustomerLinkSplash } from '@/components/consultation/CustomerLinkSplash';

const LANGUAGE_BADGE: Record<Locale, { flag: string; label: string }> = {
  ko: { flag: '🇰🇷', label: '한국어' },
  en: { flag: '🇺🇸', label: 'English' },
  zh: { flag: '🇨🇳', label: '中文' },
  ja: { flag: '🇯🇵', label: '日本語' },
};

function CustomerPageInner(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setCustomerInfo = useConsultationStore((s) => s.setCustomerInfo);
  const setBookingId = useConsultationStore((s) => s.setBookingId);
  const setDesignerId = useConsultationStore((s) => s.setDesignerId);
  const setEntryPoint = useConsultationStore((s) => s.setEntryPoint);
  const setSourceShopId = useConsultationStore((s) => s.setSourceShopId);
  const setSourceShopName = useConsultationStore((s) => s.setSourceShopName);
  const setStep = useConsultationStore((s) => s.setStep);
  const consultation = useConsultationStore((s) => s.consultation);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  // 쿼리 파라미터에서 예약 정보 읽기 (예약 → 상담 연동)
  const prefillName = searchParams.get('name') ?? '';
  const prefillPhone = searchParams.get('phone') ?? '';
  const prefillNote = searchParams.get('note') ?? '';
  const prefillLang = searchParams.get('lang') as Locale | null;
  const prefillBookingId = searchParams.get('bookingId') ?? consultation.bookingId ?? '';
  const prefillDesignerId = searchParams.get('designerId') ?? consultation.designerId ?? '';
  const prefillCustomerId = searchParams.get('customerId') ?? consultation.customerId ?? '';
  const prefillShopId = searchParams.get('shopId') ?? consultation.sourceShopId ?? '';
  const prefillShopName = searchParams.get('shopName') ?? consultation.sourceShopName ?? '';
  const prefillEntry: 'staff' | 'customer_link' = (searchParams.get('entry') === 'customer-link'
    || consultation.entryPoint === 'customer_link')
    ? 'customer_link'
    : 'staff';
  const isCustomerLinkFlow = prefillEntry === 'customer_link';
  const visibleShopName = prefillShopName || consultation.sourceShopName || '';
  const splashStorageKey = `customer-link-splash:${prefillBookingId || prefillShopName || 'default'}`;

  const [name, setName] = useState(consultation.customerName ?? prefillName);
  const [phone, setPhone] = useState(consultation.customerPhone ?? prefillPhone);
  const [memo, setMemo] = useState(prefillNote);
  const [showEntrySplash, setShowEntrySplash] = useState(isCustomerLinkFlow);
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = useState<string | undefined>(
    (consultation.customerId ?? prefillCustomerId) || undefined,
  );
  const [selectedExistingSnapshot, setSelectedExistingSnapshot] = useState<{ name: string; phone: string } | null>(
    (consultation.customerId ?? prefillCustomerId)
      ? {
          name: consultation.customerName ?? prefillName,
          phone: consultation.customerPhone ?? prefillPhone,
        }
      : null,
  );

  useEffect(() => {
    if (!isCustomerLinkFlow || consultation.currentStep !== ConsultationStep.START) {
      return;
    }

    const query = searchParams.toString();
    router.replace(query ? `/consultation?${query}` : '/consultation');
  }, [consultation.currentStep, isCustomerLinkFlow, router, searchParams]);

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
    if (name && !customerName) {
      setName(name);
    }
    if (phone && !customerPhone) {
      setPhone(phone);
    }
    if ((name || phone || customerId) && !customerName && !customerPhone) {
      setCustomerInfo(name, phone, customerId || undefined);
    }
    if (note) {
      setMemo(note);
      sessionStorage.setItem('consultation_customer_memo', note);
    } else {
      const storedMemo = sessionStorage.getItem('consultation_customer_memo');
      if (storedMemo) {
        setMemo(storedMemo);
      }
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

    const currentStep = consultation.currentStep;
    if (currentStep === ConsultationStep.CUSTOMER_INFO) {
      return;
    }

    if (currentStep === ConsultationStep.START) {
      return;
    }

    const routeByStep: Partial<Record<ConsultationStep, string>> = {
      [ConsultationStep.STEP1_BASIC]: '/consultation/step1',
      [ConsultationStep.STEP2_DESIGN]: '/consultation/step2',
      [ConsultationStep.SUMMARY]: '/consultation/summary',
    };

    const targetRoute = routeByStep[currentStep];
    if (targetRoute) {
      router.replace(targetRoute);
    }
  }, [consultation.currentStep, isCustomerLinkFlow, router, setStep, showEntrySplash]);

  const handleExistingCustomer = (customer: Customer) => {
    setName(customer.name);
    setPhone(customer.phone);
    setSelectedExistingCustomerId(customer.id);
    setSelectedExistingSnapshot({ name: customer.name, phone: customer.phone });
    setCustomerInfo(customer.name, customer.phone, customer.id);
  };

  const handleNext = () => {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const preserveCustomerId = Boolean(
      selectedExistingCustomerId
      && selectedExistingSnapshot
      && selectedExistingSnapshot.name === trimmedName
      && selectedExistingSnapshot.phone === trimmedPhone,
    );

    setCustomerInfo(
      trimmedName,
      trimmedPhone,
      preserveCustomerId ? selectedExistingCustomerId : undefined,
    );
    // Persist memo to sessionStorage so summary page can append it to customer notes
    if (memo.trim()) {
      sessionStorage.setItem('consultation_customer_memo', memo.trim());
    } else {
      sessionStorage.removeItem('consultation_customer_memo');
    }
    if (consultation.entryPoint === 'return_visit') {
      setStep(ConsultationStep.SUMMARY);
      router.push('/consultation/summary');
      return;
    }
    setStep(ConsultationStep.STEP1_BASIC);
    router.push('/consultation/step1');
  };

  const canProceed = name.trim().length > 0;
  const [showNameError, setShowNameError] = useState(false);

  const handleNextWithValidation = () => {
    if (!canProceed) {
      setShowNameError(true);
      return;
    }
    handleNext();
  };

  const stepNumber = 3;
  const backHref = '/consultation/step2';
  const customerLinkParams = new URLSearchParams();
  customerLinkParams.set('entry', 'customer-link');
  if (prefillShopId) customerLinkParams.set('shopId', prefillShopId);
  if (visibleShopName) customerLinkParams.set('shopName', visibleShopName);
  const customerLinkEntryHref = `/consultation?${customerLinkParams.toString()}`;

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

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={stepNumber}
        totalSteps={3}
        title={t('consultation.customerInfo')}
        titleKo={tKo('consultation.customerInfo')}
        backHref={backHref}
        onClose={() => router.push(isCustomerLinkFlow ? customerLinkEntryHref : '/home')}
      />
      <PriceSummaryBar />

      {isCustomerLinkFlow && visibleShopName && (
        <div className="mx-4 mt-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Consultation Link</p>
          <p className="mt-1 text-sm font-bold text-text">{visibleShopName}</p>
          <p className="mt-1 text-xs text-text-muted">
            {t('consultation.sourceShopLinkDesc').replace('{shopName}', visibleShopName)}
            {locale !== 'ko' && (
              <span className="block text-[10px] opacity-60 mt-0.5">
                {tKo('consultation.sourceShopLinkDesc').replace('{shopName}', visibleShopName)}
              </span>
            )}
          </p>
        </div>
      )}

      {/* N-9: 재방문 빠른 등록 모드 안내 */}
      {consultation.entryPoint === 'return_visit' && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5">
          <svg className="h-4 w-4 flex-shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-amber-700 font-medium">
            재방문 고객 빠른 등록 모드입니다. 시술 옵션은 기본값으로 설정됩니다.
          </p>
        </div>
      )}

      {/* 예약 연동 안내 배너 */}
      {prefillName && (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-surface-alt border border-border px-4 py-2.5">
          <svg className="h-4 w-4 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-primary">
            {t('consultation.preFilledFromBooking')}
          </p>
        </div>
      )}

      {/* 상담 언어 표시 뱃지 */}
      {prefillLang && LANGUAGE_BADGE[prefillLang] && (
        <div className="mx-4 mt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-medium text-text-secondary">
            <span>{LANGUAGE_BADGE[prefillLang].flag}</span>
            <span>{LANGUAGE_BADGE[prefillLang].label}</span>
            <span className="text-text-muted">{t('consultation.consultLanguage')}</span>
          </span>
        </div>
      )}

      <motion.main
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-y-auto px-4 md:px-8 pt-5 pb-28 md:pb-6"
      >
        <div className="max-w-2xl md:max-w-3xl mx-auto flex flex-col gap-5">

          {/* Visual Step Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 p-4 rounded-2xl bg-surface-alt border border-border"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-alt border border-border flex items-center justify-center flex-shrink-0">
              <svg width="36" height="36" viewBox="0 0 56 56" fill="none" className="text-primary">
                <circle cx="28" cy="18" r="9" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="2.5" />
                <path d="M10 46 C10 36 18 30 28 30 C38 30 46 36 46 46" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest mb-0.5">
                {t('consultation.customerInfo')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[9px] opacity-60 normal-case">{tKo('consultation.customerInfo')}</span>
                )}
              </p>
              <h2 className="text-lg font-bold text-text">{t('consultation.customerInfo')}</h2>
              {!isCustomerLinkFlow && (
                <p className="text-xs text-text-muted mt-0.5">
                  {t('consultation.searchExisting')}
                  {locale !== 'ko' && (
                    <span className="ml-1 text-[9px] opacity-60">{tKo('consultation.searchExisting')}</span>
                  )}
                </p>
              )}
            </div>
          </motion.div>

          <CustomerInfoForm
            name={name}
            phone={phone}
            memo={memo}
            nameError={showNameError && !name.trim() ? tKo('customerForm.nameRequired') : undefined}
            onNameChange={(v) => { setName(v); setShowNameError(false); }}
            onPhoneChange={setPhone}
            onMemoChange={setMemo}
            onExistingCustomerSelect={handleExistingCustomer}
            allowExistingCustomerSearch={!isCustomerLinkFlow}
          />

          {/* 참고 이미지는 Step 1에서 통합 관리 (A-4) */}
        </div>
      </motion.main>

      <ConsultationFooter onNext={handleNextWithValidation} disabled={false} showEstimated={false} />
    </div>
  );
}

export default function CustomerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <CustomerPageInner />
    </Suspense>
  );
}
