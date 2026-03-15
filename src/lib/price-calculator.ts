import type { ConsultationType } from '@/types/consultation';
import type { PriceBreakdown, PriceItem, ServicePricing, PartsPricing } from '@/types/price';
import type { CustomPart } from '@/types/canvas';
import { estimateTime } from '@/lib/time-calculator';

export const DEFAULT_SERVICE_PRICING: ServicePricing = {
  handBase: 60000,
  footBase: 70000,
  offSameShop: 5000,
  offOtherShop: 10000,
  repairPerNail: 3000,
  extensionBase: 20000,
  solidTone: 0,
  solidPoint: 10000,
  fullArt: 20000,
  monthlyArt: 25000,
  gradient: 5000,
  french: 5000,
  magnetic: 5000,
  extraColorPerUnit: 3000,
};

export const DEFAULT_PARTS_PRICING: PartsPricing = {
  gradeS: 3000,
  gradeA: 2000,
  gradeB: 1000,
};

/**
 * Build ServicePricing from shop settings (app-store).
 * Falls back to DEFAULT_SERVICE_PRICING for fields not in shop settings.
 */
export function buildServicePricingFromShopSettings(settings: {
  baseHandPrice: number;
  baseFootPrice: number;
  baseOffSameShop: number;
  baseOffOtherShop: number;
  baseMonthlyArtPrice: number;
  surcharges: {
    repairPer: number;
    extension: number;
    gradation: number;
    french: number;
    magnet: number;
    pointArt: number;
    fullArt: number;
  };
}): ServicePricing {
  return {
    handBase: settings.baseHandPrice,
    footBase: settings.baseFootPrice,
    offSameShop: settings.baseOffSameShop,
    offOtherShop: settings.baseOffOtherShop,
    repairPerNail: settings.surcharges.repairPer,
    extensionBase: settings.surcharges.extension,
    solidTone: 0,
    solidPoint: settings.surcharges.pointArt,
    fullArt: settings.surcharges.fullArt,
    monthlyArt: settings.baseMonthlyArtPrice,
    gradient: settings.surcharges.gradation,
    french: settings.surcharges.french,
    magnetic: settings.surcharges.magnet,
    extraColorPerUnit: DEFAULT_SERVICE_PRICING.extraColorPerUnit,
  };
}

export function calculatePrice(
  consultation: ConsultationType,
  pricing: ServicePricing = DEFAULT_SERVICE_PRICING,
  partsPricing: PartsPricing = DEFAULT_PARTS_PRICING,
): PriceBreakdown {
  const items: PriceItem[] = [];

  // 1. 기본가
  const basePrice =
    consultation.bodyPart === 'hand' ? pricing.handBase : pricing.footBase;
  items.push({
    label: consultation.bodyPart === 'hand' ? '핸드 기본가' : '페디큐어 기본가',
    labelEn: consultation.bodyPart === 'hand' ? 'Hand Base' : 'Foot Base',
    amount: basePrice,
  });

  // 2. 오프 추가금
  let offSurcharge = 0;
  if (consultation.offType === 'same_shop') {
    offSurcharge = pricing.offSameShop;
    items.push({ label: '자샵오프', labelEn: 'In-shop Off', amount: offSurcharge });
  } else if (consultation.offType === 'other_shop') {
    offSurcharge = pricing.offOtherShop;
    items.push({ label: '타샵오프', labelEn: 'Other-shop Off', amount: offSurcharge });
  }

  // 3. 연장/리페어 추가금
  let extensionSurcharge = 0;
  if (consultation.extensionType === 'repair') {
    const count = consultation.repairCount ?? 1;
    extensionSurcharge = pricing.repairPerNail * count;
    items.push({
      label: `리페어 (${count}개)`,
      labelEn: `Repair (${count})`,
      amount: extensionSurcharge,
    });
  } else if (consultation.extensionType === 'extension') {
    extensionSurcharge = pricing.extensionBase;
    items.push({ label: '연장', labelEn: 'Extension', amount: extensionSurcharge });
  }

  // 4. 디자인 범위 추가금
  let designSurcharge = 0;
  const designLabels: Record<string, { ko: string; en: string; price: number }> = {
    solid_tone: { ko: '원컬러', en: 'Solid Tone', price: pricing.solidTone },
    solid_point: { ko: '단색+포인트', en: 'Solid+Point', price: pricing.solidPoint },
    full_art: { ko: '풀아트', en: 'Full Art', price: pricing.fullArt },
    monthly_art: { ko: '이달의 아트', en: "Monthly Art", price: pricing.monthlyArt },
  };
  const designInfo = designLabels[consultation.designScope];
  if (designInfo) {
    designSurcharge = designInfo.price;
    if (designSurcharge > 0) {
      items.push({ label: designInfo.ko, labelEn: designInfo.en, amount: designSurcharge });
    }
  }

  // 5. 표현 기법 추가금
  let expressionSurcharge = 0;
  const expressionLabels: Record<string, { ko: string; en: string; price: number }> = {
    gradient: { ko: '그라데이션', en: 'Gradient', price: pricing.gradient },
    french: { ko: '프렌치', en: 'French', price: pricing.french },
    magnetic: { ko: '마그네틱', en: 'Magnetic', price: pricing.magnetic },
    solid: { ko: '기본', en: 'Solid', price: 0 },
  };
  for (const expr of consultation.expressions) {
    const info = expressionLabels[expr];
    if (info && info.price > 0) {
      expressionSurcharge += info.price;
      items.push({ label: info.ko, labelEn: info.en, amount: info.price });
    }
  }

  // 6. 파츠 추가금
  let partsSurcharge = 0;
  if (consultation.hasParts && consultation.partsSelections.length > 0) {
    for (const sel of consultation.partsSelections) {
      // CustomPart 기반 계산 (customPartId가 있고, customParts 목록이 있는 경우)
      if (sel.customPartId && partsPricing.customParts) {
        const customPart = partsPricing.customParts.find(
          (p: CustomPart) => p.id === sel.customPartId,
        );
        if (customPart) {
          const amount = customPart.pricePerUnit * sel.quantity;
          partsSurcharge += amount;
          items.push({
            label: `${customPart.name} × ${sel.quantity}개`,
            labelEn: `${customPart.name} × ${sel.quantity}`,
            amount,
          });
          continue;
        }
      }
      // 기존 grade 기반 계산 (하위 호환)
      const pricePerPart =
        sel.grade === 'S'
          ? partsPricing.gradeS
          : sel.grade === 'A'
          ? partsPricing.gradeA
          : partsPricing.gradeB;
      const amount = pricePerPart * sel.quantity;
      partsSurcharge += amount;
      items.push({
        label: `파츠 ${sel.grade}등급 × ${sel.quantity}개`,
        labelEn: `Parts Grade-${sel.grade} × ${sel.quantity}`,
        amount,
      });
    }
  }

  // 7. 컬러 추가금
  let colorSurcharge = 0;
  if (consultation.extraColorCount > 0) {
    colorSurcharge = consultation.extraColorCount * pricing.extraColorPerUnit;
    items.push({
      label: `컬러 추가 ${consultation.extraColorCount}색`,
      labelEn: `Extra Color × ${consultation.extraColorCount}`,
      amount: colorSurcharge,
    });
  }

  // 소계
  const subtotal =
    basePrice +
    offSurcharge +
    extensionSurcharge +
    designSurcharge +
    expressionSurcharge +
    partsSurcharge +
    colorSurcharge;

  // 8. 할인
  let discountAmount = 0;
  if (consultation.discount) {
    if (consultation.discount.type === 'fixed') {
      discountAmount = consultation.discount.value;
    } else {
      discountAmount = Math.round(subtotal * (consultation.discount.value / 100));
    }
    if (discountAmount > 0) {
      items.push({
        label: consultation.discount.type === 'percent'
          ? `할인 (${consultation.discount.value}%)`
          : '할인',
        labelEn: 'Discount',
        amount: discountAmount,
        isDiscount: true,
      });
    }
  }

  // 9. 예약금
  const depositAmount = consultation.deposit ?? 0;
  if (depositAmount > 0) {
    items.push({
      label: '예약금',
      labelEn: 'Deposit',
      amount: depositAmount,
      isDiscount: true,
    });
  }

  // 최종 결제
  const finalPrice = Math.max(0, subtotal - discountAmount - depositAmount);

  // 예상 시간 (time-calculator와 별도로 기본 계산)
  const estimatedMinutes = estimateTime(consultation);

  return {
    basePrice,
    offSurcharge,
    extensionSurcharge,
    designSurcharge,
    expressionSurcharge,
    partsSurcharge,
    colorSurcharge,
    subtotal,
    discountAmount,
    depositAmount,
    finalPrice,
    estimatedMinutes,
    items,
  };
}
