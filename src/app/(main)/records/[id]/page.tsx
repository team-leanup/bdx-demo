'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Badge, Button } from '@/components/ui';
import { formatPrice, formatDateDotWithTime } from '@/lib/format';
import { BODY_PART_LABEL, DESIGN_SCOPE_LABEL, EXPRESSION_LABEL, OFF_TYPE_LABEL, getDesignerName } from '@/lib/labels';
import { getMockConsultationById } from '@/data/mock-consultations';
import { calculatePrice } from '@/lib/price-calculator';
import { useT } from '@/lib/i18n';
import { DailyChecklist } from '@/components/consultation/DailyChecklist';
import type { DailyChecklist as DailyChecklistType, ConsultationRecord } from '@/types/consultation';

interface Props {
  params: Promise<{ id: string }>;
}

export default function RecordDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const t = useT();
  const mockRecord = getMockConsultationById(id);
  const [savedRecord, setSavedRecord] = useState<ConsultationRecord | undefined>(undefined);
  const [loaded, setLoaded] = useState(!!mockRecord);

  useEffect(() => {
    if (!mockRecord) {
      const saved = sessionStorage.getItem(`bdx-saved-record-${id}`);
      if (saved) {
        try { setSavedRecord(JSON.parse(saved)); } catch { /* ignore */ }
      }
      setLoaded(true);
    }
  }, [id, mockRecord]);

  const record = mockRecord ?? savedRecord;
  const [checklistData, setChecklistData] = useState<DailyChecklistType | undefined>(record?.checklist);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

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

  return (
    <div className="flex flex-col gap-4 pb-6">
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

      {/* 시술 내용 */}
      <Card className="mx-4">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">{t('recordDetail.sectionTreatment')}</h2>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">{t('recordDetail.fieldBodyPart')}</span>
            <Badge variant="neutral" size="sm">{BODY_PART_LABEL[c.bodyPart]}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">{t('recordDetail.fieldOff')}</span>
            <span className="text-sm font-medium text-text">{OFF_TYPE_LABEL[c.offType]}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-text-secondary">{t('recordDetail.fieldExtension')}</span>
            <span className="text-sm font-medium text-text">
              {c.extensionType === 'none' ? t('recordDetail.extensionNone') : c.extensionType === 'repair' ? t('recordDetail.extensionRepair') : t('recordDetail.extensionExtension')}
              {c.extensionType === 'repair' && c.repairCount ? ` (${t('recordDetail.repairCountUnit').replace('{count}', String(c.repairCount))})` : ''}
            </span>
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
              <span className="text-sm font-medium text-text">{t('recordDetail.extraColorUnit').replace('{count}', String(c.extraColorCount))}</span>
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

          <div className="mt-2 flex items-center justify-between rounded-xl bg-primary/10 p-3">
            <span className="font-bold text-primary">{t('recordDetail.finalPayment')}</span>
            <span className="text-xl font-bold text-primary">{formatPrice(record.finalPrice)}</span>
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
            // Persist checklist to sessionStorage
            const saved = sessionStorage.getItem(`bdx-saved-record-${id}`);
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                sessionStorage.setItem(`bdx-saved-record-${id}`, JSON.stringify({ ...parsed, checklist: data }));
              } catch { /* ignore */ }
            }
          }}
          onSaveToPreference={() => {
            router.push(`/customers/${record.customerId}?tab=preference&fromChecklist=true`);
          }}
        />
      </div>

      {/* 고객 기록으로 이동 */}
      <div className="px-4">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => router.push(`/customers/${record.customerId}`)}
        >
          {t('recordDetail.viewCustomer')}
        </Button>
      </div>
    </div>
  );
}
