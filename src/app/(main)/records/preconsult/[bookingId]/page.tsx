'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useReservationStore } from '@/store/reservation-store';
import { useConsultationStore } from '@/store/consultation-store';
import { useCustomerStore } from '@/store/customer-store';
import { useLocaleStore } from '@/store/locale-store';
import { ConsultationStep } from '@/types/consultation';
import { useFieldModeStore } from '@/store/field-mode-store';
import { toKoreanDateString } from '@/lib/format';
import { useAppStore } from '@/store/app-store';
import { PreConsultDetailView } from '@/components/consultation/PreConsultDetailView';
import type { PreConsultationData } from '@/types/pre-consultation';

// ───────── 메인 페이지 ─────────
export default function PreConsultDetailPage({ params }: { params: Promise<{ bookingId: string }> }): React.ReactElement {
  const { bookingId } = use(params);
  const router = useRouter();
  const booking = useReservationStore((s) => s.reservations.find((r) => r.id === bookingId));
  const updateReservation = useReservationStore((s) => s.updateReservation);
  const findCustomerByPhone = useCustomerStore((s) => s.findByPhoneNormalized);
  const allCustomers = useCustomerStore((s) => s.customers);
  const createCustomer = useCustomerStore((s) => s.createCustomer);
  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const hydrateFromBooking = useFieldModeStore((s) => s.hydrateFromBooking);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);
  const shopSettings = useAppStore((s) => s.shopSettings);

  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60dvh] gap-4 px-4">
        <p className="text-text-muted">예약을 찾을 수 없습니다</p>
        <button onClick={() => router.replace('/records')} className="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white">
          기록으로 돌아가기
        </button>
      </div>
    );
  }

  const raw = booking.preConsultationData as unknown as PreConsultationData | undefined;
  // store/source 배열을 직접 변이하지 않도록 새 배열 생성
  const baseImages = raw?.referenceImageUrls?.length
    ? raw.referenceImageUrls
    : (booking.referenceImageUrls ?? []);
  const images = raw?.selectedPhotoUrl && !baseImages.includes(raw.selectedPhotoUrl)
    ? [raw.selectedPhotoUrl, ...baseImages]
    : [...baseImages];

  // 0601: '고객 카드 보기'가 DB hydration(~1초) 후 booking.customerId가 채워지며 뒤늦게
  //   나타나 버튼 바가 2→3개로 튀던 깜빡임 방지 — 전화/이름으로 고객 스토어에서도 즉시
  //   매칭(읽기 전용, 생성 X)해 첫 렌더에 버튼 유무를 확정한다. allCustomers 구독이라 반응형.
  const linkedCustomerId =
    booking.customerId ??
    (booking.phone ? findCustomerByPhone(booking.phone)?.id : undefined) ??
    (booking.customerName ? allCustomers.find((c) => c.name === booking.customerName)?.id : undefined);

  const handleConfirm = (): void => {
    const resolvedCustomerId = resolveOrCreateCustomer();
    updateReservation(booking.id, {
      status: 'confirmed',
      ...(resolvedCustomerId && resolvedCustomerId !== booking.customerId
        ? { customerId: resolvedCustomerId }
        : {}),
    });
    // [MED] 예약 날짜를 쿼리파라미터로 전달 → records 페이지가 오늘로 초기화되지 않도록
    const dateParam = booking.reservationDate ? `?date=${booking.reservationDate}` : '';
    router.push(`/records${dateParam}`);
  };

  // customer 자동 매칭/생성 (handleConfirm·handleStartConsultation에서 공통 사용)
  const resolveOrCreateCustomer = (): string | undefined => {
    if (booking.customerId) return booking.customerId;
    const byPhone = booking.phone ? findCustomerByPhone(booking.phone) : undefined;
    if (byPhone) return byPhone.id;
    // 이름 또는 전화번호 중 하나는 있을 때만 customer 생성
    if (booking.customerName || booking.phone) {
      const byName = booking.customerName
        ? allCustomers.find((c) => c.name === booking.customerName)
        : undefined;
      if (byName) return byName.id;
      const newCustomer = createCustomer({
        name: booking.customerName || '신규 손님',
        phone: booking.phone || undefined,
        preferredLanguage: booking.language,
        assignedDesignerId: booking.designerId,
        isRegular: false,
      });
      return newCustomer.id;
    }
    return undefined;
  };

  const handleStartConsultation = (): void => {
    if (booking.language && ['ko', 'en', 'zh', 'ja'].includes(booking.language)) {
      setConsultationLocale(booking.language);
    }
    // 0528 C3·H1: customer 자동 매칭 + booking 확정 (handleConfirm 미경유 시에도 보장)
    const resolvedCustomerId = resolveOrCreateCustomer();
    if (booking.status !== 'confirmed' || (resolvedCustomerId && resolvedCustomerId !== booking.customerId)) {
      updateReservation(booking.id, {
        status: 'confirmed',
        ...(resolvedCustomerId && resolvedCustomerId !== booking.customerId
          ? { customerId: resolvedCustomerId }
          : {}),
      });
    }
    hydrateConsultation({
      ...booking.preConsultationData,
      bookingId: booking.id,
      customerName: booking.customerName,
      customerPhone: booking.phone,
      customerId: resolvedCustomerId ?? booking.customerId ?? booking.preConsultationData?.customerId,
      referenceImages: images,
      entryPoint: 'staff',
      currentStep: ConsultationStep.START,
    });
    if (booking.preConsultationData) {
      // 0531: 사전상담 커스텀 파츠는 customPartSelections 로 전달 → settlement baseEstimate 에 포함된다.
      //   (이전엔 initialInTreatmentAddons 로도 넣어 base+inTreatment 이중청구 위험이 있어 제거.
      //    home 진입 경로와 동일하게 base 단일 계상 → 손님 견적=계산대 일치.)
      // 0528 C4: PreConsultationData(removalPreference/lengthPreference)와
      // FieldModeStore.hydrateFromBooking 시그니처(removalType/lengthType) 키 매핑.
      // spread는 손님 입력 정보를 무시하므로 명시적 매핑 필수.
      hydrateFromBooking({
        designCategory: raw?.designCategory ?? null,
        selectedPhotoUrl: raw?.selectedPhotoUrl ?? null,
        selectedPhotoPrice: raw?.selectedPhotoPrice,
        // selectedPhotoId는 preConsultationData에 없음 — 향후 확장 시
        removalType: raw?.removalPreference,
        lengthType: raw?.lengthPreference,
        wrappingPreference: raw?.wrappingPreference ?? null,
        customPartSelections: raw?.customPartSelections,
        addOns: raw?.addOns,
        nailShape: raw?.nailShape ?? null,
        bookingId: booking.id,
        designerId: booking.designerId,
        customerName: booking.customerName,
        customerPhone: booking.phone,
        customerId: resolvedCustomerId ?? booking.customerId ?? booking.preConsultationData?.customerId ?? null,
      });
    }
    // H2: treatment 화면 안내 배너용 sessionStorage 설정
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('field-mode:from-pre-consult', booking.id);
    }
    // 사전상담 완료 → 옵션 선택 건너뛰고 바로 시술 중으로
    router.push('/field-mode/treatment');
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <button onClick={() => router.back()} className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-alt text-text-muted">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-sm font-bold text-text">사전 상담 내용</h1>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">응답 완료</span>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 flex flex-col gap-3">

        {/* 고객 정보 */}
        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-text">{booking.customerName}</h2>
            {booking.language && booking.language !== 'ko' && (
              <span className="text-xs text-text-muted">{booking.language.toUpperCase()}</span>
            )}
          </div>
          <div className="flex flex-col gap-1 text-xs text-text-secondary">
            <span>
              {toKoreanDateString(booking.reservationDate)}
              {booking.reservationTime && booking.reservationTime.includes(':')
                ? ` ${booking.reservationTime}`
                : ' 시간 미정'}
            </span>
            {booking.phone && <a href={`tel:${booking.phone}`} className="text-primary font-medium">{booking.phone}</a>}
          </div>
        </div>

        {/* 사전상담 내용 — PreConsultDetailView SSOT */}
        {raw ? (
          <PreConsultDetailView
            data={raw}
            options={{
              elevated: true,
              customParts: shopSettings?.customParts,
              customCategories: shopSettings?.customCategories,
              categoryLabels: shopSettings?.categoryLabels,
            }}
          />
        ) : images.length === 0 && !booking.requestNote && (
          <div className="text-center py-8">
            <p className="text-sm text-text-muted">사전 상담 내용이 없습니다</p>
          </div>
        )}

        {/* 요청 메모 */}
        {booking.requestNote && (
          <div className="rounded-2xl bg-surface border border-border p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold text-text mb-3">
              <span>📝</span> 요청 메모
            </h3>
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-xs text-text-secondary whitespace-pre-line">{booking.requestNote}</p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 CTA */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 pb-safe flex gap-2">
        {linkedCustomerId && (
          <button
            onClick={() => router.push(`/customers/${linkedCustomerId}`)}
            className="flex-1 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-text-secondary active:scale-[0.98] transition-transform"
          >
            고객 카드 보기
          </button>
        )}
        <button
          onClick={handleConfirm}
          className="flex-1 rounded-xl border border-primary bg-surface py-3 text-sm font-semibold text-primary active:scale-[0.98] transition-transform"
        >
          확정만 하기
        </button>
        <button
          onClick={handleStartConsultation}
          className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white active:scale-[0.98] transition-transform"
        >
          이 정보로 시술 시작 →
        </button>
      </div>

    </div>
  );
}
