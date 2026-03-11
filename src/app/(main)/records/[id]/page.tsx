'use client';

import { use, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, Badge, Button } from '@/components/ui';
import { formatPrice, formatDateDotWithTime } from '@/lib/format';
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
import { DailyChecklist } from '@/components/consultation/DailyChecklist';
import { ChecklistSummaryRow } from '@/components/records/ChecklistSummaryRow';
import type { DailyChecklist as DailyChecklistType } from '@/types/consultation';

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
  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);

  const [checklistData, setChecklistData] = useState<DailyChecklistType | undefined>(record?.checklist);
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
    const now = new Date().toISOString();
    setEditingFinalPrice(false);
    updateRecord(id, { finalPrice: finalPriceValue, finalizedAt: now });
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
    });
    router.push('/consultation/customer');
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
        <div>
          <h1 className="text-lg font-bold text-text">{t('recordDetail.title')}</h1>
          <p className="text-xs text-text-secondary">{formatDateDotWithTime(record.createdAt)}</p>
        </div>
      </div>

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

      {/* 고객 정보 + 체크리스트 서머리 */}
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
        <div className="mt-3 border-t border-border pt-3">
          <p className="mb-1.5 text-xs font-semibold text-text-secondary">시술 체크리스트</p>
          <ChecklistSummaryRow checklist={checklistData} />
        </div>
      </Card>

      {/* 시술 내용 (간소화) */}
      <Card className="mx-4">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">{t('recordDetail.sectionTreatment')}</h2>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">{t('recordDetail.fieldBodyPart')}</span>
            <Badge variant="neutral" size="sm">{BODY_PART_LABEL[c.bodyPart]}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">{t('recordDetail.fieldShape')}</span>
            <span className="text-sm font-medium text-text">
              {t('shape.' + c.nailShape)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">{t('recordDetail.fieldDesign')}</span>
            <Badge variant="primary" size="sm">
              {DESIGN_SCOPE_LABEL[c.designScope] ?? c.designScope}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">{t('recordDetail.fieldExpression')}</span>
            <div className="flex flex-wrap justify-end gap-1">
              {c.expressions.map((exp) => (
                <Badge key={exp} variant="neutral" size="sm">
                  {EXPRESSION_LABEL[exp] ?? exp}
                </Badge>
              ))}
            </div>
          </div>
          {c.hasParts && c.partsSelections.length > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">{t('recordDetail.fieldParts')}</span>
              <div className="flex flex-col items-end gap-1">
                {c.partsSelections.map((p, i) => (
                  <span key={i} className="text-sm font-medium text-text">
                    {t('recordDetail.partsGradeUnit').replace('{grade}', p.grade).replace('{count}', String(p.quantity))}
                  </span>
                ))}
              </div>
            </div>
          )}
          {c.extraColorCount > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-text-secondary">{t('recordDetail.fieldExtraColor')}</span>
              <span className="text-sm font-medium text-text">
                {t('recordDetail.extraColorUnit').replace('{count}', String(c.extraColorCount))}
              </span>
            </div>
          )}
        </div>
        {record.notes && (
          <div className="mt-3 rounded-xl bg-surface-alt p-3">
            <p className="text-xs text-text-secondary">{record.notes}</p>
          </div>
        )}
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

          <div className="mt-2 rounded-xl bg-primary/10 p-3">
            {editingFinalPrice ? (
              <div className="flex flex-col gap-3">
                <span className="text-sm font-bold text-primary">최종 결제 금액 설정</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-primary">₩</span>
                  <input
                    ref={priceInputRef}
                    type="number"
                    value={finalPriceValue || ''}
                    onChange={(e) => setFinalPriceValue(Number(e.target.value))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveFinalPrice(); }}
                    className="flex-1 rounded-xl border-2 border-primary/30 bg-white px-3 py-2 text-right text-lg font-bold text-primary focus:border-primary focus:outline-none"
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

      {/* 체크리스트 */}
      <div className="mx-4">
        <DailyChecklist
          consultationId={id}
          initialData={checklistData}
          onSave={(data) => {
            setChecklistData(data);
            updateRecord(id, { checklist: data });
          }}
          onSaveToPreference={() => {
            router.push(`/customers/${record.customerId}?tab=preference&fromChecklist=true`);
          }}
        />
      </div>

      {/* 액션 바 (fixed bottom) */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background px-4 py-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push(`/customers/${record.customerId}`)}
            className="flex-1 rounded-2xl border border-border bg-surface py-3 text-sm font-semibold text-text-secondary"
          >
            고객 상세
          </button>
          <button
            type="button"
            onClick={handleStartSameConsultation}
            className="flex-[2] rounded-2xl bg-primary py-3 text-sm font-bold text-white"
          >
            같은 시술로 상담 시작
          </button>
        </div>
      </div>
    </div>
  );
}
