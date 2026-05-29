'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useReservationStore } from '@/store/reservation-store';
import { useConsultationStore } from '@/store/consultation-store';
import { useCustomerStore } from '@/store/customer-store';
import { useLocaleStore } from '@/store/locale-store';
import { ConsultationStep } from '@/types/consultation';
import { useFieldModeStore } from '@/store/field-mode-store';
import { toKoreanDateString } from '@/lib/format';
import { calculatePreConsultPrice } from '@/lib/pre-consult-price';
import { formatPrice } from '@/lib/format';
import { useAppStore } from '@/store/app-store';
import type { PreConsultationData, DesignCategory } from '@/types/pre-consultation';

// ───────── PreConsultationData 전용 레이블 ─────────
const CATEGORY_LABEL: Record<string, string> = {
  simple: '심플 (원컬러·그라데이션)',
  french: '프렌치',
  magnet: '자석 (캣아이·자석젤)',
  art: '아트 (풀아트·포인트)',
};
const NAIL_STATUS_LABEL: Record<string, string> = { none: '맨손', existing: '기존 젤 있음' };
const REMOVAL_LABEL: Record<string, string> = { none: '오프 없음', self_shop: '당샵 오프', other_shop: '타샵 오프' };
const LENGTH_PREF_LABEL: Record<string, string> = { keep: '현재 유지', shorten: '짧게', extend: '연장' };
const EXTENSION_LEN_LABEL: Record<string, string> = { natural: '자연스러운 길이', medium: '중간', long: '길게' };
const SHAPE_LABEL: Record<string, string> = {
  round: '라운드', oval: '오벌', square: '스퀘어', squoval: '스퀘오벌',
  almond: '아몬드', stiletto: '스틸레토', coffin: '코핀',
};
const WRAPPING_LABEL: Record<string, string> = { yes: '랩핑 원함', no: '랩핑 불필요' };
const FEEL_LABEL: Record<string, string> = { natural: '내추럴', french: '프렌치', trendy: '트렌디', fancy: '화려한' };
const STYLE_PREF_LABEL: Record<string, string> = { photo_match: '사진과 동일하게', natural_fit: '자연스럽게', clean_subtle: '깔끔하게' };
const STYLE_KW_LABEL: Record<string, string> = {
  office_friendly: '오피스 룩', slim_fingers: '손가락 길어보이게',
  tidy_look: '단정한 느낌', subtle_point: '은은한 포인트', more_fancy: '좀 더 화려하게',
};
const ADDON_LABEL: Record<string, string> = { stone: '스톤', parts: '파츠', glitter: '글리터', point_art: '포인트 아트', wrapping: '랩핑' };
const BODY_PART_LABEL: Record<string, string> = { hand: '손', foot: '발' };

// ───────── 서브 컴포넌트 ─────────
function SectionCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div className="rounded-2xl bg-surface border border-border p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-text mb-3">
        <span>{icon}</span> {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }): React.ReactElement | null {
  if (!value) return null;
  return (
    <div className="flex justify-between text-xs">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}

function TagList({ tags, labelMap }: { tags: string[]; labelMap: Record<string, string> }): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          {labelMap[tag] ?? tag}
        </span>
      ))}
    </div>
  );
}

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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

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

  // 가격 계산
  const categoryPricing = shopSettings?.categoryPricing;
  const surcharges = shopSettings?.surcharges;
  const priceEstimate = raw?.designCategory && categoryPricing && surcharges
    ? calculatePreConsultPrice({
        designCategory: raw.designCategory,
        removalPreference: raw.removalPreference ?? 'none',
        lengthPreference: raw.lengthPreference ?? 'keep',
        addOns: raw.addOns ?? [],
        categoryPricing,
        surcharges,
        // C5: 손님이 선택한 사진별 가격을 사장님 화면에도 동일하게 반영
        photoBasePrice: raw.selectedPhotoPrice,
        customPartSelections: raw.customPartSelections,
        customParts: shopSettings?.customParts,
        customCategories: shopSettings?.customCategories,
      })
    : null;

  const handleConfirm = (): void => {
    const resolvedCustomerId = resolveOrCreateCustomer();
    updateReservation(booking.id, {
      status: 'confirmed',
      ...(resolvedCustomerId && resolvedCustomerId !== booking.customerId
        ? { customerId: resolvedCustomerId }
        : {}),
    });
    router.push(`/records`);
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
      // 사전상담에서 손님이 선택한 커스텀 파츠 → inTreatmentAddons로 변환
      // (settlement에서 inTreatmentTotal로 합산되어 시술 금액에 자동 반영)
      const hydratedAt = new Date().toISOString();
      const initialInTreatmentAddons = raw?.customPartSelections && shopSettings?.customParts
        ? Object.entries(raw.customPartSelections).flatMap(([name, countRaw]) => {
            const part = shopSettings.customParts!.find((p) => p.name === name);
            if (!part) return [];
            const count = typeof countRaw === 'number' ? Math.max(0, Math.floor(countRaw)) : 0;
            return Array.from({ length: count }, (_, i) => ({
              id: `pre-${name}-${i}-${Date.now()}`,
              label: part.name,
              amount: part.pricePerUnit,
              addedAt: hydratedAt,
            }));
          })
        : [];
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
        addOns: raw?.addOns,
        bookingId: booking.id,
        designerId: booking.designerId,
        customerName: booking.customerName,
        customerPhone: booking.phone,
        customerId: resolvedCustomerId ?? booking.customerId ?? booking.preConsultationData?.customerId ?? null,
        initialInTreatmentAddons,
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
            <span>{toKoreanDateString(booking.reservationDate)} {booking.reservationTime}</span>
            {booking.phone && <a href={`tel:${booking.phone}`} className="text-primary font-medium">{booking.phone}</a>}
          </div>
        </div>

        {/* 가격 예상 */}
        {priceEstimate && (
          <div className="rounded-2xl bg-surface border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text">예상 금액</span>
              <span className="text-lg font-black text-primary">
                {formatPrice(priceEstimate.minTotal)}
                {priceEstimate.maxTotal > priceEstimate.minTotal && ` ~ ${formatPrice(priceEstimate.maxTotal)}`}원
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">예상 시간 약 {priceEstimate.estimatedMinutes}분</p>
          </div>
        )}

        {/* 참고 이미지 */}
        {images.length > 0 && (
          <SectionCard icon="📷" title="참고 이미지">
            <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
              {images.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxUrl(url)}
                  className="relative h-28 w-28 flex-shrink-0 rounded-xl overflow-hidden border border-border hover:ring-2 hover:ring-primary/40 transition-all"
                >
                  <Image src={url} alt="" fill className="object-cover" unoptimized />
                  {i === 0 && raw?.selectedPhotoUrl === url && (
                    <span className="absolute bottom-1 left-1 rounded bg-primary/90 px-1.5 py-0.5 text-[8px] font-bold text-white">선택</span>
                  )}
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {/* 디자인 선택 — '시술 종류'로 워딩 통일 */}
        {raw?.designCategory && (
          <SectionCard icon="💅" title="디자인 선택">
            {raw.bodyPart && <InfoRow label="시술 부위" value={BODY_PART_LABEL[raw.bodyPart] ?? raw.bodyPart} />}
            <InfoRow
              label="시술 종류"
              value={
                CATEGORY_LABEL[raw.designCategory] ??
                shopSettings?.customCategories?.find((c) => c.id === raw.designCategory)?.name ??
                raw.designCategory
              }
            />
            {raw.designFeel && <InfoRow label="디자인 느낌" value={FEEL_LABEL[raw.designFeel] ?? raw.designFeel} />}
            {raw.nailShape && <InfoRow label="네일 쉐입" value={SHAPE_LABEL[raw.nailShape] ?? raw.nailShape} />}
            {raw.stylePreference && <InfoRow label="시술 방향" value={STYLE_PREF_LABEL[raw.stylePreference] ?? raw.stylePreference} />}
          </SectionCard>
        )}

        {/* 네일 상태 & 길이 */}
        {(raw?.nailStatus || raw?.removalPreference || raw?.lengthPreference) && (
          <SectionCard icon="✋" title="네일 상태">
            {raw?.nailStatus && <InfoRow label="현재 상태" value={NAIL_STATUS_LABEL[raw.nailStatus]} />}
            {raw?.removalPreference && raw.removalPreference !== 'none' && (
              <InfoRow label="오프" value={REMOVAL_LABEL[raw.removalPreference]} />
            )}
            {raw?.lengthPreference && <InfoRow label="길이 선호" value={LENGTH_PREF_LABEL[raw.lengthPreference]} />}
            {raw?.extensionLength && raw.lengthPreference === 'extend' && (
              <InfoRow label="연장 길이" value={EXTENSION_LEN_LABEL[raw.extensionLength]} />
            )}
            {raw?.wrappingPreference && (
              <InfoRow label="랩핑" value={WRAPPING_LABEL[raw.wrappingPreference]} />
            )}
          </SectionCard>
        )}

        {/* 스타일 키워드 */}
        {raw?.styleKeyword && raw.styleKeyword.length > 0 && (
          <SectionCard icon="✨" title="스타일 키워드">
            <TagList tags={raw.styleKeyword} labelMap={STYLE_KW_LABEL} />
          </SectionCard>
        )}

        {/* 추가 옵션 */}
        {((raw?.addOns && raw.addOns.length > 0) ||
          (raw?.customPartSelections && Object.keys(raw.customPartSelections).length > 0)) && (
          <SectionCard icon="💎" title="추가 옵션">
            {raw?.addOns && raw.addOns.length > 0 && (
              <TagList tags={raw.addOns} labelMap={ADDON_LABEL} />
            )}
            {raw?.customPartSelections && Object.keys(raw.customPartSelections).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {Object.entries(raw.customPartSelections).map(([name, count]) => {
                  const part = shopSettings?.customParts?.find((p) => p.name === name);
                  const partTotal = part ? part.pricePerUnit * count : 0;
                  return (
                    <span
                      key={name}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary px-2.5 py-1 text-xs font-semibold text-primary"
                    >
                      {name} ×{count}
                      {partTotal > 0 && (
                        <span className="text-primary/80 font-normal">+₩{partTotal.toLocaleString()}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* 손님 요청사항 (사전상담 자유 입력) */}
        {raw?.additionalRequest && raw.additionalRequest.trim() && (
          <SectionCard icon="💬" title="손님 요청사항">
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-sm text-text whitespace-pre-line">{raw.additionalRequest}</p>
            </div>
          </SectionCard>
        )}

        {/* 요청 메모 */}
        {booking.requestNote && (
          <SectionCard icon="📝" title="요청 메모">
            <div className="rounded-xl bg-surface-alt p-3">
              <p className="text-xs text-text-secondary whitespace-pre-line">{booking.requestNote}</p>
            </div>
          </SectionCard>
        )}

        {/* 데이터 없음 */}
        {!raw && !booking.requestNote && images.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-text-muted">사전 상담 내용이 없습니다</p>
          </div>
        )}
      </div>

      {/* 하단 CTA */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 pb-safe flex gap-2">
        {booking.customerId && (
          <button
            onClick={() => router.push(`/customers/${booking.customerId}`)}
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

      {/* 라이트박스 */}
      <AnimatePresence>
        {lightboxUrl && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80" onClick={() => setLightboxUrl(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} className="fixed inset-4 z-50 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
              <Image src={lightboxUrl} alt="" width={600} height={600} className="max-h-[80dvh] w-auto rounded-2xl object-contain" unoptimized />
              <button onClick={() => setLightboxUrl(null)} className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
