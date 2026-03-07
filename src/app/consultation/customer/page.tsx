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
import type { Customer } from '@/types/customer';
import { useLocaleStore } from '@/store/locale-store';
import type { Locale } from '@/store/locale-store';
import { useT, useLocale, useKo } from '@/lib/i18n';

const LANGUAGE_BADGE: Record<Locale, { flag: string; label: string }> = {
  ko: { flag: '🇰🇷', label: '한국어' },
  en: { flag: '🇺🇸', label: 'English' },
  zh: { flag: '🇨🇳', label: '中文' },
  ja: { flag: '🇯🇵', label: '日本語' },
};

function CustomerPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setCustomerInfo = useConsultationStore((s) => s.setCustomerInfo);
  const setBookingId = useConsultationStore((s) => s.setBookingId);
  const setStep = useConsultationStore((s) => s.setStep);
  const consultation = useConsultationStore((s) => s.consultation);
  const addReferenceImage = useConsultationStore((s) => s.addReferenceImage);
  const removeReferenceImage = useConsultationStore((s) => s.removeReferenceImage);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const current = consultation.referenceImages || [];
    for (let i = 0; i < files.length && current.length + i < 5; i++) {
      addReferenceImage(URL.createObjectURL(files[i]));
    }
    e.target.value = '';
  };

  // 쿼리 파라미터에서 예약 정보 읽기 (예약 → 상담 연동)
  const prefillName = searchParams.get('name') ?? '';
  const prefillPhone = searchParams.get('phone') ?? '';
  const prefillNote = searchParams.get('note') ?? '';
  const prefillLang = searchParams.get('lang') as Locale | null;
  const prefillBookingId = searchParams.get('bookingId') ?? '';

  const [name, setName] = useState(consultation.customerName ?? prefillName);
  const [phone, setPhone] = useState(consultation.customerPhone ?? prefillPhone);
  const [memo, setMemo] = useState(prefillNote);

  // 쿼리 파라미터가 있으면 초기 로드 시 상태 동기화
  // initialRef captures values at mount time so we can safely use an empty deps array
  const initialRef = useRef({
    prefillName,
    prefillPhone,
    prefillNote,
    prefillLang,
    prefillBookingId,
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
      customerName,
      customerPhone,
    } = initialRef.current;
    if (name && !customerName) {
      setName(name);
    }
    if (phone && !customerPhone) {
      setPhone(phone);
    }
    if (note) {
      setMemo(note);
    }
    if (lang && ['ko', 'en', 'zh', 'ja'].includes(lang)) {
      setConsultationLocale(lang);
    }
    if (bookingId) {
      setBookingId(bookingId);
    }
  }, [setBookingId, setConsultationLocale]);

  const handleExistingCustomer = (customer: Customer) => {
    setName(customer.name);
    setPhone(customer.phone);
    setCustomerInfo(customer.name, customer.phone, customer.id);
  };

  const handleNext = () => {
    setCustomerInfo(name, phone);
    // Persist memo to sessionStorage so summary page can append it to customer notes
    if (memo.trim()) {
      sessionStorage.setItem('consultation_customer_memo', memo.trim());
    } else {
      sessionStorage.removeItem('consultation_customer_memo');
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

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={1}
        totalSteps={5}
        title={t('consultation.customerInfo')}
        titleKo={tKo('consultation.customerInfo')}
        backHref="/consultation"
      />
      <PriceSummaryBar />

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
              <p className="text-xs text-text-muted mt-0.5">
                {t('consultation.searchExisting')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[9px] opacity-60">{tKo('consultation.searchExisting')}</span>
                )}
              </p>
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
          />

          {/* 참고 이미지 업로드 */}
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-semibold text-text mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-lg font-black">{t('consultation.referenceTitle')}</span>
              {locale !== 'ko' && (
                <span className="text-xs text-text-muted opacity-60 font-bold">{tKo('consultation.referenceTitle')}</span>
              )}
            </p>
            {(consultation.referenceImages || []).length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {(consultation.referenceImages || []).map((url, i) => (
                  <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border border-border flex-shrink-0">
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
                  <span className="text-lg font-black">{t('consultation.referenceAdd')}</span>
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
          </div>
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
