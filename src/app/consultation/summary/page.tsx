'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { ConsultationHeader } from '@/components/consultation/ConsultationHeader';
import { ConsultationSummaryCard } from '@/components/consultation/ConsultationSummaryCard';
import { DiscountModal } from '@/components/consultation/DiscountModal';
import { Button } from '@/components/ui';
import { useT, useLocale, useKo } from '@/lib/i18n';
import { useLocaleStore } from '@/store/locale-store';
import { calculatePrice } from '@/lib/price-calculator';
import { estimateTime } from '@/lib/time-calculator';
import { MOCK_CUSTOMERS } from '@/data/mock-customers';
import { useRecordsStore } from '@/store/records-store';
import { useReservationStore } from '@/store/reservation-store';
import type { ConsultationRecord, BookingStatus } from '@/types/consultation';

export default function SummaryPage() {
  const router = useRouter();
  const reset = useConsultationStore((s) => s.reset);
  const consultation = useConsultationStore((s) => s.consultation);
  const bookingId = useConsultationStore((s) => s.consultation.bookingId);
  const updateReservation = useReservationStore((s) => s.updateReservation);
  const restoreLocale = useLocaleStore((s) => s.restoreLocale);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerMemo, setCustomerMemo] = useState('');
  const addRecord = useRecordsStore((s) => s.addRecord);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  useEffect(() => {
    const memo = sessionStorage.getItem('consultation_customer_memo') ?? '';
    setCustomerMemo(memo);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const customerId = consultation.customerId || 'customer-001';
    const newId = `record-${Date.now()}`;
    const breakdown = calculatePrice(consultation);
    const minutes = estimateTime(consultation);
    const now = new Date().toISOString();
    const savedRecord: ConsultationRecord = {
      id: newId,
      shopId: 'shop-001',
      designerId: consultation.designerId || 'designer-001',
      customerId,
      consultation: { ...consultation },
      totalPrice: breakdown.subtotal,
      estimatedMinutes: minutes,
      finalPrice: breakdown.finalPrice,
      createdAt: now,
      updatedAt: now,
      notes: customerMemo || undefined,
    };
    sessionStorage.setItem(`bdx-saved-record-${newId}`, JSON.stringify(savedRecord));

    addRecord(savedRecord);

    if (bookingId) {
      updateReservation(bookingId, { status: 'completed' as BookingStatus });
    }

    // 스몰토크 메모 → MOCK_CUSTOMERS 해당 고객 smallTalkNotes에 자동 push
    if (customerMemo) {
      const customerName = consultation.customerName;
      const designerId = consultation.designerId || 'designer-001';
      const customer = MOCK_CUSTOMERS.find(
        (c) => c.name === customerName || c.id === customerId,
      );
      if (customer) {
        const newNote = {
          id: `stn-${Date.now()}`,
          customerId: customer.id,
          consultationRecordId: newId,
          noteText: customerMemo,
          createdAt: now,
          createdByDesignerId: designerId,
          createdByDesignerName:
            customer.assignedDesignerName ?? '디자이너',
        };
        customer.smallTalkNotes = [...customer.smallTalkNotes, newNote];
      }
    }

    sessionStorage.removeItem('consultation_customer_memo');
    restoreLocale();
    // reset()은 treatment-sheet에서 "홈으로" 클릭 시 수행됨
    router.push(`/consultation/treatment-sheet?consultationId=${newId}&customerId=${customerId}`);
  };

  return (
    <div className="h-dvh md:min-h-0 md:flex-1 bg-background flex flex-col overflow-hidden">
      <ConsultationHeader
        stepNumber={5}
        totalSteps={5}
        title={t('consultation.summaryTitle')}
        titleKo={tKo('consultation.summaryTitle')}
        backHref="/consultation/canvas"
        onClose={() => router.push('/home')}
      />

      <motion.main
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 overflow-y-auto px-4 md:px-8 pt-5 pb-40 md:pb-6"
      >
        <div className="max-w-2xl md:max-w-3xl mx-auto flex flex-col gap-4">
          <ConsultationSummaryCard />

          {/* Customer memo / small talk note — auto-saved to customer record on save */}
          {customerMemo && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-xs font-bold text-amber-700">
                  <span className="text-lg font-black">{t('summary.customerMemo')}</span>
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
          <Button
            variant="ghost"
            size="md"
            onClick={() => router.back()}
            className="flex-1 gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            {t('consultation.modifyConsultation')}
            {locale !== 'ko' && (
              <span className="ml-1 text-[10px] opacity-60">{tKo('consultation.modifyConsultation')}</span>
            )}
          </Button>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/85 text-white font-bold text-base shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:from-primary/95 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
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
              {t('consultation.saveAndComplete')}
              {locale !== 'ko' && <span className="ml-1 text-sm opacity-70">{tKo('consultation.saveAndComplete')}</span>}
            </>
          )}
        </button>
      </footer>

      <DiscountModal isOpen={discountOpen} onClose={() => setDiscountOpen(false)} />
    </div>
  );
}
