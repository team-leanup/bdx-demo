'use client';

import type { ReactNode } from 'react';
import { useConsultationStore } from '@/store/consultation-store';
import { calculatePrice } from '@/lib/price-calculator';
import { estimateTime } from '@/lib/time-calculator';
import { formatPrice, formatMinutes } from '@/lib/format';
import { useShopStore } from '@/store/shop-store';
import { PARTS_GRADE_OPTIONS } from '@/data/service-options';
import { Accordion } from '@/components/ui/Accordion';
import { cn } from '@/lib/cn';
import { useT, useKo, useLocale } from '@/lib/i18n';

// 값 → i18n 키 맵 (service-options value → values.* 키)
const VALUE_I18N_MAP: Record<string, string> = {
  'solid_tone': 'values.solidTone',
  'solid_point': 'values.solidPoint',
  'full_art': 'values.fullArt',
  'monthly_art': 'values.monthlyArt',
  'solid': 'values.solid',
  'gradient': 'values.gradient',
  'french': 'values.french',
  'magnetic': 'values.magnetic',
  'round': 'values.round',
  'oval': 'values.oval',
  'square': 'values.square',
  'squoval': 'values.squoval',
  'almond': 'values.almond',
  'stiletto': 'values.stiletto',
  'coffin': 'values.coffin',
};

interface ConsultationSummaryCardProps {
  className?: string;
}

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3 pb-2.5 border-b border-border">
      <div className="w-7 h-7 rounded-xl bg-surface-alt flex items-center justify-center flex-shrink-0">
        <span className="text-sm text-text-secondary">
          {icon}
        </span>
      </div>
      <h3 className="text-sm font-bold text-text">{title}</h3>
    </div>
  );
}

function Row({ label, value, highlight }: { label: ReactNode; value: ReactNode; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-text-muted">{label}</span>
      <span className={cn('text-sm font-medium', highlight ? 'text-primary font-semibold' : 'text-text')}>
        {value}
      </span>
    </div>
  );
}

function PriceRow({
  label,
  value,
  percentage,
  isDiscount,
  isFinal,
}: {
  label: ReactNode;
  value: number;
  percentage?: number;
  isDiscount?: boolean;
  isFinal?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 py-2',
        isFinal && 'border-t-2 border-border pt-3 mt-1',
      )}
    >
      <div className="flex justify-between items-center">
        <span className={cn('text-sm', isFinal ? 'font-bold text-text' : 'text-text-muted')}>
          {label}
        </span>
        <span
          className={cn(
            'font-semibold',
            isFinal ? 'text-xl font-bold text-primary' : isDiscount ? 'text-sm text-error' : 'text-sm text-text',
          )}
        >
          {isDiscount ? '-' : ''}{formatPrice(value)}
        </span>
      </div>
      {percentage !== undefined && percentage > 0 && !isDiscount && !isFinal && (
        <div className="h-1.5 bg-surface-alt rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function ConsultationSummaryCard({ className }: ConsultationSummaryCardProps) {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const consultation = useConsultationStore((s) => s.consultation);
  const breakdown = calculatePrice(consultation);
  const minutes = estimateTime(consultation);
  const getDesignerById = useShopStore((s) => s.getDesignerById);

  const designer = getDesignerById(consultation.designerId ?? '');

  const shapeLabel = t(VALUE_I18N_MAP[consultation.nailShape] ?? consultation.nailShape);
  const shapeLabelKo = tKo(VALUE_I18N_MAP[consultation.nailShape] ?? consultation.nailShape);

  const designLabel = t(VALUE_I18N_MAP[consultation.designScope] ?? consultation.designScope);
  const designLabelKo = tKo(VALUE_I18N_MAP[consultation.designScope] ?? consultation.designScope);

  const expressionLabels = consultation.expressions
    .map((e) => t(VALUE_I18N_MAP[e] ?? e))
    .join(', ');
  const expressionLabelsKo = consultation.expressions
    .map((e) => tKo(VALUE_I18N_MAP[e] ?? e))
    .join(', ');

  const offLabels: Record<string, string> = {
    none: t('off.none'),
    same_shop: t('off.sameShop'),
    other_shop: t('off.otherShop'),
  };
  const offLabelsKo: Record<string, string> = {
    none: tKo('off.none'),
    same_shop: tKo('off.sameShop'),
    other_shop: tKo('off.otherShop'),
  };

  const extLabels: Record<string, string> = {
    none: t('off.none'),
    repair: consultation.repairCount
      ? t('summary.repairCount').replace('{count}', String(consultation.repairCount))
      : t('summary.extensionLabel'),
    extension: t('summary.extensionLabel'),
  };
  const extensionLabelsKo: Record<string, string> = {
    none: tKo('off.none'),
    repair: consultation.repairCount
      ? tKo('summary.repairCount').replace('{count}', String(consultation.repairCount))
      : tKo('summary.extensionLabel'),
    extension: tKo('summary.extensionLabel'),
  };

  // For progress bars: compute each item's percentage of subtotal
  const pct = (val: number) => breakdown.subtotal > 0 ? (val / breakdown.subtotal) * 100 : 0;

  const biLabel = (key: string): ReactNode => (
    <>
      {t(key)}
      {locale !== 'ko' && (
        <span className="ml-1 text-[10px] opacity-60">{tKo(key)}</span>
      )}
    </>
  );

  const biValue = (main: string, ko: string): ReactNode => (
    <>
      {main}
      {locale !== 'ko' && main !== ko && (
        <span className="ml-1 text-[10px] opacity-60">{ko}</span>
      )}
    </>
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Visual header */}
      <div className="flex items-center gap-3 px-1 pb-1">
        <div className="w-12 h-12 rounded-xl bg-surface-alt flex items-center justify-center flex-shrink-0">
          <svg width="26" height="26" viewBox="0 0 56 56" fill="none" className="text-primary">
            <rect x="10" y="22" width="36" height="28" rx="5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
            <path d="M10 22 Q10 8 28 8 Q46 8 46 22" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
            <path d="M16 14 Q20 9 28 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Final Review</p>
          <h2 className="text-base font-bold text-text">
            {t('summary.finalReview')}
            {locale !== 'ko' && (
              <span className="ml-1 text-[10px] font-medium text-text-muted opacity-60">{tKo('summary.finalReview')}</span>
            )}
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white border border-border rounded-2xl px-4 py-3">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold text-text">
            {t('summary.approxTime').replace('{time}', formatMinutes(minutes, locale))}
            {locale !== 'ko' && (
              <span className="ml-1 text-xs text-text-muted">{tKo('summary.approxTime').replace('{time}', formatMinutes(minutes, 'ko'))}</span>
            )}
          </span>
        </div>
        {designer && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-surface-alt flex items-center justify-center">
              <span className="text-[10px] font-bold text-text-secondary">{designer.name.slice(0, 1)}</span>
            </div>
            <span className="text-sm text-text-secondary">{designer.name}{t('common.designerSuffix')}</span>
          </div>
        )}
      </div>

      {/* 1. 가격 상세 */}
      <Accordion title={biLabel('summary.priceDetail')}>
        <div className="flex flex-col">
          <PriceRow
            label={biLabel(consultation.bodyPart === 'hand' ? 'summary.handBase' : 'summary.footBase')}
            value={breakdown.basePrice}
            percentage={pct(breakdown.basePrice)}
          />
          {breakdown.offSurcharge > 0 && (
            <PriceRow label={biLabel('summary.offLabel')} value={breakdown.offSurcharge} percentage={pct(breakdown.offSurcharge)} />
          )}
          {breakdown.extensionSurcharge > 0 && (
            <PriceRow label={biLabel('summary.extensionLabel')} value={breakdown.extensionSurcharge} percentage={pct(breakdown.extensionSurcharge)} />
          )}
          {breakdown.designSurcharge > 0 && (
            <PriceRow label={biLabel('summary.designLabel')} value={breakdown.designSurcharge} percentage={pct(breakdown.designSurcharge)} />
          )}
          {breakdown.expressionSurcharge > 0 && (
            <PriceRow label={biLabel('summary.expressionLabel')} value={breakdown.expressionSurcharge} percentage={pct(breakdown.expressionSurcharge)} />
          )}
          {breakdown.partsSurcharge > 0 && (
            <PriceRow label={biLabel('summary.partsLabel')} value={breakdown.partsSurcharge} percentage={pct(breakdown.partsSurcharge)} />
          )}
          {breakdown.colorSurcharge > 0 && (
            <PriceRow label={biLabel('summary.colorLabel')} value={breakdown.colorSurcharge} percentage={pct(breakdown.colorSurcharge)} />
          )}
          <div className="border-t border-border pt-2 mt-1">
            <PriceRow label={biLabel('summary.subtotal')} value={breakdown.subtotal} />
          </div>
          {breakdown.discountAmount > 0 && (
            <PriceRow label={biLabel('summary.discountLabel')} value={breakdown.discountAmount} isDiscount />
          )}
          {breakdown.depositAmount > 0 && (
            <PriceRow label={biLabel('summary.depositLabel')} value={breakdown.depositAmount} isDiscount />
          )}
        </div>
      </Accordion>

      {/* 2. 디자인 */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="19" cy="13" r="2.5" /><circle cx="6" cy="13" r="2.5" /><circle cx="13.5" cy="19.5" r="2.5" /><path d="M13.5 9v3M15.8 7.7l2.3 3.3M11.2 7.7l-2.3 3.3M8.5 15.5l2.3 1M18.5 15.5l-2.3 1" strokeLinecap="round" />
            </svg>
          }
          title={biLabel('summary.design')}
        />
        <Row label={biLabel('summary.designRange')} value={biValue(designLabel, designLabelKo)} />
        <Row label={biLabel('summary.expressionMethod')} value={biValue(expressionLabels || '-', expressionLabelsKo || '-')} />
      </div>

      {/* 3. 시술 조건 */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-2.553 2.553A2.25 2.25 0 0115.662 18H8.338a2.25 2.25 0 01-1.585-.658L4.2 15m15.6 0l-4.8-4.5M4.2 15l4.8-4.5" />
            </svg>
          }
          title={biLabel('summary.conditions')}
        />
        <Row
          label={biLabel('summary.bodyPartLabel')}
          value={biValue(
            consultation.bodyPart === 'hand' ? t('bodyPart.hand') : t('bodyPart.foot'),
            consultation.bodyPart === 'hand' ? tKo('bodyPart.hand') : tKo('bodyPart.foot'),
          )}
        />
        <Row
          label={biLabel('summary.offLabel')}
          value={biValue(offLabels[consultation.offType], offLabelsKo[consultation.offType])}
        />
        <Row
          label={biLabel('summary.extensionLabel')}
          value={biValue(extLabels[consultation.extensionType], extensionLabelsKo[consultation.extensionType])}
        />
        <Row label={biLabel('summary.shapeLabel')} value={biValue(shapeLabel, shapeLabelKo)} />
      </div>

      {/* 4. 추가 옵션 */}
      <div className="bg-white rounded-2xl border border-border p-4">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          }
          title={biLabel('summary.extraOptions')}
        />
        {consultation.hasParts && consultation.partsSelections.length > 0 ? (
          consultation.partsSelections.map((sel) => {
            const gradePrice = PARTS_GRADE_OPTIONS.find((g) => g.grade === sel.grade)?.pricePerUnit ?? 0;
            return (
              <Row
                key={sel.grade}
                label={
                  <>
                    {`${t('summary.partsLabel')} ${sel.grade}`}
                    {locale !== 'ko' && (
                      <span className="ml-1 text-[10px] opacity-60">{`${tKo('summary.partsLabel')} ${sel.grade}`}</span>
                    )}
                  </>
                }
                value={`${sel.quantity} · ${formatPrice(gradePrice * sel.quantity)}`}
                highlight
              />
            );
          })
        ) : (
          <Row label={biLabel('summary.partsLabel')} value={biValue(t('summary.noPartsSelected'), tKo('summary.noPartsSelected'))} />
        )}
        <Row
          label={biLabel('summary.colorLabel')}
          value={biValue(
            consultation.extraColorCount > 0
              ? t('summary.colorAdded').replace('{count}', String(consultation.extraColorCount))
              : t('summary.noColorAdded'),
            consultation.extraColorCount > 0
              ? tKo('summary.colorAdded').replace('{count}', String(consultation.extraColorCount))
              : tKo('summary.noColorAdded'),
          )}
          highlight={consultation.extraColorCount > 0}
        />
      </div>

      {/* 5. 고객 정보 */}
      {(consultation.customerName || consultation.customerId) && (
        <div className="bg-white rounded-2xl border border-border p-4">
          <SectionHeader
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            }
            title={biLabel('summary.customerInfo')}
          />
          {consultation.customerName && (
            <Row label={biLabel('summary.name')} value={consultation.customerName} />
          )}
          {consultation.customerPhone && (
            <Row label={biLabel('summary.phone')} value={consultation.customerPhone} />
          )}
        </div>
      )}
    </div>
  );
}
