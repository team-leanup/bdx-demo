'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationSummaryCard } from '@/components/consultation/ConsultationSummaryCard';
import { DiscountModal } from '@/components/consultation/DiscountModal';
import { Button, ToastContainer } from '@/components/ui';
import type { ToastData } from '@/components/ui';
import { useT, useLocale, useKo } from '@/lib/i18n';
import { useLocaleStore } from '@/store/locale-store';
import { calculatePrice, buildServicePricingFromShopSettings } from '@/lib/price-calculator';
import { useAppStore } from '@/store/app-store';
import { estimateTime } from '@/lib/time-calculator';
import { formatPrice, formatLocaleCurrency, getNowInKoreaIso } from '@/lib/format';
import { DESIGN_SCOPE_LABEL, EXPRESSION_LABEL } from '@/lib/labels';
import { useRecordsStore } from '@/store/records-store';
import { useReservationStore } from '@/store/reservation-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAuthStore } from '@/store/auth-store';
import type { ConsultationRecord, BookingStatus } from '@/types/consultation';
import type { CustomerTag, TagCategory } from '@/types/customer';
import { useCustomerStore } from '@/store/customer-store';
import { useShopStore } from '@/store/shop-store';
import { dbCompletePreconsultationBooking, dbUpsertCustomer, fetchBookingRequestById, fetchDesignerById } from '@/lib/db';
import { ConsultationStep } from '@/types/consultation';
import { useConsultationGuard } from '@/lib/use-consultation-guard';

export default function SummaryPage() {
  useConsultationGuard();
  const router = useRouter();
  const consultation = useConsultationStore((s) => s.consultation);
  const bookingId = useConsultationStore((s) => s.consultation.bookingId);
  const entryPoint = useConsultationStore((s) => s.consultation.entryPoint);
  const setStep = useConsultationStore((s) => s.setStep);
  const currentShopId = useAuthStore((s) => s.currentShopId);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const updateReservation = useReservationStore((s) => s.updateReservation);
  const updateReservationAfterPreconsult = useReservationStore((s) => s.updateReservation);
  const reservations = useReservationStore((s) => s.reservations);
  const restoreLocale = useLocaleStore((s) => s.restoreLocale);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerMemo, setCustomerMemo] = useState('');
  const [additionalCharge, setAdditionalCharge] = useState(0);
  const [additionalChargeInput, setAdditionalChargeInput] = useState('');
  const isCustomerLinkFlow = entryPoint === 'customer_link';

  const shopSettings = useAppStore((s) => s.shopSettings);
  const shopPricing = useMemo(() => buildServicePricingFromShopSettings(shopSettings), [shopSettings]);
  const breakdown = useMemo(() => calculatePrice(consultation, shopPricing), [consultation, shopPricing]);
  const adjustedFinalPrice = breakdown.finalPrice + additionalCharge;
  const addRecord = useRecordsStore((s) => s.addRecord);
  const addPhoto = usePortfolioStore((s) => s.addPhoto);
  const createCustomer = useCustomerStore((s) => s.createCustomer);
  const getDesignerName = useShopStore((s) => s.getDesignerName);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const handleDismissToast = useCallback((toastId: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
  }, []);
  const pushToast = useCallback((type: ToastData['type'], message: string): void => {
    setToasts((prev) => [...prev, { id: `toast-${Date.now()}`, type, message }]);
  }, []);
  const customerLinkBackLabel = t('consultation.customerLinkBack');
  const customerLinkSubmitLabel = t('consultation.customerLinkSubmit');
  const customerLinkParams = new URLSearchParams();
  customerLinkParams.set('entry', 'customer-link');
  if (consultation.sourceShopId) customerLinkParams.set('shopId', consultation.sourceShopId);
  if (consultation.sourceShopName) customerLinkParams.set('shopName', consultation.sourceShopName);
  const customerLinkEntryHref = `/consultation?${customerLinkParams.toString()}`;

  useEffect(() => {
    const memo = sessionStorage.getItem('consultation_customer_memo') ?? '';
    setCustomerMemo(memo);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
    await new Promise((r) => setTimeout(r, 600));
    const linkedBooking = isCustomerLinkFlow && bookingId
      ? await fetchBookingRequestById(bookingId, consultation.sourceShopId)
      : null;
    const isExternalCustomerLinkFlow = isCustomerLinkFlow && !currentShopId;

    const effectiveShopId = isCustomerLinkFlow
      ? (consultation.sourceShopId || linkedBooking?.shopId || currentShopId)
      : currentShopId;

    const effectiveDesignerId = consultation.designerId
      || linkedBooking?.designerId
      || activeDesignerId;

    if (!effectiveShopId) {
      pushToast('error', '샵 정보를 찾을 수 없어요');
      setSaving(false);
      return;
    }

    if (!effectiveDesignerId) {
      pushToast('error', '예약에 연결된 담당 선생님 정보를 찾을 수 없어요');
      setSaving(false);
      return;
    }

    const effectiveDesignerName = getDesignerName(effectiveDesignerId)
      || (await fetchDesignerById(effectiveDesignerId))?.name
      || '디자이너';

    const linkedCustomerId = consultation.customerId || linkedBooking?.customerId;
    const createdCustomer = linkedCustomerId
      ? null
      : createCustomer({
          name: consultation.customerName ?? '새 고객',
          phone: consultation.customerPhone ?? '',
          assignedDesignerId: effectiveDesignerId,
          assignedDesignerName: effectiveDesignerName,
          shopId: effectiveShopId,
        });
    const customerId = linkedCustomerId || createdCustomer?.id;

    if (!customerId) {
      pushToast('error', '고객 정보를 확인해주세요');
      setSaving(false);
      return;
    }

    if (createdCustomer) {
      // Wait for customer to be saved to DB before saving record (FK constraint)
      const upsertResult = await dbUpsertCustomer(createdCustomer).catch((err) => {
        console.error(err);
        return { success: false } as const;
      });
      if (!upsertResult || !upsertResult.success) {
        pushToast('error', '고객 데이터 저장에 실패했어요. 다시 시도해주세요');
        setSaving(false);
        return;
      }
    }
    const newId = `record-${Date.now()}`;
    const minutes = estimateTime(consultation);
    const now = getNowInKoreaIso();
    const consultationSnapshot = JSON.parse(JSON.stringify({ ...consultation })) as typeof consultation;
    const bookingLanguage = linkedBooking?.language || (
      bookingId
        ? reservations.find((r) => r.id === bookingId)?.language
        : undefined
    );

    if (isCustomerLinkFlow && bookingId && isExternalCustomerLinkFlow) {
      const preconsultationResult = await dbCompletePreconsultationBooking(
        bookingId,
        consultationSnapshot,
        now,
        linkedCustomerId,
      );

      if (!preconsultationResult.success) {
        pushToast('error', '상담 저장에 실패했어요. 다시 시도해주세요');
        setSaving(false);
        return;
      }

      updateReservationAfterPreconsult(bookingId, {
        preConsultationCompletedAt: now,
        preConsultationData: consultationSnapshot,
        customerId: linkedCustomerId,
      });

      sessionStorage.removeItem('consultation_customer_memo');
      restoreLocale();
      router.push(`/consultation/save-complete?mode=preconsultation${linkedCustomerId ? `&customerId=${linkedCustomerId}` : ''}`);
      return;
    }

    const savedRecord: ConsultationRecord = {
      id: newId,
      shopId: effectiveShopId,
      designerId: effectiveDesignerId,
      customerId,
      consultation: consultationSnapshot,
      totalPrice: breakdown.subtotal,
      estimatedMinutes: minutes,
      finalPrice: adjustedFinalPrice,
      createdAt: now,
      updatedAt: now,
      notes: customerMemo || undefined,
      language: bookingLanguage,
    };

    if (isCustomerLinkFlow && bookingId) {
      await addRecord(savedRecord);
      const preconsultationResult = await dbCompletePreconsultationBooking(
        bookingId,
        consultationSnapshot,
        now,
        customerId,
      );

      if (!preconsultationResult.success) {
        pushToast('error', '상담 저장에 실패했어요. 다시 시도해주세요');
        setSaving(false);
        return;
      }

      updateReservationAfterPreconsult(bookingId, {
        preConsultationCompletedAt: now,
        preConsultationData: consultationSnapshot,
        customerId,
      });
    } else {
      sessionStorage.setItem(`bdx-saved-record-${newId}`, JSON.stringify(savedRecord));

      await addRecord(savedRecord);

      if (bookingId) {
        updateReservation(bookingId, {
          status: 'completed' as BookingStatus,
          designerId: effectiveDesignerId,
          preConsultationData: consultationSnapshot,
          customerId,
        });
      }

      if (customerId && consultation.referenceImages?.length) {
        await Promise.all(consultation.referenceImages.map(async (imageUrl) => {
          if (!imageUrl.startsWith('data:image/')) return;
          await addPhoto({
            customerId,
            recordId: newId,
            kind: 'reference',
            imageDataUrl: imageUrl,
            takenAt: now,
            tags: consultation.selectedTraitValues,
            serviceType: DESIGN_SCOPE_LABEL[consultation.designScope] ?? consultation.designScope,
            designType: consultation.expressions
              .filter((expression) => expression !== 'solid')
              .map((expression) => EXPRESSION_LABEL[expression] ?? expression)
              .join(', ') || undefined,
            price: adjustedFinalPrice,
          });
        }));
      }
    }

    // 고객 데이터 연동: 방문횟수, 매출, 시술이력 갱신
    const { getById: getCustById, updateCustomer: updateCust } = useCustomerStore.getState();
    const existingCustomer = getCustById(customerId);
    if (existingCustomer) {
      const newVisitCount = existingCustomer.visitCount + 1;
      const newTotalSpend = existingCustomer.totalSpend + adjustedFinalPrice;
      updateCust(customerId, {
        visitCount: newVisitCount,
        lastVisitDate: now.split('T')[0],
        totalSpend: newTotalSpend,
        averageSpend: Math.round(newTotalSpend / newVisitCount),
        treatmentHistory: [
          ...(existingCustomer.treatmentHistory ?? []),
          {
            recordId: newId,
            date: now.split('T')[0],
            bodyPart: consultation.bodyPart,
            designScope: consultation.designScope,
            price: adjustedFinalPrice,
            designerName: effectiveDesignerName,
          },
        ],
      });
    }

    // 스몰토크 메모 → customer store smallTalkNotes에 자동 push
    if (customerMemo) {
      const customerName = consultation.customerName;
      const { customers, appendSmallTalkNote } = useCustomerStore.getState();
      const customer = customers.find((c) => c.name === customerName || c.id === customerId);
      if (customer) {
        const newNote = {
          id: `stn-${Date.now()}`,
          customerId: customer.id,
          consultationRecordId: newId,
          noteText: customerMemo,
          createdAt: now,
          createdByDesignerId: effectiveDesignerId,
          createdByDesignerName:
            customer.assignedDesignerName ?? effectiveDesignerName,
        };
        appendSmallTalkNote(customer.id, newNote);
      }
    }

    if (customerId && consultation.selectedTraitValues?.length) {
      const { getById, updateTags } = useCustomerStore.getState();
      const customer = getById(customerId);
      if (customer) {
        const existingValues = new Set(customer.tags.map((tag) => tag.value));
        const newTags: CustomerTag[] = consultation.selectedTraitValues
          .filter((value) => !existingValues.has(value))
          .map((value, i) => ({
            id: `tag-${Date.now()}-${i}`,
            customerId,
            category: 'etc' as TagCategory,
            value,
            isCustom: false,
            createdAt: now,
            pinned: true,
            sortOrder: customer.tags.filter((tag) => tag.pinned).length + i,
          }));

        if (newTags.length > 0) {
          updateTags(customerId, [...customer.tags, ...newTags]);
        }
      }
    }

    sessionStorage.removeItem('consultation_customer_memo');
    restoreLocale();

    if (isCustomerLinkFlow) {
      router.push(`/consultation/save-complete?consultationId=${newId}&customerId=${customerId}&mode=preconsultation`);
      return;
    }

    router.push(`/consultation/treatment-sheet?consultationId=${newId}&customerId=${customerId}`);
    } catch (err) {
      console.error(err);
      pushToast('error', '저장 중 오류가 발생했어요. 다시 시도해주세요');
      setSaving(false);
    }
  };

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      <ConsultationHeader
        stepNumber={5}
        totalSteps={5}
        title={t('consultation.summaryTitle')}
        titleKo={tKo('consultation.summaryTitle')}
        onBack={() => {
          setStep(ConsultationStep.TRAITS);
          router.push('/consultation/traits');
        }}
        onClose={() => router.push(isCustomerLinkFlow ? customerLinkEntryHref : '/home')}
      />

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-y-auto px-4 md:px-8 pt-5 pb-32 sm:pb-40 md:pb-6"
      >
        <div className="max-w-2xl md:max-w-3xl mx-auto flex flex-col gap-4">
          {isCustomerLinkFlow && consultation.sourceShopName && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Consultation Link</p>
              <p className="mt-1 text-sm font-bold text-text">{consultation.sourceShopName}</p>
              <p className="mt-1 text-xs text-text-muted">
                {t('consultation.sourceShopLinkDesc').replace('{shopName}', consultation.sourceShopName ?? '')}
                {locale !== 'ko' && (
                  <span className="block text-[10px] opacity-60 mt-0.5">
                    {tKo('consultation.sourceShopLinkDesc').replace('{shopName}', consultation.sourceShopName ?? '')}
                  </span>
                )}
              </p>
            </div>
          )}

          <ConsultationSummaryCard />

          {!isCustomerLinkFlow && (
            <div className="rounded-2xl border border-border bg-white p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-text">
                {t('summary.finalPayment')}
                {locale !== 'ko' && (
                  <span className="ml-1 text-[10px] font-medium text-text-muted opacity-60">{tKo('summary.finalPayment')}</span>
                )}
              </h3>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">
                {t('summary.subtotal')}
                {locale !== 'ko' && <span className="ml-1 text-[10px] opacity-60">{tKo('summary.subtotal')}</span>}
              </span>
              <span className="text-sm font-medium text-text">
                {locale !== 'ko' ? formatLocaleCurrency(breakdown.subtotal, locale) : formatPrice(breakdown.subtotal)}
                {locale !== 'ko' && <span className="text-xs opacity-60 ml-1">{formatPrice(breakdown.subtotal)}</span>}
              </span>
            </div>

            {breakdown.discountAmount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-muted">
                  {t('summary.discountLabel')}
                  {locale !== 'ko' && <span className="ml-1 text-[10px] opacity-60">{tKo('summary.discountLabel')}</span>}
                </span>
                <span className="text-sm font-medium text-error">
                  -{locale !== 'ko' ? formatLocaleCurrency(breakdown.discountAmount, locale) : formatPrice(breakdown.discountAmount)}
                  {locale !== 'ko' && <span className="text-xs opacity-60 ml-1">-{formatPrice(breakdown.discountAmount)}</span>}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm text-text-muted">
                {t('summary.additionalCharge')}
                {locale !== 'ko' && <span className="ml-1 text-[10px] opacity-60">{tKo('summary.additionalCharge')}</span>}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-text-muted">₩</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={additionalChargeInput}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9-]/g, '');
                    setAdditionalChargeInput(raw);
                    const num = parseInt(raw, 10);
                    setAdditionalCharge(isNaN(num) ? 0 : num);
                  }}
                  placeholder="0"
                  className="w-24 text-right text-sm font-medium text-text bg-surface-alt border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t-2 border-border">
              <span className="text-sm font-bold text-text">
                {t('summary.totalAmount')}
                {locale !== 'ko' && <span className="ml-1 text-[10px] font-medium text-text-muted opacity-60">{tKo('summary.totalAmount')}</span>}
              </span>
              <span className="text-lg font-bold text-primary">
                {locale !== 'ko' ? formatLocaleCurrency(adjustedFinalPrice, locale) : formatPrice(adjustedFinalPrice)}
                {locale !== 'ko' && <span className="text-xs opacity-60 ml-1">{formatPrice(adjustedFinalPrice)}</span>}
              </span>
            </div>
            </div>
          )}
          {customerMemo && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-xs font-bold text-amber-700">
                  <span className="text-[15px] font-bold text-text">{t('summary.customerMemo')}</span>
                  {locale !== 'ko' && (
                    <span className="text-xs text-amber-600 opacity-60 font-bold ml-1">{tKo('summary.customerMemo')}</span>
                  )}
                </p>
                <span className="text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                  {t('summary.autoSaveHint')}
                  {locale !== 'ko' && (
                    <span className="ml-1 opacity-60">{tKo('summary.autoSaveHint')}</span>
                  )}
                </span>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">{customerMemo}</p>
            </div>
          )}
        </div>
      </motion.main>

      {/* Action bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-border px-4 pt-3 pb-5 flex flex-col gap-2.5 safe-bottom md:static md:flex-shrink-0 md:px-8">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="md"
            onClick={() => router.back()}
            className={isCustomerLinkFlow ? 'w-full gap-1.5' : 'flex-1 gap-1.5'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            {isCustomerLinkFlow ? customerLinkBackLabel : t('consultation.modifyConsultation')}
            {locale !== 'ko' && (
              <span className="ml-1 text-[10px] opacity-60">
                {isCustomerLinkFlow ? tKo('consultation.customerLinkBack') : tKo('consultation.modifyConsultation')}
              </span>
            )}
          </Button>
          {!isCustomerLinkFlow && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDiscountOpen(true)}
              className="flex-1 gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
              </svg>
              {t('consultation.discountApply')}
              {locale !== 'ko' && (
                <span className="ml-1 text-[10px] opacity-60">{tKo('consultation.discountApply')}</span>
              )}
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary-dark active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {saving ? (
            <>
              {t('common.loading')}
              {locale !== 'ko' && <span className="ml-1 text-sm opacity-70">{tKo('common.loading')}</span>}
            </>
          ) : (
            <>
              {isCustomerLinkFlow ? customerLinkSubmitLabel : t('consultation.saveAndComplete')}
              {locale !== 'ko' && <span className="ml-1 text-sm opacity-70">{isCustomerLinkFlow ? tKo('consultation.customerLinkSubmit') : tKo('consultation.saveAndComplete')}</span>}
            </>
          )}
        </button>
      </footer>

      {!isCustomerLinkFlow && <DiscountModal isOpen={discountOpen} onClose={() => setDiscountOpen(false)} />}
    </div>
  );
}
