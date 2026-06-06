'use client';

import { use, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Card, Badge, Button, Modal } from '@/components/ui';
import { formatPrice, formatDateDotWithTime, getNowInKoreaIso, getTodayInKorea } from '@/lib/format';
import { ShareCardGeneratorModal } from '@/components/share-card/ShareCardGeneratorModal';
import { BODY_PART_LABEL, DESIGN_SCOPE_LABEL, EXPRESSION_LABEL, getDesignerName } from '@/lib/labels';
import { useShallow } from 'zustand/react/shallow';
import { useRecordsStore } from '@/store/records-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useCustomerStore } from '@/store/customer-store';
import { useConsultationStore } from '@/store/consultation-store';
import { calculatePrice, buildServicePricingFromShopSettings } from '@/lib/price-calculator';
import { resolveCategoryLabelKo, resolveCategoryPricing, resolveRecordCategoryLabelKo } from '@/lib/category-resolver';
import { useReservationStore } from '@/store/reservation-store';
import { useT } from '@/lib/i18n';
import { getSafetyTagMeta } from '@/lib/tag-safety';
import { SafetyTag } from '@/components/ui/SafetyTag';
import type { DailyChecklist as DailyChecklistType } from '@/types/consultation';
import { ConsultationStep } from '@/types/consultation';
import { useLocaleStore } from '@/store/locale-store';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { fetchBookingRequestById } from '@/lib/db';
import type { BookingRequest } from '@/types/consultation';
import type { PreConsultationData } from '@/types/pre-consultation';
import { PreConsultDetailView } from '@/components/consultation/PreConsultDetailView';

interface Props {
  params: Promise<{ id: string }>;
}

export default function RecordDetailPage({ params }: Props): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useT();

  const record = useRecordsStore(useShallow((s) => s.records.find((r) => r.id === id)));
  const updateRecord = useRecordsStore((s) => s.updateRecord);
  const removeRecord = useRecordsStore((s) => s.removeRecord);
  const updateReservation = useReservationStore((s) => s.updateReservation);
  const portfolioPhotos = usePortfolioStore(useShallow((s) => s.photos.filter((p) => p.recordId === id)));
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);
  const recordTreatmentCompletion = useCustomerStore((s) => s.recordTreatmentCompletion);
  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);
  const shopSettings = useAppStore((s) => s.shopSettings);
  const currentShopId = useAuthStore((s) => s.currentShopId);

  const finalizingRef = useRef(false);
  const [checklistData, setChecklistData] = useState<DailyChecklistType | undefined>(record?.checklist);
  const [showShareCard, setShowShareCard] = useState(false);
  const [editingFinalPrice, setEditingFinalPrice] = useState(false);
  const [finalPriceValue, setFinalPriceValue] = useState(record?.finalPrice ?? 0);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [preConsultBooking, setPreConsultBooking] = useState<BookingRequest | null>(null);

  // 사전상담 데이터 로드
  useEffect(() => {
    const bookingId = record?.consultation?.bookingId;
    if (!bookingId || !currentShopId) return;
    fetchBookingRequestById(bookingId, currentShopId)
      .then((booking) => {
        setPreConsultBooking(booking);
      })
      .catch(() => {
        // 조용히 실패 — 사전상담 섹션 생략
      });
  }, [record?.consultation?.bookingId, currentShopId]);

  // ?share=1 — 결제 완료 상태에서만 공유카드 자동 오픈
  useEffect(() => {
    if (searchParams.get('share') === '1' && record?.finalizedAt) {
      setShowShareCard(true);
    }
  }, [searchParams, record?.finalizedAt]);

  if (!record) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <p className="text-lg font-semibold text-text">{t('recordDetail.notFound')}</p>
        <Button className="mt-4" onClick={() => router.back()}>
          {t('recordDetail.backButton')}
        </Button>
      </div>
    );
  }

  const c = record.consultation;
  // 0529: 샵 설정 가격으로 계산 (이전엔 인자 누락으로 기본값 사용 → 가격 상세 부정확)
  const breakdown = calculatePrice(c, buildServicePricingFromShopSettings(shopSettings));

  // 0531: 현장모드(quick-sale) 기록은 카테고리 모델로 청구됐으므로, 가산모델(calculatePrice)로
  // 재계산한 breakdown 을 쓰면 합계가 실제 청구액과 불일치한다(예: 합계 92,000 vs 최종 47,000).
  // → 저장된 pricing_adjustments.basePrice(시술 총액)를 SSOT 로 사용.
  const isFieldModeRecord = record.isQuickSale === true || id.startsWith('fm-') || id.startsWith('qs-');
  const storedGross =
    record.pricingAdjustments?.basePrice ??
    (record.finalPrice +
      (record.deposit ?? 0) +
      (record.membershipApplied ?? 0) +
      (record.pricingAdjustments?.discountAmount ?? 0));
  const useStoredPricing = isFieldModeRecord && storedGross > 0;
  const displaySubtotal = useStoredPricing ? storedGross : breakdown.subtotal;

  // 0531: 시술 금액 항목별 내역
  //  1) 저장된 lineItems(신규 정산 레코드) → 그대로 표시 (합계 = storedGross)
  //  2) 없으면(구 레코드) 카테고리 base + 나머지 옵션 2행 근사 (합계 = storedGross 보장)
  //  3) quick-sale 아닌 상담 레코드 → calculatePrice breakdown.items
  const storedLineItems = record.pricingAdjustments?.lineItems;
  const approxLineItems: { label: string; amount: number }[] = (() => {
    if (!useStoredPricing || (storedLineItems && storedLineItems.length > 0)) return [];
    const catLabel = c.designCategory ? resolveCategoryLabelKo(c.designCategory, shopSettings) : '시술 금액';
    const catBase = c.designCategory ? (resolveCategoryPricing(c.designCategory, shopSettings)?.price ?? 0) : 0;
    if (catBase > 0 && catBase < storedGross) {
      return [
        { label: catLabel, amount: catBase },
        { label: '오프·옵션·파츠 등', amount: storedGross - catBase },
      ];
    }
    // 0531 — 카테고리가만으로 총액과 같거나(추가옵션 없음) 할인으로 총액이 더 낮은 경우:
    //   빈 배열로 두면 내역이 통째로 사라지므로 단일 행으로 표시(음수 방지)
    if (catBase > 0) {
      return [{ label: catLabel, amount: storedGross }];
    }
    return [];
  })();

  const pinnedTags = getPinnedTags(record.customerId);
  const safetyTags = pinnedTags.filter((tag) => {
    const level = getSafetyTagMeta(tag).level;
    return level === 'high' || level === 'medium';
  });

  const referenceImages = c.referenceImages ?? [];
  const hasImages = referenceImages.length > 0 || portfolioPhotos.length > 0;

  const handleSaveFinalPrice = (): void => {
    setEditingFinalPrice(false);
    updateRecord(id, { finalPrice: finalPriceValue });
  };

  const handleFinalize = (): void => {
    if (record.finalizedAt) return;
    if (finalizingRef.current) return;
    finalizingRef.current = true;
    const now = getNowInKoreaIso();
    updateRecord(id, { finalizedAt: now });
    // 0531 — 연결된 예약의 status도 completed로 갱신(DB 정합성). 타임그리드 인라인 결제완료와 동일.
    const bookingId = record.consultation?.bookingId;
    if (bookingId) {
      updateReservation(bookingId, { status: 'completed' });
    }
    if (record.customerId) {
      // 0529: totalSpend는 회원권 차감분 + 예약금 차감분 포함 실제 시술 금액 기준 (field-mode·payment와 일관)
      const totalServicePrice = record.finalPrice + (record.membershipApplied ?? 0) + (record.deposit ?? 0);
      recordTreatmentCompletion(record.customerId, totalServicePrice, {
        recordId: id,
        date: getTodayInKorea(),
        bodyPart: record.consultation?.bodyPart ?? 'hand',
        // 0531 — designScope 손실 매핑 방지: designCategory 우선 라벨 사용
        designScope: record.consultation ? resolveRecordCategoryLabelKo(record.consultation, shopSettings) : '기타',
        price: totalServicePrice,
        imageUrls: [],
      });
    }
  };

  const handleDelete = (): void => {
    // removeRecord가 고객 통계(방문/매출/이력)와 lastVisitDate 롤백까지 처리
    removeRecord(id);
    router.replace('/records');
  };

  const handleStartEditing = (): void => {
    setEditingFinalPrice(true);
    setTimeout(() => priceInputRef.current?.focus(), 0);
  };

  const handleStartSameConsultation = (): void => {
    hydrateConsultation({
      ...c,
      customerId: record.customerId,
      customerName: c.customerName,
      customerPhone: c.customerPhone,
      bookingId: undefined,
      currentStep: ConsultationStep.START,
    });
    if (record.language && record.language !== 'ko') {
      setConsultationLocale(record.language);
    }
    router.push('/field-mode');
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/records');
            }
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-alt text-text-secondary"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex flex-1 items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-text">{t('recordDetail.title')}</h1>
            <p className="text-xs text-text-secondary">{formatDateDotWithTime(record.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* 고객 이름 — 클릭 시 고객카드 이동 */}
      <button
        type="button"
        onClick={() => router.push(`/customers/${record.customerId}`)}
        className="mx-4 flex items-center gap-2 rounded-xl bg-surface-alt px-4 py-3 active:bg-border transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-medium text-primary">
          {(c.customerName ?? '?').charAt(0)}
        </div>
        <span className="text-sm font-semibold text-text">
          {c.customerName ?? '고객'}
          {c.customerPhone && <span className="text-text-muted font-normal"> ({c.customerPhone.slice(-4)})</span>}
        </span>
        <svg className="ml-auto h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 비주얼 서머리: 참고 이미지 + 시술 사진 */}
      {hasImages && (
        <div className="flex flex-col gap-3 px-4">
          {referenceImages.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-text-secondary">요청 참고 이미지</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {referenceImages.map((src, i) => (
                  <div
                    key={i}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-border"
                  >
                    <Image
                      src={src}
                      alt={`참고 이미지 ${i + 1}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {portfolioPhotos.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-text-secondary">시술 사진</span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {portfolioPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-border"
                  >
                    <Image
                      src={photo.imageDataUrl}
                      alt="시술 사진"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 주의사항 카드 */}
      {safetyTags.length > 0 && (
        <div className="mx-4 rounded-2xl border border-red-200 bg-red-50/50 p-3">
          <p className="mb-2 text-xs font-semibold text-red-700">⚠️ 주의사항</p>
          <div className="flex flex-wrap gap-1.5">
            {safetyTags.map((tag) => (
              <SafetyTag key={tag.id} tag={tag} size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* 특이사항 */}
      {(checklistData?.memo || record.notes) && (
        <div className="mx-4 rounded-xl bg-amber-50 border border-amber-200 p-3">
          <p className="mb-1.5 text-xs font-semibold text-amber-800">📝 특이사항</p>
          {checklistData?.memo && (
            <p className="text-sm text-amber-900">{checklistData.memo}</p>
          )}
          {checklistData?.memo && record.notes && <div className="my-1" />}
          {record.notes && (
            <p className="text-sm text-amber-900">{record.notes}</p>
          )}
        </div>
      )}

      {/* 사전 상담 응답 */}
      {preConsultBooking?.preConsultationData && (
        <Card className="mx-4">
          <h2 className="mb-3 text-sm font-semibold text-text-secondary">사전 상담 응답</h2>
          <PreConsultDetailView
            data={preConsultBooking.preConsultationData as unknown as PreConsultationData}
            options={{
              customParts: shopSettings?.customParts,
              customCategories: shopSettings?.customCategories,
              categoryLabels: shopSettings?.categoryLabels,
              customerLanguage: preConsultBooking.language,
            }}
          />
        </Card>
      )}

      {/* 시술 리포트 */}
      <Card className="mx-4">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">시술 리포트</h2>
        {/* 시술 종류 태그 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="neutral" size="sm">{BODY_PART_LABEL[c.bodyPart]}</Badge>
          <Badge variant="primary" size="sm">
            {/* 0531: 시술 종류는 designCategory 우선(프렌치 등). designScope는 french→solid_point 처럼
                손실 매핑이라 단독 사용 시 "단색+포인트"로 잘못 표시됨 — 기록 목록(ConsultationListItem)과 통일. */}
            {c.designCategory
              ? resolveCategoryLabelKo(c.designCategory, shopSettings)
              : (DESIGN_SCOPE_LABEL[c.designScope] ?? c.designScope)}
          </Badge>
          {c.expressions.map((exp) => (
            <Badge key={exp} variant="neutral" size="sm">
              {EXPRESSION_LABEL[exp] ?? exp}
            </Badge>
          ))}
        </div>
        {/* 네일 쉐잎 · 길이 · 두께감 · 큐티클 민감도 — 한줄 */}
        {checklistData && (checklistData.shape || checklistData.length || checklistData.thickness || checklistData.cuticleSensitivity) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-sm">
            {checklistData.shape && (
              <span className="text-text-secondary">쉐잎 <span className="font-semibold text-text">{t('checklist.shape_' + checklistData.shape)}</span></span>
            )}
            {checklistData.length && (
              <span className="text-text-secondary">길이 <span className="font-semibold text-text">{t('checklist.length_' + checklistData.length)}</span></span>
            )}
            {checklistData.thickness && (
              <span className="text-text-secondary">두께감 <span className="font-semibold text-text">{t('checklist.thickness_' + checklistData.thickness)}</span></span>
            )}
            {checklistData.cuticleSensitivity && (
              <span className="text-text-secondary">민감도 <span className="font-semibold text-text">{t('checklist.cuticle_' + checklistData.cuticleSensitivity)}</span></span>
            )}
          </div>
        )}
        {/* 파츠 — 커스텀 파츠는 종류명, 레거시(customPartId 없음)는 일반 '파츠'로 표시.
            0601 QA: 등급(A등급) 시스템은 폐기됨 → customPartId를 customParts에서 이름으로 해석. */}
        {c.hasParts && c.partsSelections.length > 0 && (
          <p className="text-sm text-text-secondary mb-1.5">
            <span className="font-medium text-text-secondary">파츠: </span>
            {c.partsSelections.map((p, i) => {
              const partName = p.customPartId
                ? shopSettings.customParts?.find((cp) => cp.id === p.customPartId)?.name
                : undefined;
              return (
                <span key={i} className="text-sm font-medium text-text">
                  {i > 0 && ', '}
                  {partName ?? '파츠'} × {p.quantity}개
                </span>
              );
            })}
          </p>
        )}
        {/* 추가컬러 */}
        {c.extraColorCount > 0 && (
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-secondary">추가컬러: </span>
            <span className="font-medium text-text">
              {t('recordDetail.extraColorUnit').replace('{count}', String(c.extraColorCount))}
            </span>
          </p>
        )}
      </Card>

      {/* 고객 정보 */}
      <Card className="mx-4">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">{t('recordDetail.sectionCustomer')}</h2>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">{t('recordDetail.fieldName')}</span>
            <span className="text-sm font-medium text-text">{c.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">{t('recordDetail.fieldPhone')}</span>
            <span className="text-sm font-medium text-text">{c.customerPhone}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">{t('recordDetail.fieldDesigner')}</span>
            <span className="text-sm font-medium text-text">
              {getDesignerName(record.designerId)}
            </span>
          </div>
        </div>
      </Card>

      {/* 가격 상세 */}
      <Card className="mx-4">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">{t('recordDetail.sectionPrice')}</h2>
        <div className="flex flex-col gap-2">
          {record.finalizedAt ? (
            <div className="mb-1 inline-flex w-fit items-center rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
              {`✓ 가격 확정됨 · ${formatDateDotWithTime(record.finalizedAt)}`}
            </div>
          ) : (
            <div className="mb-1 inline-flex w-fit items-center rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
              가격 미확정
            </div>
          )}

          {storedLineItems && storedLineItems.length > 0 ? (
            // 신규 정산 레코드: 저장된 항목별 내역 (합계 = storedGross)
            storedLineItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-text-secondary">{item.label}</span>
                <span className="text-text">
                  {i === 0 ? formatPrice(item.amount) : `+${formatPrice(item.amount)}`}
                </span>
              </div>
            ))
          ) : approxLineItems.length > 0 ? (
            // 구 레코드: 카테고리 base + 나머지 근사 2행
            approxLineItems.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-text-secondary">{item.label}</span>
                <span className="text-text">
                  {i === 0 ? formatPrice(item.amount) : `+${formatPrice(item.amount)}`}
                </span>
              </div>
            ))
          ) : useStoredPricing ? (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">시술 금액</span>
              <span className="text-text">{formatPrice(storedGross)}</span>
            </div>
          ) : (
            breakdown.items
              .filter((item) => !item.isDiscount)
              .map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className="text-text">
                    {i === 0 ? formatPrice(item.amount) : `+${formatPrice(item.amount)}`}
                  </span>
                </div>
              ))
          )}

          <div className="my-2 border-t border-border" />

          <div className="flex justify-between text-sm">
            <span className="font-medium text-text">{t('recordDetail.subtotal')}</span>
            <span className="font-semibold text-text">{formatPrice(displaySubtotal)}</span>
          </div>

          {breakdown.items
            .filter((item) => item.isDiscount)
            .map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-text-secondary">{item.label}</span>
                <span className="text-error">-{formatPrice(item.amount)}</span>
              </div>
            ))}

          {/* SALES-4: field-mode에서 적용한 할인·예약금·회원권 차감 반영 */}
          {(record.pricingAdjustments?.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">할인</span>
              <span className="text-error">-{formatPrice(record.pricingAdjustments!.discountAmount!)}</span>
            </div>
          )}
          {(record.deposit ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">예약금 차감</span>
              <span className="text-error">-{formatPrice(record.deposit!)}</span>
            </div>
          )}
          {(record.membershipApplied ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">회원권 차감</span>
              <span className="text-error">-{formatPrice(record.membershipApplied!)}</span>
            </div>
          )}
          {/* 0531: 현장모드 기록은 deposit/할인이 별도 컬럼 없이 finalPrice 에만 반영돼,
              합계−명시차감 과 최종금액 사이 설명 안 된 차액이 남을 수 있다. 그 차액을 '할인·예약금 차감'으로 표시해
              합계 − 차감 = 최종 이 시각적으로 성립하게 한다. */}
          {useStoredPricing && (() => {
            const shown =
              (record.pricingAdjustments?.discountAmount ?? 0) +
              (record.deposit ?? 0) +
              (record.membershipApplied ?? 0);
            const gap = displaySubtotal - record.finalPrice - shown;
            return gap > 0 ? (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">할인·예약금 차감</span>
                <span className="text-error">-{formatPrice(gap)}</span>
              </div>
            ) : null;
          })()}

          {/* 결제수단 표시 */}
          {record.paymentMethod && (
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary">결제수단</span>
              <span className="text-text font-medium">
                {record.paymentMethod === 'cash' && '현금'}
                {record.paymentMethod === 'card' && '카드'}
                {record.paymentMethod === 'membership' && '회원권'}
                {record.secondaryPaymentMethod && record.secondaryAmount != null && record.secondaryAmount > 0 && (
                  <span className="ml-1 text-text-secondary">
                    + {record.secondaryPaymentMethod === 'cash' ? '현금' : '카드'} {formatPrice(record.secondaryAmount)}
                  </span>
                )}
              </span>
            </div>
          )}

          {!record.finalizedAt && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => {
                  if (record.paymentMethod) {
                    handleFinalize(); // finalizedAt + stats
                  } else {
                    updateRecord(id, { finalizedAt: getNowInKoreaIso() }); // finalizedAt만 (stats는 payment에서)
                    router.push(`/payment?recordId=${id}`);
                  }
                }}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary-dark active:scale-[0.98] transition-all"
              >
                {record.paymentMethod ? '결제 완료' : '결제하기'}
              </button>
            </div>
          )}
          {record.finalizedAt && (
            <div className="mt-2 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 py-2.5">
              <span className="text-sm font-semibold text-emerald-700">✓ 결제 완료됨</span>
            </div>
          )}

          <div className="mt-2 rounded-xl bg-primary/10 p-3">
            {editingFinalPrice ? (
              <div className="flex flex-col gap-3">
                <span className="text-sm font-bold text-primary">최종 결제 금액 설정</span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-semibold text-primary shrink-0">₩</span>
                  <input
                    ref={priceInputRef}
                    type="number"
                    value={finalPriceValue || ''}
                    onChange={(e) => setFinalPriceValue(Number(e.target.value))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFinalPrice(); }}
                    className="min-w-0 flex-1 rounded-xl border-2 border-primary/30 bg-white px-3 py-2 text-right text-base font-bold text-primary focus:border-primary focus:outline-none"
                    min={0}
                    placeholder={String(breakdown.finalPrice)}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFinalPrice(false);
                      setFinalPriceValue(record.finalPrice);
                    }}
                    className="flex-1 rounded-xl border border-border bg-white py-2 text-sm font-semibold text-text-secondary"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveFinalPrice}
                    className="flex-1 rounded-xl bg-primary py-2 text-sm font-bold text-white"
                  >
                    저장
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="font-bold text-primary">{t('recordDetail.finalPayment')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary">{formatPrice(record.finalPrice)}</span>
                  <button
                    type="button"
                    onClick={handleStartEditing}
                    className="rounded-lg bg-primary/20 px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/30 transition-colors"
                  >
                    수정
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 0529: 기록 삭제 — removeRecord가 고객 통계(방문/매출/이력) 롤백 포함 */}
      <button
        type="button"
        onClick={() => setShowDeleteConfirm(true)}
        className="mx-4 rounded-xl border border-error/30 bg-error/5 py-2.5 text-sm font-semibold text-error hover:bg-error/10 transition-colors"
      >
        이 기록 삭제
      </button>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="기록을 삭제할까요?">
        <div className="flex flex-col gap-4 p-5">
          <p className="text-sm leading-relaxed text-text-secondary">
            이 상담·결제 기록을 삭제하면 고객의 방문 횟수와 누적 매출에서도 함께 제외돼요. 삭제 후에는 되돌릴 수 없어요.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 rounded-xl border border-border bg-white py-2.5 text-sm font-semibold text-text-secondary"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex-1 rounded-xl bg-error py-2.5 text-sm font-bold text-white"
            >
              삭제
            </button>
          </div>
        </div>
      </Modal>

      {/* 액션 바 (fixed bottom) */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-3 safe-bottom">
        {record.finalizedAt ? (
          <button
            type="button"
            onClick={() => setShowShareCard(true)}
            className="mb-2 w-full rounded-2xl border border-primary bg-primary/5 py-2.5 text-sm font-semibold text-primary"
          >
            공유카드 만들기
          </button>
        ) : (
          <div className="mb-2 w-full rounded-2xl border border-border bg-surface-alt py-2.5 text-center text-sm text-text-muted">
            결제 완료 후 공유카드를 만들 수 있어요
          </div>
        )}
      </div>

      {record && (
        <ShareCardGeneratorModal
          isOpen={showShareCard}
          onClose={() => setShowShareCard(false)}
          record={{
            id: record.id,
            shopId: record.shopId,
            consultation: record.consultation,
            shareCardId: record.shareCardId,
            createdAt: record.createdAt,
            estimatedMinutes: record.estimatedMinutes,
          }}
          portfolioPhotos={portfolioPhotos.map(p => ({
            id: p.id,
            imageDataUrl: p.imageDataUrl,
            imagePath: p.imagePath,
          }))}
          shopName={shopSettings.shopName}
          categoryLabel={resolveRecordCategoryLabelKo(record.consultation, shopSettings)}
          onShareCardCreated={(newId) => updateRecord(id, { shareCardId: newId })}
        />
      )}
    </div>
  );
}
