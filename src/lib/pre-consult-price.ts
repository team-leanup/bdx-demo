import type {
  DesignCategory,
  AddOnOption,
  PreConsultPriceEstimate,
  RemovalPreference,
  LengthPreference,
} from '@/types/pre-consultation';
import type { CategoryPricingSettings, SurchargeSettings } from '@/types/shop';

export const ADDON_FIXED_PRICES = {
  stone: 5000,
  glitter: 3000,
} as const;

interface PriceCalcInput {
  designCategory: DesignCategory;
  removalPreference: RemovalPreference | null;
  lengthPreference: LengthPreference | null;
  addOns: AddOnOption[];
  categoryPricing: CategoryPricingSettings;
  surcharges: SurchargeSettings;
}

export function calculatePreConsultPrice(input: PriceCalcInput): PreConsultPriceEstimate {
  const { designCategory, removalPreference, lengthPreference, addOns, categoryPricing, surcharges } = input;

  // 1. Category base price & time
  const categoryBase = categoryPricing[designCategory].price;
  const categoryTime = categoryPricing[designCategory].time;

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
    }
  }

  // 5. Base total
  const base = categoryBase + removalSurcharge + extensionSurcharge + addOnSurcharge;

  // 6. Min/max total
  const minTotal = base;
  const maxRaw = base * 1.3;
  const maxTotal = Math.round(maxRaw / 1000) * 1000;

  // 7. Estimated minutes
  const removalMinutes = removalPreference !== 'none' && removalPreference !== null ? 10 : 0;
  const extensionMinutes = lengthPreference === 'extend' ? 20 : 0;
  const addOnMinutes = addOns.length * 5;
  const estimatedMinutes = categoryTime + removalMinutes + extensionMinutes + addOnMinutes;

  return {
    categoryBase,
    removalSurcharge,
    extensionSurcharge,
    addOnSurcharge,
    minTotal,
    maxTotal,
    estimatedMinutes,
  };
}
