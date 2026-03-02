'use client';

import { useConsultationStore } from '@/store/consultation-store';
import { calculatePrice } from '@/lib/price-calculator';
import { estimateTime } from '@/lib/time-calculator';
import { formatPrice, formatMinutes } from '@/lib/format';
import { MOCK_DESIGNERS } from '@/data/mock-shop';
import { NAIL_SHAPE_OPTIONS, DESIGN_SCOPE_OPTIONS, EXPRESSION_OPTIONS, PARTS_GRADE_OPTIONS } from '@/data/service-options';
import { Accordion } from '@/components/ui/Accordion';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';

interface ConsultationSummaryCardProps {
  className?: string;
}

function SectionHeader({ icon, title, color = 'primary' }: { icon: React.ReactNode; title: string; color?: string }) {
  return (
    <div className={cn(
      'flex items-center gap-2.5 mb-3 pb-2.5 border-b',
      color === 'primary' ? 'border-primary/20' : 'border-border',
    )}>
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
        color === 'primary' ? 'bg-primary/15' : 'bg-surface-alt',
      )}>
        <span className={cn('text-sm', color === 'primary' ? 'text-primary' : 'text-text-secondary')}>
          {icon}
        </span>
      </div>
      <h3 className="text-sm font-bold text-text">{title}</h3>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
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
  label: string;
  value: number;
  percentage?: number;
  isDiscount?: boolean;
  isFinal?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1.5 py-2',
        isFinal && 'border-t-2 border-primary/30 pt-3 mt-1',
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
            className="h-full bg-primary/40 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function ConsultationSummaryCard({ className }: ConsultationSummaryCardProps) {
  const t = useT();
  const consultation = useConsultationStore((s) => s.consultation);
  const breakdown = calculatePrice(consultation);
  const minutes = estimateTime(consultation);

  const designer = MOCK_DESIGNERS.find((d) => d.id === consultation.designerId);
  const shapeLabel = NAIL_SHAPE_OPTIONS.find((s) => s.value === consultation.nailShape)?.label ?? consultation.nailShape;
  const designLabel = DESIGN_SCOPE_OPTIONS.find((d) => d.value === consultation.designScope)?.label ?? consultation.designScope;
  const expressionLabels = consultation.expressions
    .map((e) => EXPRESSION_OPTIONS.find((o) => o.value === e)?.label ?? e)
    .join(', ');

  const offLabels: Record<string, string> = {
    none: t('off.none'),
    same_shop: t('off.sameShop'),
    other_shop: t('off.otherShop'),
  };

  const extensionLabels: Record<string, string> = {
    none: t('off.none'),
    repair: consultation.repairCount
      ? t('summary.repairCount').replace('{count}', String(consultation.repairCount))
      : t('summary.extensionLabel'),
    extension: t('summary.extensionLabel'),
  };

  // For progress bars: compute each item's percentage of subtotal
  const pct = (val: number) => breakdown.subtotal > 0 ? (val / breakdown.subtotal) * 100 : 0;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Visual header */}
      <div className="flex items-center gap-3 px-1 pb-1">
        <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <svg width="26" height="26" viewBox="0 0 56 56" fill="none" className="text-primary">
            <rect x="10" y="22" width="36" height="28" rx="5" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
            <path d="M10 22 Q10 8 28 8 Q46 8 46 22" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
            <path d="M16 14 Q20 9 28 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>
        <div>
          <p className="text-[11px] font-bold text-primary uppercase tracking-widest">Final Review</p>
          <h2 className="text-base font-bold text-text">{t('summary.finalReview')}</h2>
        </div>
      </div>

      {/* 히어로 카드: 최종금액 + 예상시간 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-dark to-primary rounded-2xl p-5 shadow-md">
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

        <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 relative">{t('summary.finalPayment')}</p>
        <p className="text-5xl font-bold text-white mb-3 relative tracking-tight">
          {formatPrice(breakdown.finalPrice)}
        </p>
        <div className="flex items-center gap-4 relative">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-base font-semibold text-white">{t('summary.approxTime').replace('{time}', formatMinutes(minutes))}</span>
          </div>
          {designer && (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">{designer.name.slice(0, 1)}</span>
              </div>
              <span className="text-sm text-white/80">{designer.name}{t('common.designerSuffix')}</span>
            </div>
          )}
        </div>
      </div>

      {/* 1. 가격 상세 */}
      <Accordion title={t('summary.priceDetail')}>
        <div className="flex flex-col">
          <PriceRow
            label={consultation.bodyPart === 'hand' ? t('summary.handBase') : t('summary.footBase')}
            value={breakdown.basePrice}
            percentage={pct(breakdown.basePrice)}
          />
          {breakdown.offSurcharge > 0 && (
            <PriceRow label={t('summary.offLabel')} value={breakdown.offSurcharge} percentage={pct(breakdown.offSurcharge)} />
          )}
          {breakdown.extensionSurcharge > 0 && (
            <PriceRow label={t('summary.extensionLabel')} value={breakdown.extensionSurcharge} percentage={pct(breakdown.extensionSurcharge)} />
          )}
          {breakdown.designSurcharge > 0 && (
            <PriceRow label={t('summary.designLabel')} value={breakdown.designSurcharge} percentage={pct(breakdown.designSurcharge)} />
          )}
          {breakdown.expressionSurcharge > 0 && (
            <PriceRow label={t('summary.expressionLabel')} value={breakdown.expressionSurcharge} percentage={pct(breakdown.expressionSurcharge)} />
          )}
          {breakdown.partsSurcharge > 0 && (
            <PriceRow label={t('summary.partsLabel')} value={breakdown.partsSurcharge} percentage={pct(breakdown.partsSurcharge)} />
          )}
          {breakdown.colorSurcharge > 0 && (
            <PriceRow label={t('summary.colorLabel')} value={breakdown.colorSurcharge} percentage={pct(breakdown.colorSurcharge)} />
          )}
          <div className="border-t border-border pt-2 mt-1">
            <PriceRow label={t('summary.subtotal')} value={breakdown.subtotal} />
          </div>
          {breakdown.discountAmount > 0 && (
            <PriceRow label={t('summary.discountLabel')} value={breakdown.discountAmount} isDiscount />
          )}
          {breakdown.depositAmount > 0 && (
            <PriceRow label={t('summary.depositLabel')} value={breakdown.depositAmount} isDiscount />
          )}
        </div>
      </Accordion>

      {/* 2. 디자인 */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <circle cx="13.5" cy="6.5" r="2.5" /><circle cx="19" cy="13" r="2.5" /><circle cx="6" cy="13" r="2.5" /><circle cx="13.5" cy="19.5" r="2.5" /><path d="M13.5 9v3M15.8 7.7l2.3 3.3M11.2 7.7l-2.3 3.3M8.5 15.5l2.3 1M18.5 15.5l-2.3 1" strokeLinecap="round" />
            </svg>
          }
          title={t('summary.design')}
          color="primary"
        />
        <Row label={t('summary.designRange')} value={designLabel} />
        <Row label={t('summary.expressionMethod')} value={expressionLabels || '-'} />
      </div>

      {/* 3. 시술 조건 */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15l-2.553 2.553A2.25 2.25 0 0115.662 18H8.338a2.25 2.25 0 01-1.585-.658L4.2 15m15.6 0l-4.8-4.5M4.2 15l4.8-4.5" />
            </svg>
          }
          title={t('summary.conditions')}
          color="primary"
        />
        <Row label={t('summary.bodyPartLabel')} value={consultation.bodyPart === 'hand' ? t('bodyPart.hand') : t('bodyPart.foot')} />
        <Row label={t('summary.offLabel')} value={offLabels[consultation.offType]} />
        <Row label={t('summary.extensionLabel')} value={extensionLabels[consultation.extensionType]} />
        <Row label={t('summary.shapeLabel')} value={shapeLabel} />
      </div>

      {/* 4. 추가 옵션 */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
        <SectionHeader
          icon={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          }
          title={t('summary.extraOptions')}
          color="primary"
        />
        {consultation.hasParts && consultation.partsSelections.length > 0 ? (
          consultation.partsSelections.map((sel) => {
            const gradePrice = PARTS_GRADE_OPTIONS.find((g) => g.grade === sel.grade)?.pricePerUnit ?? 0;
            return (
              <Row
                key={sel.grade}
                label={`${t('summary.partsLabel')} ${sel.grade}`}
                value={`${sel.quantity} · ${formatPrice(gradePrice * sel.quantity)}`}
                highlight
              />
            );
          })
        ) : (
          <Row label={t('summary.partsLabel')} value={t('summary.noPartsSelected')} />
        )}
        <Row
          label={t('summary.colorLabel')}
          value={
            consultation.extraColorCount > 0
              ? t('summary.colorAdded').replace('{count}', String(consultation.extraColorCount))
              : t('summary.noColorAdded')
          }
          highlight={consultation.extraColorCount > 0}
        />
      </div>

      {/* 5. 고객 정보 */}
      {(consultation.customerName || consultation.customerId) && (
        <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm">
          <SectionHeader
            icon={
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            }
            title={t('summary.customerInfo')}
            color="primary"
          />
          {consultation.customerName && (
            <Row label={t('summary.name')} value={consultation.customerName} />
          )}
          {consultation.customerPhone && (
            <Row label={t('summary.phone')} value={consultation.customerPhone} />
          )}
        </div>
      )}
    </div>
  );
}
