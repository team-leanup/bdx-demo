import type {
  DesignCategory,
  AddOnOption,
  PreConsultPriceEstimate,
  RemovalPreference,
  LengthPreference,
  WrappingPreference,
} from '@/types/pre-consultation';
import type {
  CategoryPricingSettings,
  CustomCategory,
  CustomPartSetting,
  SurchargeSettings,
} from '@/types/shop';

export const ADDON_FIXED_PRICES = {
  stone: 5000,
  glitter: 3000,
  wrapping: 5000,
} as const;

interface PriceCalcInput {
  designCategory: DesignCategory;
  removalPreference: RemovalPreference | null;
  lengthPreference: LengthPreference | null;
  /** 0529 — 랩핑 선호 (네일 상태 섹션). 'yes'면 surcharges.wrapping 추가 */
  wrappingPreference?: WrappingPreference | null;
  addOns: AddOnOption[];
  categoryPricing: CategoryPricingSettings;
  surcharges: SurchargeSettings;
  photoBasePrice?: number;
  /** 0528 — 손님이 선택한 커스텀 파츠 개수 (name → count) */
  customPartSelections?: Record<string, number>;
  /** 0528 — 샵 설정의 커스텀 파츠 정의 (가격 조회용) */
  customParts?: CustomPartSetting[];
  /** 0528 — 샵이 추가한 시술 종류 (designCategory가 custom id일 때 가격/시간 조회) */
  customCategories?: CustomCategory[];
}

export function calculatePreConsultPrice(input: PriceCalcInput): PreConsultPriceEstimate {
  const { designCategory, removalPreference, lengthPreference, wrappingPreference, addOns, categoryPricing, surcharges, photoBasePrice, customPartSelections, customParts, customCategories } = input;

  // 1. Category base price & time — builtin은 categoryPricing, custom은 customCategories
  const customCat = customCategories?.find((c) => c.id === designCategory);
  const builtinPricing = categoryPricing[designCategory as keyof CategoryPricingSettings];
  const categoryBase = photoBasePrice ?? customCat?.price ?? builtinPricing?.price ?? 0;
  const categoryTime = customCat?.time ?? builtinPricing?.time ?? 0;

  // 2. Removal surcharge
  let removalSurcharge = 0;
  if (removalPreference === 'self_shop') {
    removalSurcharge = surcharges.selfRemoval;
  } else if (removalPreference === 'other_shop') {
    removalSurcharge = surcharges.otherRemoval;
  }

  // 3. Extension surcharge
  const extensionSurcharge = lengthPreference === 'extend' ? surcharges.extension : 0;

  // 4. Add-on surcharges
  let addOnSurcharge = 0;
  for (const addOn of addOns) {
    if (addOn === 'stone') {
      addOnSurcharge += ADDON_FIXED_PRICES.stone;
    } else if (addOn === 'parts') {
      addOnSurcharge += surcharges.largeParts;
    } else if (addOn === 'glitter') {
      addOnSurcharge += ADDON_FIXED_PRICES.glitter;
    } else if (addOn === 'point_art') {
      addOnSurcharge += surcharges.pointArt;
    } else if (addOn === 'wrapping') {
      addOnSurcharge += surcharges.wrapping ?? ADDON_FIXED_PRICES.wrapping;
    }
  }
  // 0529: 랩핑 선호(네일 상태 섹션 '랩핑 해주세요')도 가격 반영 — addOns에 없을 때만(이중 방지)
  if (wrappingPreference === 'yes' && !addOns.includes('wrapping')) {
    addOnSurcharge += surcharges.wrapping ?? ADDON_FIXED_PRICES.wrapping;
  }

  // 4-1. Custom parts surcharge (사장님이 등록한 파츠 × 손님이 선택한 개수)
  // 보안: count는 정수 + 0 이상으로 클램프 (클라이언트 조작 방지)
  let customPartsSurcharge = 0;
  if (customPartSelections && customParts) {
    for (const part of customParts) {
      const raw = customPartSelections[part.name];
      const count = typeof raw === 'number' ? Math.max(0, Math.floor(raw)) : 0;
      if (count > 0) {
        customPartsSurcharge += part.pricePerUnit * count;
      }
    }
  }

  // 5. Base total
  const base = categoryBase + removalSurcharge + extensionSurcharge + addOnSurcharge + customPartsSurcharge;

  // 6. Min/max total
  const minTotal = base;
  const maxRaw = base * 1.3;
  const maxTotal = Math.round(maxRaw / 1000) * 1000;

  // 7. Estimated minutes
  const removalMinutes = removalPreference !== 'none' && removalPreference !== null ? 10 : 0;
  const extensionMinutes = lengthPreference === 'extend' ? 20 : 0;
  const addOnMinutes = addOns.length * 5;
  // 랩핑 선호(addOns에 없을 때)도 시술시간에 5분 추가 (가격 반영과 대칭)
  const wrappingMinutes = wrappingPreference === 'yes' && !addOns.includes('wrapping') ? 5 : 0;
  const estimatedMinutes = categoryTime + removalMinutes + extensionMinutes + addOnMinutes + wrappingMinutes;

  return {
    categoryBase,
    removalSurcharge,
    extensionSurcharge,
    addOnSurcharge,
    customPartsSurcharge,
    minTotal,
    maxTotal,
    estimatedMinutes,
  };
}
