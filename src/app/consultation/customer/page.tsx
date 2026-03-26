'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationStep } from '@/types/consultation';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationFooter } from '@/components/consultation/ConsultationFooter';
import { PriceSummaryBar } from '@/components/consultation/PriceSummaryBar';
import { CustomerInfoForm } from '@/components/consultation/CustomerInfoForm';
import { MoodTagSelector } from '@/components/consultation/MoodTagSelector';
import { PortfolioBrowser } from '@/components/consultation/PortfolioBrowser';
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
  const addReferenceImage = useConsultationStore((s) => s.addReferenceImage);
  const removeReferenceImage = useConsultationStore((s) => s.removeReferenceImage);
  const moodTags = useConsultationStore((s) => s.consultation.moodTags) ?? [];
  const toggleMoodTag = useConsultationStore((s) => s.toggleMoodTag);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  // M-7: Blob URL 대신 base64로 저장 (세션 종료 후에도 유효)
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
      [ConsultationStep.TRAITS]: '/consultation/traits',
      [ConsultationStep.CANVAS]: '/consultation/canvas',
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

  const stepNumber = 1;
  const backHref = '/consultation';
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
        totalSteps={5}
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

          {/* C-2: customer_link 모드 — 사진 업로드 최상단 */}
          {prefillEntry === 'customer_link' && (
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

              {/* 업로드된 이미지 */}
              {(consultation.referenceImages || []).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {(consultation.referenceImages || []).map((url, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border flex-shrink-0">
                      <Image src={url} alt="" fill unoptimized className="object-cover" />
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
                </div>
              )}

              {/* 업로드 버튼 */}
              {(consultation.referenceImages || []).length < 5 && (
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

              {/* 무드 태그 */}
              <MoodTagSelector
                selected={moodTags}
                onToggle={toggleMoodTag}
              />

              {/* 포트폴리오 브라우저 */}
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
                shopId={prefillShopId || consultation.sourceShopId}
                shopName={visibleShopName}
              />
            </motion.div>
          )}

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

          {/* 참고 이미지 업로드 — staff 모드에서만 표시 (customer_link는 상단에 이미 있음) */}
          {prefillEntry !== 'customer_link' && <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-[15px] font-bold text-text">{t('consultation.referenceTitle')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('consultation.referenceTitle')}</span>
              )}
            </p>
            {(consultation.referenceImages || []).length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {(consultation.referenceImages || []).map((url, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-border flex-shrink-0">
                    <Image src={url} alt="" fill unoptimized className="object-cover" />
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
              </div>
            )}
            {(consultation.referenceImages || []).length < 5 && (
              <label className="w-full rounded-xl border-2 border-dashed border-border bg-surface-alt flex items-center justify-center gap-2 py-4 text-text-muted cursor-pointer hover:border-primary hover:text-primary transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium">
                  <span className="text-[15px] font-bold text-text">{t('consultation.referenceAdd')}</span>
                  {locale !== 'ko' && (
                    <span className="text-xs text-text-muted opacity-60 font-bold ml-1">{tKo('consultation.referenceAdd')}</span>
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
            <p className="text-[11px] text-text-muted mt-2">
              {t('consultation.referenceHint')}
              {locale !== 'ko' && (
                <span className="ml-1 opacity-60">{tKo('consultation.referenceHint')}</span>
              )}
            </p>
          </div>}
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
