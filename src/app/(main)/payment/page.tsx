'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRecordsStore } from '@/store/records-store';
import { useCustomerStore } from '@/store/customer-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useConsultationStore } from '@/store/consultation-store';
import { PaymentMethodSelector } from '@/components/payment/PaymentMethodSelector';
import { PaymentSummary } from '@/components/payment/PaymentSummary';
import { buildBreakdownFromRecord } from '@/lib/price-utils';
import { generateId } from '@/lib/generate-id';
import { getNowInKoreaIso, getTodayInKorea } from '@/lib/format';
import { DESIGN_SCOPE_LABEL, OFF_TYPE_LABEL } from '@/lib/labels';
import type { PaymentMethod } from '@/types/consultation';

type SectionId = 1 | 2 | 3 | 4 | 5;

export default function PaymentPage(): React.ReactElement | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recordId = searchParams.get('recordId');

  const getRecordById = useRecordsStore((s) => s.getRecordById);
  const updateRecord = useRecordsStore((s) => s.updateRecord);

  const record = recordId ? getRecordById(recordId) : undefined;

  // Guards
  useEffect(() => {
    if (!recordId) {
      router.replace('/home');
      return;
    }
    if (!record) {
      router.replace('/home');
      return;
    }
    if (!record.finalizedAt) {
      router.replace('/home');
    }
  }, [recordId, record, router]);

  const [currentSection, setCurrentSection] = useState<SectionId>(2);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);

  // Section 3: customer info
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Section 4: photos
  const [photos, setPhotos] = useState<{ id: string; dataUrl: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const section2Ref = useRef<HTMLDivElement>(null);
  const section3Ref = useRef<HTMLDivElement>(null);
  const section4Ref = useRef<HTMLDivElement>(null);
  const section5Ref = useRef<HTMLDivElement>(null);

  const sectionRefs = {
    section2: section2Ref,
    section3: section3Ref,
    section4: section4Ref,
    section5: section5Ref,
  };

  useEffect(() => {
    const refKey = `section${currentSection}` as keyof typeof sectionRefs;
    const ref = sectionRefs[refKey];
    if (ref?.current) {
      setTimeout(() => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  // sectionRefs is stable (refs), only re-run when currentSection changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSection]);

  const handlePaymentComplete = useCallback(async (): Promise<void> => {
    if (!paymentMethod || !record || !recordId) return;

    setIsProcessing(true);

    updateRecord(recordId, { paymentMethod });

    if (paymentMethod === 'membership' && record.customerId) {
      useCustomerStore.getState().useMembershipSession(record.customerId, recordId);
    }

    // 상담(consultation) 플로우 전용 고객 통계 업데이트
    // field-mode(quickSale)는 addQuickSaleRecord에서 이미 처리됨
    if (record.customerId && !record.isQuickSale) {
      useCustomerStore.getState().recordTreatmentCompletion(
        record.customerId,
        record.finalPrice,
        {
          recordId: record.id,
          date: getTodayInKorea(),
          bodyPart: record.consultation?.bodyPart ?? 'hand',
          designScope: record.consultation?.designScope ?? '기타',
          price: record.finalPrice,
          imageUrls: [],
        },
      );
    }

    if (record.customerId) {
      const existingCustomer = useCustomerStore.getState().getById(record.customerId);
      if (existingCustomer) {
        setIsProcessing(false);
        setCurrentSection(4);
        return;
      }
    }

    setIsProcessing(false);
    setCurrentSection(3);
  }, [paymentMethod, record, recordId, updateRecord]);

  const handleCustomerRegister = useCallback((): void => {
    if (!customerName.trim() || !record || !recordId) return;

    const customerStore = useCustomerStore.getState();
    const trimmedPhone = customerPhone.trim();

    let effectiveCustomerId: string;

    const matchedByPhone = trimmedPhone
      ? customerStore.findByPhoneNormalized(trimmedPhone)
      : undefined;

    if (matchedByPhone) {
      effectiveCustomerId = matchedByPhone.id;
    } else {
      const matchedByName = customerStore.customers.find((c) => c.name === customerName.trim());
      if (matchedByName) {
        effectiveCustomerId = matchedByName.id;
      } else {
        const newCustomer = customerStore.createCustomer({
          name: customerName.trim(),
          phone: trimmedPhone || undefined,
        });
        effectiveCustomerId = newCustomer.id;
      }
    }

    updateRecord(recordId, { customerId: effectiveCustomerId });
    updateRecord(recordId, {
      consultation: {
        ...record.consultation,
        customerName: customerName.trim(),
        customerPhone: trimmedPhone,
      },
    });

    setCurrentSection(4);
  }, [customerName, customerPhone, record, recordId, updateRecord]);

  const handleFileSelect = useCallback((files: FileList | null): void => {
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result;
        if (typeof dataUrl === 'string') {
          setPhotos((prev) => [
            ...prev,
            { id: generateId('photo'), dataUrl },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const handleSavePhotos = useCallback(async (): Promise<void> => {
    if (!record || !recordId || photos.length === 0) return;

    setIsUploading(true);

    try {
      const portfolioStore = usePortfolioStore.getState();
      const uploadedUrls: string[] = [];

      for (const photo of photos) {
        await portfolioStore.addPhoto({
          customerId: record.customerId,
          recordId: record.id,
          kind: 'treatment' as const,
          imageDataUrl: photo.dataUrl,
          takenAt: getNowInKoreaIso(),
          designType: DESIGN_SCOPE_LABEL[record.consultation.designScope] ?? '기타',
          price: record.finalPrice,
          isPublic: false,
        });
        uploadedUrls.push(photo.dataUrl);
      }

      updateRecord(recordId, { imageUrls: uploadedUrls });

      if (record.customerId) {
        const customerStore = useCustomerStore.getState();
        const customer = customerStore.getById(record.customerId);
        if (customer) {
          const updatedHistory = customer.treatmentHistory.map((h) => {
            if (h.recordId === record.id) {
              return { ...h, imageUrls: [...(h.imageUrls ?? []), ...uploadedUrls] };
            }
            return h;
          });
          customerStore.updateCustomer(record.customerId, { treatmentHistory: updatedHistory });
        }
      }

      setCurrentSection(5);
    } catch (err) {
      console.error('[payment] photo save failed:', err);
      setPhotoError(true);
    } finally {
      setIsUploading(false);
    }
  }, [record, recordId, photos, updateRecord]);

  if (!recordId || !record || !record.finalizedAt) {
    return null;
  }

  const breakdown = buildBreakdownFromRecord(record);
  const membership =
    record.customerId
      ? useCustomerStore.getState().getById(record.customerId)?.membership
      : undefined;

  const offLabel = record.consultation.offType !== 'none'
    ? OFF_TYPE_LABEL[record.consultation.offType]
    : null;

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3 border-b border-border shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface transition-colors"
          aria-label="뒤로 가기"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-bold text-text">결제</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5 max-w-2xl mx-auto w-full">

        {/* Section 1: 오늘 시술 정리 */}
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-lg font-bold text-text mb-1">오늘 시술 내용이에요 😊</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {DESIGN_SCOPE_LABEL[record.consultation.designScope] ?? record.consultation.designScope}
            </span>
            {offLabel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-border text-text-secondary text-xs font-semibold">
                {offLabel}
              </span>
            )}
            {record.estimatedMinutes > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface border border-border text-text-muted text-xs">
                약 {record.estimatedMinutes}분
              </span>
            )}
          </div>
          <PaymentSummary breakdown={breakdown} />
          <p className="mt-3 text-xs text-text-muted text-center">추가된 내용까지 반영된 최종 금액이에요 😊</p>
        </div>

        {/* Section 2: 결제수단 선택 */}
        {currentSection >= 2 && (
          <div
            ref={section2Ref}
            className="rounded-2xl border border-border bg-surface p-5 animate-in fade-in duration-300"
          >
            <p className="text-base font-bold text-text mb-3">결제수단을 선택해주세요</p>
            <PaymentMethodSelector
              value={paymentMethod}
              onChange={setPaymentMethod}
              membershipRemaining={membership?.remainingSessions}
            />
            <button
              type="button"
              disabled={!paymentMethod || isProcessing}
              onClick={() => { void handlePaymentComplete(); }}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-primary transition-all active:scale-[0.98] mt-4 disabled:opacity-40"
            >
              {isProcessing ? '처리 중...' : '결제하기'}
            </button>
          </div>
        )}

        {/* Section 3: 고객정보 입력 (walk-in only) */}
        {currentSection === 3 && (
          <div
            ref={section3Ref}
            className="rounded-2xl border border-border bg-surface p-5 animate-in fade-in duration-300"
          >
            <p className="text-base font-bold text-text mb-1">
              다음 방문 때 편하게 도와드리려고 간단히 등록할게요 😊
            </p>
            <p className="text-sm text-text-muted mb-4">선택 사항이에요</p>
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="payment-customer-name" className="block text-xs font-semibold text-text-secondary mb-1.5">이름 <span className="text-error">*</span></label>
                <input
                  id="payment-customer-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="고객 이름"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>
              <div>
                <label htmlFor="payment-customer-phone" className="block text-xs font-semibold text-text-secondary mb-1.5">전화번호 <span className="text-text-muted">(선택)</span></label>
                <input
                  id="payment-customer-phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                />
              </div>
            </div>
            <button
              type="button"
              disabled={!customerName.trim()}
              onClick={handleCustomerRegister}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-primary transition-all active:scale-[0.98] mt-4 disabled:opacity-40"
            >
              등록하기
            </button>
            <button
              type="button"
              onClick={() => setCurrentSection(4)}
              className="w-full py-2.5 text-sm text-text-muted font-medium mt-2 hover:text-text transition-colors"
            >
              나중에 하기
            </button>
          </div>
        )}

        {/* Section 4: 사진 저장 */}
        {currentSection >= 4 && currentSection < 5 && (
          <div
            ref={section4Ref}
            className="rounded-2xl border border-border bg-surface p-5 animate-in fade-in duration-300"
          >
            <p className="text-base font-bold text-text mb-1">시술 사진을 저장해볼까요? 😊</p>
            <p className="text-sm text-text-muted mb-4">오늘 시술 기록으로 남겨둘게요 😊</p>

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />

            {/* Upload buttons */}
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                disabled={isUploading}
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 py-3 rounded-xl border border-border bg-background text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
              >
                <span aria-hidden="true">📷</span>
                <span>카메라 촬영</span>
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={() => galleryInputRef.current?.click()}
                className="flex-1 py-3 rounded-xl border border-border bg-background text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
              >
                <span aria-hidden="true">🖼</span>
                <span>갤러리에서 선택</span>
              </button>
            </div>

            {/* Photo preview grid */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.dataUrl}
                      alt="시술 사진"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos((prev) => prev.filter((p) => p.id !== photo.id))}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white text-xs flex items-center justify-center hover:bg-black/80 transition-colors"
                      aria-label="사진 삭제"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              disabled={photos.length === 0 || isUploading}
              onClick={() => { void handleSavePhotos(); }}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-primary transition-all active:scale-[0.98] disabled:opacity-40"
            >
              {isUploading ? '저장 중...' : '사진 저장하기'}
            </button>
            {photoError && (
              <p className="text-xs text-error text-center mt-1">사진 저장에 실패했어요. 다시 시도해주세요.</p>
            )}
            <button
              type="button"
              onClick={() => setCurrentSection(5)}
              className="w-full py-2.5 text-sm text-text-muted font-medium mt-2 hover:text-text transition-colors"
            >
              건너뛰기
            </button>
          </div>
        )}

        {/* Section 5: 완료 화면 */}
        {currentSection === 5 && (
          <div
            ref={section5Ref}
            className="rounded-2xl border border-border bg-surface p-8 animate-in fade-in duration-300 flex flex-col items-center text-center"
          >
            {/* Checkmark */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-success">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path
                  d="M8 16L13.5 21.5L24 10"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h2 className="text-xl font-extrabold text-text mb-1">결제가 완료되었어요!</h2>
            {photos.length > 0 && (
              <p className="text-sm text-text-muted mb-6">포트폴리오에 자동 저장됐어요</p>
            )}
            {photos.length === 0 && (
              <button
                type="button"
                onClick={() => setCurrentSection(4)}
                className="text-sm text-primary font-medium mb-6 hover:underline"
              >
                시술 사진 추가하기
              </button>
            )}

            <div className="flex flex-col gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  useConsultationStore.getState().reset();
                  router.push('/home');
                }}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-primary transition-all active:scale-[0.98]"
              >
                홈으로 가기
              </button>
              <button
                type="button"
                onClick={() => router.push('/records')}
                className="w-full py-3 rounded-xl font-semibold text-sm border border-border text-text-secondary hover:bg-surface transition-colors"
              >
                기록 보기
              </button>
            </div>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-6" />
      </div>
    </div>
  );
}
