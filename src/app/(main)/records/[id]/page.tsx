'use client';

import { use, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, Badge, Button } from '@/components/ui';
import { formatPrice, formatDateDotWithTime, getNowInKoreaIso, getTodayInKorea } from '@/lib/format';
import { ShareCardGeneratorModal } from '@/components/share-card/ShareCardGeneratorModal';
import { BODY_PART_LABEL, DESIGN_SCOPE_LABEL, EXPRESSION_LABEL, getDesignerName } from '@/lib/labels';
import { useShallow } from 'zustand/react/shallow';
import { useRecordsStore } from '@/store/records-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useCustomerStore } from '@/store/customer-store';
import { useConsultationStore } from '@/store/consultation-store';
import { calculatePrice } from '@/lib/price-calculator';
import { useT } from '@/lib/i18n';
import { getSafetyTagMeta } from '@/lib/tag-safety';
import { SafetyTag } from '@/components/ui/SafetyTag';
import type { DailyChecklist as DailyChecklistType } from '@/types/consultation';
import { ConsultationStep } from '@/types/consultation';
import { useLocaleStore } from '@/store/locale-store';
import { useAppStore } from '@/store/app-store';

interface Props {
  params: Promise<{ id: string }>;
}

export default function RecordDetailPage({ params }: Props): React.ReactElement {
  const { id } = use(params);
  const router = useRouter();
  const t = useT();

  const record = useRecordsStore(useShallow((s) => s.records.find((r) => r.id === id)));
  const updateRecord = useRecordsStore((s) => s.updateRecord);
  const portfolioPhotos = usePortfolioStore(useShallow((s) => s.photos.filter((p) => p.recordId === id)));
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const getCustomerById = useCustomerStore((s) => s.getById);
  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);
  const shopSettings = useAppStore((s) => s.shopSettings);

  const [checklistData, setChecklistData] = useState<DailyChecklistType | undefined>(record?.checklist);
  const [showShareCard, setShowShareCard] = useState(false);
  const [editingFinalPrice, setEditingFinalPrice] = useState(false);
  const [finalPriceValue, setFinalPriceValue] = useState(record?.finalPrice ?? 0);
  const priceInputRef = useRef<HTMLInputElement>(null);

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
  const breakdown = calculatePrice(c);

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
    const now = getNowInKoreaIso();
    updateRecord(id, { finalizedAt: now });
    const customer = getCustomerById(record.customerId);
    if (customer) {
      const newVisitCount = customer.visitCount + 1;
      const newTotalSpend = customer.totalSpend + record.finalPrice;
      updateCustomer(record.customerId, {
        visitCount: newVisitCount,
        totalSpend: newTotalSpend,
        averageSpend: Math.round(newTotalSpend / newVisitCount),
        lastVisitDate: getTodayInKorea(),
      });
    }
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
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt text-text-secondary"
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

      {/* 시술 리포트 */}
      <Card className="mx-4">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">시술 리포트</h2>
        {/* 시술 종류 태그 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge variant="neutral" size="sm">{BODY_PART_LABEL[c.bodyPart]}</Badge>
          <Badge variant="primary" size="sm">
            {DESIGN_SCOPE_LABEL[c.designScope] ?? c.designScope}
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
        {/* 파츠 */}
        {c.hasParts && c.partsSelections.length > 0 && (
          <p className="text-sm text-text-secondary mb-1.5">
            <span className="font-medium text-text-secondary">파츠: </span>
            {c.partsSelections.map((p, i) => (
              <span key={i} className="text-sm font-medium text-text">
                {i > 0 && ', '}
                {t('recordDetail.partsGradeUnit').replace('{grade}', p.grade).replace('{count}', String(p.quantity))}
              </span>
            ))}
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

          {breakdown.items
            .filter((item) => !item.isDiscount)
            .map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-text-secondary">{item.label}</span>
                <span className="text-text">
                  {i === 0 ? formatPrice(item.amount) : `+${formatPrice(item.amount)}`}
                </span>
              </div>
            ))}

          <div className="my-2 border-t border-border" />

          <div className="flex justify-between text-sm">
            <span className="font-medium text-text">{t('recordDetail.subtotal')}</span>
            <span className="font-semibold text-text">{formatPrice(breakdown.subtotal)}</span>
          </div>

          {breakdown.items
            .filter((item) => item.isDiscount)
            .map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-text-secondary">{item.label}</span>
                <span className="text-error">-{formatPrice(item.amount)}</span>
              </div>
            ))}

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

      {/* 액션 바 (fixed bottom) */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-3">
        <button
          type="button"
          onClick={() => setShowShareCard(true)}
          className="mb-2 w-full rounded-2xl border border-primary bg-primary/5 py-2.5 text-sm font-semibold text-primary"
        >
          공유카드 만들기
        </button>
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
          }}
          portfolioPhotos={portfolioPhotos.map(p => ({
            id: p.id,
            imageDataUrl: p.imageDataUrl,
            imagePath: p.imagePath,
          }))}
          shopName={shopSettings.shopName}
        />
      )}
    </div>
  );
}
