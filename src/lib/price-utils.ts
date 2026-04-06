import type { ConsultationRecord } from '@/types/consultation';
import type { PriceBreakdown } from '@/types/price';

// Build a PriceBreakdown from a finalized ConsultationRecord's pricingAdjustments
export function buildBreakdownFromRecord(record: ConsultationRecord): PriceBreakdown {
  const adj = record.pricingAdjustments;
  const basePrice = adj?.basePrice ?? record.totalPrice;
  const extras = adj?.extras ?? [];
  const extrasTotal = extras.reduce((sum, e) => sum + e.amount, 0);
  const subtotal = basePrice + extrasTotal;
  const discountAmount = adj?.discountAmount ?? 0;
  const depositAmount = record.consultation.deposit ?? 0;
  const finalPrice = adj?.finalPrice ?? record.finalPrice;

  const items: PriceBreakdown['items'] = [
    { label: '기본 시술', amount: basePrice },
    ...extras.map((e) => ({ label: e.label, amount: e.amount })),
  ];

  if (discountAmount > 0) {
    const discountLabel = record.consultation.discount
      ? record.consultation.discount.type === 'percent'
        ? `할인 (${record.consultation.discount.value}%)`
        : '할인'
      : '할인';
    items.push({ label: discountLabel, amount: discountAmount, isDiscount: true });
  }
  if (depositAmount > 0) {
    items.push({ label: '예약금', amount: depositAmount, isDiscount: true });
  }

  return {
    basePrice,
    offSurcharge: 0,
    extensionSurcharge: 0,
    designSurcharge: 0,
    expressionSurcharge: 0,
    partsSurcharge: 0,
    colorSurcharge: 0,
    subtotal,
    discountAmount,
    depositAmount,
    finalPrice,
    estimatedMinutes: record.estimatedMinutes,
    items,
  };
}
