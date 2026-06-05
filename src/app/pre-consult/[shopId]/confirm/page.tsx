'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { calculatePreConsultPrice } from '@/lib/pre-consult-price';
import { resolveMenuCategoryLabelBilingual } from '@/lib/labels';
import { dbCompletePreConsultation, dbCompletePreconsultationBooking, dbCreatePreConsultation, fetchShopPublicData, fetchBookingRequestById, dbCreateBookingFromConsultationLink, dbCreateBookingFromShopLink } from '@/lib/db';
import { getNowInKoreaIso } from '@/lib/format';
import { formatPhoneInput, normalizePhone, isValidPhoneForLocale } from '@/lib/phone';
import { consumeClientRateLimit } from '@/lib/client-rate-limit';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PreConsultationData, DesignCategory } from '@/types/pre-consultation';

// ─── Label Maps ──────────────────────────────────────────────────────────────

interface LabelMap {
  category: Record<string, string>;
  nailStatus: Record<string, string>;
  removal: Record<string, string>;
  length: Record<string, string>;
  extensionLength: Record<string, string>;
  shape: Record<string, string>;
  feel: Record<string, string>;
  wrapping: Record<string, string>;
  addOn: Record<string, string>;
  stylePreference: Record<string, string>;
  styleKeyword: Record<string, string>;
}

function buildLabelMap(t: (key: string) => string): LabelMap {
  return {
    category: {
      simple: t('preConsult.catSimple'),
      french: t('preConsult.catFrench'),
      magnet: t('preConsult.catMagnet'),
      art: t('preConsult.catArt'),
    },
    nailStatus: {
      none: t('preConsult.nailNone'),
      existing: t('preConsult.nailExisting'),
    },
    removal: {
      none: '—',
      self_shop: t('preConsult.removalSelf'),
      other_shop: t('preConsult.removalOther'),
    },
    length: {
      keep: t('preConsult.lengthKeep'),
      shorten: t('preConsult.lengthShort'),
      extend: t('preConsult.lengthExtend'),
    },
    extensionLength: {
      natural: t('preConsult.extensionNatural'),
      medium: t('preConsult.extensionMedium'),
      long: t('preConsult.extensionLong'),
    },
    shape: {
      round: t('preConsult.shapeRound'),
      oval: t('preConsult.shapeOval'),
      square: t('preConsult.shapeSquare'),
      squoval: t('preConsult.shapeSquoval'),
      almond: t('preConsult.shapeAlmond'),
      stiletto: t('preConsult.shapeStiletto'),
      coffin: t('preConsult.shapeCoffin'),
    },
    feel: {
      natural: t('preConsult.feelNatural'),
      french: t('preConsult.feelFrench'),
      trendy: t('preConsult.feelTrendy'),
      fancy: t('preConsult.feelFancy'),
    },
    wrapping: {
      yes: t('preConsult.wrappingYes'),
      no: t('preConsult.wrappingNo'),
    },
    addOn: {
      stone: t('preConsult.addOnStone'),
      parts: t('preConsult.addOnParts'),
      glitter: t('preConsult.addOnGlitter'),
      point_art: t('preConsult.addOnPointArt'),
      wrapping: t('preConsult.wrappingLabel'),
    },
    stylePreference: {
      photo_match: t('preConsult.stylePhotoMatch'),
      natural_fit: t('preConsult.styleNaturalFit'),
      clean_subtle: t('preConsult.styleCleanSubtle'),
    },
    styleKeyword: {
      office_friendly: t('preConsult.kwOffice'),
      slim_fingers: t('preConsult.kwSlim'),
      tidy_look: t('preConsult.kwTidy'),
      subtle_point: t('preConsult.kwPoint'),
      more_fancy: t('preConsult.kwFancy'),
    },
  };
}

function useLabelMaps(): { labels: LabelMap; koLabels: LabelMap } {
  const t = useT();
  const tKo = useKo();
  return {
    labels: buildLabelMap(t),
    koLabels: buildLabelMap(tKo),
  };
}

// ─── Summary Row ─────────────────────────────────────────────────────────────

interface SummaryRowProps {
  label: string;
  value: string;
  valueKo?: string;
}

function SummaryRow({ label, value, valueKo }: SummaryRowProps): React.ReactElement {
  return (
    <div className="flex justify-between items-center gap-2 py-1">
      <span className="text-xs text-text-muted flex-shrink-0">{label}</span>
      <span className="text-xs text-text font-medium text-right">
        {value}
        {valueKo && (
          <span className="block text-[10px] text-text-muted opacity-60 font-normal">{valueKo}</span>
        )}
      </span>
    </div>
  );
}

// ─── Price Row ────────────────────────────────────────────────────────────────

interface PriceRowProps {
  label: string;
  amount: number;
  won: string;
  muted?: boolean;
  isBase?: boolean;
}

function PriceRow({ label, amount, won, muted = false, isBase = false }: PriceRowProps): React.ReactElement {
  return (
    <div className="flex justify-between items-center py-1">
      <span className={`text-sm ${muted ? 'text-text-muted' : 'text-text-secondary'}`}>{label}</span>
      <span className={`text-sm font-medium ${muted ? 'text-text-muted' : 'text-text'}`}>
        {isBase ? '' : '+'}{amount.toLocaleString('ko-KR')}{won}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PreConsultConfirmPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ shopId: string }>();
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const { labels, koLabels } = useLabelMaps();

  const store = usePreConsultStore();
  const selectedPhotoPrice = usePreConsultStore((s) => s.selectedPhotoPrice);
  const {
    bodyPart,
    selectedCategory,
    selectedPhotoUrl,
    nailStatus,
    removalPreference,
    lengthPreference,
    extensionLength,
    nailShape,
    wrappingPreference,
    designFeel,
    addOns,
    additionalRequest,
    referenceImageUrls,
    styleKeywords,
    stylePreference,
    customerName,
    customerPhone,
    shopData,
    bookingId,
    consultationLinkId,
    selectedSlotDate,
    selectedSlotTime,
    linkDesignerId,
    isSubmitting,
  } = store;

  // 새로고침 시 shopData가 null(persist 제외)이면 shopId로 재조회
  useEffect(() => {
    if (!shopData && params.shopId) {
      fetchShopPublicData(params.shopId)
        .then((result) => {
          if (result) {
            store.setShopData(result, []);
          }
        })
        .catch(() => {
          // 조회 실패 — shopData 없이 graceful degradation
        })
        .finally(() => {
          setShopDataLoading(false);
        });
    }
  }, [shopData, params.shopId, store]);

  // shopData 로딩 상태: null이면 재조회 중, false면 조회 완료(실패 포함)
  const [shopDataLoading, setShopDataLoading] = useState(!shopData);

  // 새로고침 시 shopData가 null인 경우 로딩 상태 동기화
  useEffect(() => {
    if (shopData) setShopDataLoading(false);
  }, [shopData]);

  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  // 오타 방지용 전화번호 재확인 필드 (본인 인증 대체)
  const [phoneConfirm, setPhoneConfirm] = useState(customerPhone);
  const [submitError, setSubmitError] = useState('');

  // 🔒 재제출 차단 Gate 1: 이미 제출된 세션이면 (sessionStorage isSubmitted) 즉시 complete로 이동
  useEffect(() => {
    const snap = usePreConsultStore.getState();
    if (snap.isSubmitted) {
      router.replace(`/pre-consult/${params.shopId}/complete`);
    }
  }, [params.shopId, router]);

  // 🔒 재제출 차단 Gate 2 + bookingId로 예약 정보 자동 채우기
  // bookingId가 있고 서버에 preConsultationCompletedAt이 이미 있으면 complete로 redirect
  useEffect(() => {
    if (!bookingId) return;
    fetchBookingRequestById(bookingId, params.shopId as string).then((booking) => {
      if (!booking) return;
      // 이미 사전 상담이 완료된 예약이면 재제출 방지
      if (booking.preConsultationCompletedAt) {
        usePreConsultStore.getState().setSubmitted(bookingId);
        router.replace(`/pre-consult/${params.shopId}/complete`);
        return;
      }
      // 정상 케이스: 비어있는 필드만 자동 채우기
      if (!name && booking.customerName) setName(booking.customerName);
      if (!phone && booking.phone) {
        setPhone(booking.phone);
        setPhoneConfirm(booking.phone);
      }
    });
  }, [bookingId, params.shopId, name, phone, router]);

  // ─── Price calculation ─────────────────────────────────────────────────────

  const customPartSelections = usePreConsultStore((s) => s.customPartSelections);

  const priceEstimate =
    selectedCategory && shopData?.categoryPricing && shopData?.surcharges
      ? calculatePreConsultPrice({
          designCategory: selectedCategory,
          removalPreference: removalPreference,
          lengthPreference: lengthPreference,
          wrappingPreference: wrappingPreference,
          addOns: addOns,
          categoryPricing: shopData.categoryPricing,
          surcharges: shopData.surcharges,
          photoBasePrice: selectedPhotoPrice ?? undefined,
          customPartSelections,
          customParts: shopData.customParts,
          customCategories: shopData.customCategories,
        })
      : null;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatPrice = (n: number): string => n.toLocaleString('ko-KR');

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (): Promise<void> => {
    const snap = usePreConsultStore.getState();
    if (snap.isSubmitted || snap.isSubmitting) return;

    if (!name.trim() || !phone.trim()) {
      setSubmitError(t('preConsult.nameLabel') + ' / ' + t('preConsult.phoneLabel'));
      return;
    }
    if (!isValidPhoneForLocale(phone, locale)) {
      setSubmitError(t('preConsult.phoneInvalidFormat'));
      return;
    }
    // 오타 방지: 두 번 입력한 전화번호 비교 (포맷 차이 무시)
    if (normalizePhone(phone) !== normalizePhone(phoneConfirm)) {
      setSubmitError(t('preConsult.phoneMismatch'));
      return;
    }
    if (!shopData) {
      // 0528 H9: shopData null이면 매장 정보 로딩 중 — 명확한 안내
      setSubmitError(t('preConsult.loadingShopData'));
      return;
    }
    // 경로 B(bookingId)는 기존 booking 업데이트 — priceEstimate/selectedCategory 불필요
    if (!bookingId && (!priceEstimate || !selectedCategory)) {
      setSubmitError(t('preConsult.errorMissingInfo'));
      return;
    }

    // 2026-04-20 R11: 클라이언트 rate limit (같은 브라우저에서 과도한 제출 방지)
    const rl = consumeClientRateLimit({
      key: `pre-consult:${params.shopId}`,
      windowMs: 60_000,
      max: 3,
    });
    if (!rl.allowed) {
      const seconds = Math.ceil(rl.retryAfterMs / 1000);
      setSubmitError(`${t('preConsult.rateLimitError')} (${seconds}s)`);
      return;
    }

    store.setCustomerName(name.trim());
    store.setCustomerPhone(phone.trim());
    store.setSubmitting(true);
    setSubmitError('');

    const trimmedRequest = additionalRequest.trim();
    const hasCustomParts = Object.keys(customPartSelections).length > 0;
    const data: PreConsultationData = {
      bodyPart,
      designCategory: selectedCategory ?? undefined,
      selectedPhotoUrl: selectedPhotoUrl ?? undefined,
      // C5: 사진별 가격을 booking에 저장 → 사장님·settlement에서 동일 가격 사용
      selectedPhotoPrice: selectedPhotoPrice != null && selectedPhotoPrice > 0 ? selectedPhotoPrice : undefined,
      selectedPhotoId: usePreConsultStore.getState().selectedPhotoId ?? undefined,
      nailStatus: nailStatus ?? undefined,
      removalPreference: removalPreference ?? undefined,
      lengthPreference: lengthPreference ?? undefined,
      extensionLength: extensionLength ?? undefined,
      nailShape: nailShape ?? undefined,
      wrappingPreference: wrappingPreference ?? undefined,
      designFeel: designFeel ?? undefined,
      stylePreference: stylePreference ?? undefined,
      styleKeyword: styleKeywords,
      addOns: addOns,
      customPartSelections: hasCustomParts ? customPartSelections : undefined,
      referenceImageUrls: referenceImageUrls,
      additionalRequest: trimmedRequest || undefined,
    };

    // ─── 경로 A: 공유 상담 링크 (linkId) — 선택한 slot 으로 booking 직접 생성 ───
    if (consultationLinkId && selectedSlotDate && selectedSlotTime) {
      const preConsultationData = {
        ...data,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        // referenceImages: home/records/DayReservationList/booking-thumbnail 등 소비처가
        // preConsultationData.referenceImages 키를 먼저 읽으므로 호환성 유지 (data.referenceImageUrls와 동일 값)
        referenceImages: referenceImageUrls,
      };
      const result = await dbCreateBookingFromConsultationLink({
        shopId: params.shopId,
        linkId: consultationLinkId,
        designerId: linkDesignerId ?? undefined,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        reservationDate: selectedSlotDate,
        reservationTime: selectedSlotTime,
        language: locale,
        serviceLabel: selectedCategory ?? undefined,
        preConsultationData,
        referenceImageUrls,
        deposit: shopData?.depositAmount ?? 0,
      });
      if (result.success && result.bookingId) {
        store.setSubmitted(result.bookingId);
        router.push(`/pre-consult/${params.shopId}/complete`);
      } else {
        store.setSubmitting(false);
        setSubmitError(
          result.error === 'slot_taken'
            ? t('preConsult.slotTaken')
            : (result.error ?? t('preConsult.errorGeneric')),
        );
      }
      return;
    }

    // ─── 경로 A-2: 샵 고정 상담 링크 (linkId 없음 + slot 선택됨) ───
    if (!consultationLinkId && !bookingId && selectedSlotDate && selectedSlotTime) {
      const preConsultationData = {
        ...data,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        // referenceImages: 소비처 호환 유지 (data.referenceImageUrls와 동일 값)
        referenceImages: referenceImageUrls,
      };
      const result = await dbCreateBookingFromShopLink({
        shopId: params.shopId,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        reservationDate: selectedSlotDate,
        reservationTime: selectedSlotTime,
        language: locale,
        serviceLabel: selectedCategory ?? undefined,
        preConsultationData,
        referenceImageUrls,
        deposit: shopData?.depositAmount ?? 0,
      });
      if (result.success && result.bookingId) {
        store.setSubmitted(result.bookingId);
        router.push(`/pre-consult/${params.shopId}/complete`);
      } else {
        store.setSubmitting(false);
        setSubmitError(
          result.error === 'slot_taken'
            ? t('preConsult.slotTaken')
            : (result.error ?? t('preConsult.errorGeneric')),
        );
      }
      return;
    }

    // ─── 경로 B: 사장님이 발송한 링크 (bookingId) — 기존 booking 업데이트 ───
    if (bookingId) {
      const bookingPayload = {
        ...data,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        referenceImages: referenceImageUrls,
      } as unknown as import('@/types/consultation').ConsultationType;
      const result = await dbCompletePreconsultationBooking(
        bookingId,
        bookingPayload,
        getNowInKoreaIso(),
        undefined,
        params.shopId,
      );
      if (result.success) {
        store.setSubmitted(bookingId);
        router.push(`/pre-consult/${params.shopId}/complete`);
      } else {
        store.setSubmitting(false);
        setSubmitError(result.error ?? t('preConsult.errorGeneric'));
      }
      return;
    }

    // ─── 경로 C: 바로 접근 (bookingId, linkId 모두 없음) — 레거시 ───
    // 여기 도달 시 !bookingId 가드에 의해 priceEstimate/selectedCategory가 non-null 보장됨
    if (!priceEstimate || !selectedCategory) {
      store.setSubmitting(false);
      setSubmitError(t('preConsult.errorMissingInfo'));
      return;
    }
    const createResult = await dbCreatePreConsultation(params.shopId, locale);
    if (!createResult.success || !createResult.id) {
      store.setSubmitting(false);
      setSubmitError(createResult.error ?? t('preConsult.errorGeneric'));
      return;
    }
    const result = await dbCompletePreConsultation(
      createResult.id,
      {
        data,
        confirmed_price: priceEstimate.minTotal,
        estimated_minutes: priceEstimate.estimatedMinutes,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        design_category: selectedCategory,
        reference_image_paths: referenceImageUrls,
      },
      params.shopId,
      locale,
    );
    if (result.success) {
      store.setSubmitted(createResult.id);
      router.push(`/pre-consult/${params.shopId}/complete`);
    } else {
      store.setSubmitting(false);
      setSubmitError(result.error ?? t('preConsult.errorGeneric'));
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 px-4 pt-5 pb-10"
    >
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {/* ── Section 1: Final Summary ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-3"
        >
          <h2 className="text-xl font-bold text-text">
            {t('preConsult.summaryTitle')}
          </h2>
          {locale !== 'ko' && (
            <p className="text-xs text-text-muted -mt-2">
              {tKo('preConsult.summaryTitle')}
            </p>
          )}

          <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-2">
            {/* Category badge + photo thumbnail */}
            <div className="flex items-start gap-3">
              {selectedPhotoUrl && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border flex-shrink-0">
                  <Image
                    src={selectedPhotoUrl}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5 min-w-0">
                {selectedCategory && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold w-fit">
                    {labels.category[selectedCategory] ??
                      resolveMenuCategoryLabelBilingual(selectedCategory, undefined, shopData?.customCategories ?? undefined, locale)}
                    {locale !== 'ko' && (labels.category[selectedCategory] != null) && (
                      <span className="block text-[10px] text-primary/60 font-normal">
                        {koLabels.category[selectedCategory]}
                      </span>
                    )}
                  </span>
                )}
                {referenceImageUrls.length > 0 && (
                  <span className="text-xs text-text-muted">
                    📎 {t('preConsult.uploadTitle').split(' ')[0]} {referenceImageUrls.length}
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border my-1" />

            {/* Summary rows */}
            <SummaryRow
              label={t('preConsult.bodyPartTitle')}
              value={bodyPart === 'foot' ? `🦶 ${t('preConsult.bodyPartFoot')}` : `🖐️ ${t('preConsult.bodyPartHand')}`}
              valueKo={locale !== 'ko' ? (bodyPart === 'foot' ? `🦶 ${tKo('preConsult.bodyPartFoot')}` : `🖐️ ${tKo('preConsult.bodyPartHand')}`) : undefined}
            />
            {nailStatus && (
              <SummaryRow
                label={t('preConsult.currentNailTitle')}
                value={labels.nailStatus[nailStatus] ?? nailStatus}
                valueKo={locale !== 'ko' ? (koLabels.nailStatus[nailStatus] ?? nailStatus) : undefined}
              />
            )}
            {removalPreference && removalPreference !== 'none' && (
              <SummaryRow
                label={t('preConsult.removalTitle')}
                value={labels.removal[removalPreference]}
                valueKo={locale !== 'ko' ? koLabels.removal[removalPreference] : undefined}
              />
            )}
            {lengthPreference && (
              <SummaryRow
                label={t('preConsult.lengthTitle')}
                value={labels.length[lengthPreference] ?? lengthPreference}
                valueKo={locale !== 'ko' ? (koLabels.length[lengthPreference] ?? lengthPreference) : undefined}
              />
            )}
            {extensionLength && lengthPreference === 'extend' && (
              <SummaryRow
                label={t('preConsult.extensionLengthLabel')}
                value={labels.extensionLength[extensionLength] ?? extensionLength}
                valueKo={locale !== 'ko' ? (koLabels.extensionLength[extensionLength] ?? extensionLength) : undefined}
              />
            )}
            {nailShape && (
              <SummaryRow
                label={t('preConsult.shapeTitle')}
                value={labels.shape[nailShape] ?? nailShape}
                valueKo={locale !== 'ko' ? (koLabels.shape[nailShape] ?? nailShape) : undefined}
              />
            )}
            {wrappingPreference && (
              <SummaryRow
                label={t('preConsult.wrappingLabel')}
                value={labels.wrapping[wrappingPreference]}
                valueKo={locale !== 'ko' ? koLabels.wrapping[wrappingPreference] : undefined}
              />
            )}
            {designFeel && (
              <SummaryRow
                label={t('preConsult.feelTitle')}
                value={labels.feel[designFeel] ?? designFeel}
                valueKo={locale !== 'ko' ? (koLabels.feel[designFeel] ?? designFeel) : undefined}
              />
            )}
            {addOns.length > 0 && (
              <SummaryRow
                label={t('preConsult.addOnTitle')}
                value={addOns.map((a) => labels.addOn[a] ?? a).join(', ')}
                valueKo={locale !== 'ko' ? addOns.map((a) => koLabels.addOn[a] ?? a).join(', ') : undefined}
              />
            )}
            {Object.keys(customPartSelections).length > 0 && (
              <SummaryRow
                label={t('preConsult.partsListTitle')}
                value={Object.entries(customPartSelections)
                  .map(([name, count]) => `${name} ×${count}`)
                  .join(', ')}
              />
            )}
            {stylePreference && (
              <SummaryRow
                label={t('preConsult.styleTitle')}
                value={labels.stylePreference[stylePreference] ?? stylePreference}
                valueKo={locale !== 'ko' ? (koLabels.stylePreference[stylePreference] ?? stylePreference) : undefined}
              />
            )}
            {styleKeywords.length > 0 && (
              <SummaryRow
                label={t('preConsult.keywordTitle')}
                value={styleKeywords.map((k) => labels.styleKeyword[k] ?? k).join(', ')}
                valueKo={locale !== 'ko' ? styleKeywords.map((k) => koLabels.styleKeyword[k] ?? k).join(', ') : undefined}
              />
            )}
            {/* 기타 요청사항 — 자유 입력이라 전체 폭으로 표시 (손님이 적은 내용 누락 방지) */}
            {additionalRequest && additionalRequest.trim() && (
              <div className="mt-1 pt-2 border-t border-border/60 flex flex-col gap-1">
                <span className="text-xs text-text-muted">{t('preConsult.additionalRequestTitle')}</span>
                <p className="text-sm text-text whitespace-pre-line break-keep">{additionalRequest.trim()}</p>
              </div>
            )}
          </div>
        </motion.section>

        {/* ── Section 2: Confirmed Price ────────────────────────────────────── */}
        {(priceEstimate || shopDataLoading || (!shopData && !shopDataLoading)) && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="flex flex-col gap-3"
          >
            <h2 className="text-lg font-bold text-text">
              {t('preConsult.priceTitle')}
            </h2>
            {locale !== 'ko' && (
              <p className="text-xs text-text-muted -mt-2">
                {tKo('preConsult.priceTitle')}
              </p>
            )}

            {/* shopData 로딩 중 */}
            {shopDataLoading && !priceEstimate && (
              <div className="rounded-2xl border border-border bg-surface p-5 flex items-center justify-center gap-2">
                <div className="w-4 h-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin flex-shrink-0" />
                <span className="text-sm text-text-muted">{t('common.loading')}</span>
              </div>
            )}

            {/* shopData 로딩 실패 + priceEstimate 없음 */}
            {!shopDataLoading && !priceEstimate && (
              <div className="rounded-2xl border border-border bg-surface p-4 text-center">
                <p className="text-sm text-text-muted">{t('preConsult.loadingShopData')}</p>
              </div>
            )}

            {priceEstimate && (
            <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-1">
              {/* Base price — 기본금액이므로 '+' 없이 표시 */}
              <PriceRow
                label={
                  selectedCategory
                    ? (labels.category[selectedCategory] ??
                       resolveMenuCategoryLabelBilingual(selectedCategory, undefined, shopData?.customCategories ?? undefined, locale))
                    : t('preConsult.defaultCategory')
                }
                amount={priceEstimate.categoryBase}
                won={t('preConsult.won')}
                isBase
              />

              {/* Removal surcharge */}
              {priceEstimate.removalSurcharge > 0 && removalPreference && removalPreference !== 'none' && (
                <PriceRow
                  label={labels.removal[removalPreference]}
                  amount={priceEstimate.removalSurcharge}
                  won={t('preConsult.won')}
                  muted
                />
              )}

              {/* Extension surcharge */}
              {priceEstimate.extensionSurcharge > 0 && (
                <PriceRow
                  label={`${t('preConsult.lengthExtend')} (${t('preConsult.perFinger')})`}
                  amount={priceEstimate.extensionSurcharge}
                  won={t('preConsult.won')}
                  muted
                />
              )}

              {/* Add-on surcharge (랩핑 선호도 addOnSurcharge 에 포함 → 라벨에 함께 표시) */}
              {priceEstimate.addOnSurcharge > 0 && (
                <PriceRow
                  label={[
                    ...addOns
                      .filter((a) => a !== 'wrapping')
                      .map((a) => labels.addOn[a] ?? a),
                    ...(wrappingPreference === 'yes' && !addOns.includes('wrapping')
                      ? [`${labels.addOn.wrapping ?? t('preConsult.wrappingLabel')} (${t('preConsult.perFinger')})`]
                      : []),
                    ...(addOns.includes('wrapping')
                      ? [`${labels.addOn.wrapping ?? t('preConsult.wrappingLabel')} (${t('preConsult.perFinger')})`]
                      : []),
                  ].join(' + ')}
                  amount={priceEstimate.addOnSurcharge}
                  won={t('preConsult.won')}
                  muted
                />
              )}

              {/* Custom parts surcharge */}
              {priceEstimate.customPartsSurcharge > 0 && (
                <PriceRow
                  label={Object.entries(customPartSelections)
                    .map(([name, count]) => `${name} ×${count}`)
                    .join(' + ')}
                  amount={priceEstimate.customPartsSurcharge}
                  won={t('preConsult.won')}
                  muted
                />
              )}

              {/* Total */}
              <div className="h-px bg-border mt-2 mb-1" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-text">{t('preConsult.estimatedPrice')}</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(priceEstimate.minTotal)}{t('preConsult.won')}
                </span>
              </div>

              {/* Estimated time */}
              {priceEstimate.estimatedMinutes > 0 && (
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-text-muted">{t('preConsult.estimatedTime')}</span>
                  <span className="text-sm font-medium text-text-muted">
                    ~{priceEstimate.estimatedMinutes}{t('preConsult.min')}
                  </span>
                </div>
              )}

              {/* Reassurance */}
              <p className="text-xs text-primary font-medium mt-2">{t('preConsult.priceNotice')}</p>
              <p className="text-xs text-text-muted">{t('preConsult.priceDisclaimer')}</p>

              {/* 샵 안내 문구 (온보딩에서 설정) — 사장님이 한국어로 입력한 내용이므로 ko에서만 표시 */}
              {shopData?.customerNotice && locale === 'ko' && (
                <div className="mt-3 pt-3 border-t border-border flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                  <p className="text-xs text-text-secondary leading-relaxed">{shopData.customerNotice}</p>
                </div>
              )}
            </div>
            )}
          </motion.section>
        )}

        {/* ── Section 3: Visit Guide ────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-2"
        >
          <p className="text-sm text-text-secondary font-medium">
            {t('preConsult.visitGuide')}
          </p>
          {locale !== 'ko' && (
            <p className="text-xs text-text-muted mt-0.5">
              {tKo('preConsult.visitGuide')}
            </p>
          )}
        </motion.section>

        {/* ── Section 4: Booking Form ───────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="flex flex-col gap-4"
        >
          <div>
            <h2 className="text-lg font-bold text-text">
              {bookingId && name && phone ? t('preConsult.bookingConfirm') : t('preConsult.bookingTitle')}
            </h2>
            {locale !== 'ko' && (
              <p className="text-xs text-text-muted mt-0.5">
                {bookingId && name && phone ? tKo('preConsult.bookingConfirm') : tKo('preConsult.bookingTitle')}
              </p>
            )}
          </div>

          {selectedSlotDate && selectedSlotTime && (
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
              <p className="text-xs text-text-muted">{t('preConsult.selectedSlotLabel')}</p>
              <p className="mt-0.5 text-sm font-bold text-primary">
                {(() => {
                  const [y, m, d] = selectedSlotDate.split('-').map(Number);
                  const dt = new Date(Date.UTC(y, m - 1, d, 12));
                  const weekdaysKo = ['일', '월', '화', '수', '목', '금', '토'];
                  const weekdaysZh = ['日', '一', '二', '三', '四', '五', '六'];
                  const weekdaysJa = ['日', '月', '火', '水', '木', '金', '土'];
                  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const wdArr = locale === 'ko' ? weekdaysKo : locale === 'zh' ? weekdaysZh : locale === 'ja' ? weekdaysJa : weekdaysEn;
                  const wd = wdArr[dt.getUTCDay()];
                  return locale === 'ko'
                    ? `${m}월 ${d}일 (${wd}) ${selectedSlotTime}`
                    : locale === 'zh'
                    ? `${m}月${d}日 (${wd}) ${selectedSlotTime}`
                    : locale === 'ja'
                    ? `${m}月${d}日 (${wd}) ${selectedSlotTime}`
                    : `${m}/${d} (${wd}) ${selectedSlotTime}`;
                })()}
              </p>
            </div>
          )}

          {bookingId && name && phone ? (
            <div className="rounded-xl bg-surface-alt border border-border p-4 flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">{t('preConsult.nameLabel')}</span>
                <span className="text-sm font-semibold text-text">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">{t('preConsult.phoneLabel')}</span>
                <span className="text-sm font-semibold text-text">{phone}</span>
              </div>
            </div>
          ) : (
            <>
              <Input
                label={t('preConsult.nameLabel')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('customerForm.namePlaceholder')}
                autoComplete="name"
              />

              <Input
                label={t('preConsult.phoneLabel')}
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => {
                  const v = e.target.value;
                  setPhone(locale === 'ko' ? formatPhoneInput(v) : v);
                }}
                placeholder={t('preConsult.phonePlaceholder')}
                autoComplete="tel"
              />

              <Input
                label={t('preConsult.phoneConfirmLabel')}
                type="tel"
                inputMode="tel"
                value={phoneConfirm}
                onChange={(e) => {
                  const v = e.target.value;
                  setPhoneConfirm(locale === 'ko' ? formatPhoneInput(v) : v);
                }}
                placeholder={t('preConsult.phoneConfirmPlaceholder')}
                autoComplete="off"
                hint={t('preConsult.phoneConfirmHint')}
              />
            </>
          )}

          {submitError && (
            <p className="text-xs text-error">{submitError}</p>
          )}

          <Button
            size="lg"
            fullWidth
            loading={isSubmitting}
            onClick={() => { void handleSubmit(); }}
            disabled={!name.trim() || !isValidPhoneForLocale(phone, locale) || !isValidPhoneForLocale(phoneConfirm, locale) || isSubmitting}
          >
            {t('preConsult.bookingBtn')}
            {locale !== 'ko' && (
              <span className="block text-xs opacity-70 font-normal leading-none mt-0.5">
                {tKo('preConsult.bookingBtn')}
              </span>
            )}
          </Button>
        </motion.section>

      </div>
    </motion.div>
  );
}
