'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ServiceStructure, SurchargeSettings, TimeSettings, BusinessHours, Shop, CategoryPricingSettings } from '@/types/shop';
import { dbUpdateShopSettings } from '@/lib/db';
import { useAuthStore } from '@/store/auth-store';

// Re-exported for backward compatibility with files that import CategoryPricing from this module
export type { CategoryPricingSettings as CategoryPricing };

interface ShopSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopAddressDetail: string;
  baseHandPrice: number;
  baseFootPrice: number;
  baseOffSameShop: number;
  baseOffOtherShop: number;
  baseSolidPointPrice: number;
  baseFullArtPrice: number;
  baseMonthlyArtPrice: number;
  designerCount: number;
  selectedServices: string[];
  businessHours: BusinessHours[];
  serviceStructure: ServiceStructure;
  surcharges: SurchargeSettings;
  timeSettings: TimeSettings;
  customerNotice: string;
  categoryPricing: CategoryPricingSettings;
  depositAmount: number;
  kakaoTalkUrl: string;
  naverReservationUrl: string;
  monthlyTargetRevenue?: number;
  /** 0423 반영: 재방문 알림 문자 기본 문구틀 ({customerName}, {shopName} 치환) */
  revisitMessageTemplate: string;
}

const DEFAULT_CATEGORY_PRICING: CategoryPricingSettings = {
  simple: { price: 50000, time: 60 },
  french: { price: 55000, time: 70 },
  magnet: { price: 60000, time: 80 },
  art: { price: 70000, time: 90 },
};

const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  shopName: '',
  shopPhone: '',
  shopAddress: '',
  shopAddressDetail: '',
  baseHandPrice: 60000,
  baseFootPrice: 70000,
  baseOffSameShop: 5000,
  baseOffOtherShop: 10000,
  baseSolidPointPrice: 3000,
  baseFullArtPrice: 10000,
  baseMonthlyArtPrice: 80000,
  designerCount: 1,
  selectedServices: [],
  customerNotice: '선택하신 디자인을 기준으로 가격과 시간은 변동될 수 있어요',
  categoryPricing: { ...DEFAULT_CATEGORY_PRICING },
  depositAmount: 10000,
  kakaoTalkUrl: '',
  naverReservationUrl: '',
  revisitMessageTemplate: '안녕하세요, {customerName}님! {shopName}입니다. 마지막 방문 이후 한 달이 지났네요. 예약을 도와드릴까요?',
  businessHours: [
    { dayOfWeek: 0, isOpen: false },
    { dayOfWeek: 1, isOpen: true, openTime: '10:00', closeTime: '20:00' },
    { dayOfWeek: 2, isOpen: true, openTime: '10:00', closeTime: '20:00' },
    { dayOfWeek: 3, isOpen: true, openTime: '10:00', closeTime: '20:00' },
    { dayOfWeek: 4, isOpen: true, openTime: '10:00', closeTime: '20:00' },
    { dayOfWeek: 5, isOpen: true, openTime: '10:00', closeTime: '20:00' },
    { dayOfWeek: 6, isOpen: true, openTime: '10:00', closeTime: '18:00' },
  ],
  serviceStructure: {
    removal: true,
    gradation: true,
    french: true,
    magnet: true,
    pointFullArt: true,
    parts: true,
    repair: true,
    overlay: true,
    extension: false,
  },
  surcharges: {
    selfRemoval: 5000,
    otherRemoval: 10000,
    gradation: 10000,
    french: 10000,
    magnet: 10000,
    pointArt: 20000,
    fullArt: 40000,
    parts1000included: 2,
    parts2000included: 2,
    parts3000included: 2,
    partsExcessPer: 1000,
    largeParts: 3000,
    repairPer: 5000,
    extension: 20000,
    overlay: 10000,
  },
  timeSettings: {
    baseHand: 60,
    gradation: 10,
    french: 15,
    magnet: 10,
    point: 15,
    fullArt: 40,
    repairPer: 10,
    parts: 5,
  },
};

interface AppStore {
  shopSettings: ShopSettings;

  setShopSettings: (settings: Partial<ShopSettings>) => Promise<{ success: boolean; error?: string }>;
  syncShopSettingsFromShop: (shop: Shop | null) => void;
  resetApp: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      shopSettings: { ...DEFAULT_SHOP_SETTINGS },

      setShopSettings: async (settings) => {
        const previous = get().shopSettings;
        const next = { ...previous, ...settings };

        set({ shopSettings: next });

        const shopId = useAuthStore.getState().currentShopId;
        if (shopId) {
          const result = await dbUpdateShopSettings(shopId, {
            addressDetail: next.shopAddressDetail,
            baseOffSameShop: next.baseOffSameShop,
            baseOffOtherShop: next.baseOffOtherShop,
            baseSolidPointPrice: next.baseSolidPointPrice,
            baseFullArtPrice: next.baseFullArtPrice,
            baseMonthlyArtPrice: next.baseMonthlyArtPrice,
            designerCount: next.designerCount,
            selectedServices: next.selectedServices,
            serviceStructure: next.serviceStructure,
            surcharges: next.surcharges,
            timeSettings: next.timeSettings,
            customerNotice: next.customerNotice,
            categoryPricing: next.categoryPricing,
            kakaoTalkUrl: next.kakaoTalkUrl || undefined,
            naverReservationUrl: next.naverReservationUrl || undefined,
            revisitMessageTemplate: next.revisitMessageTemplate || undefined,
          });

          if (!result.success) {
            set({ shopSettings: previous });
            return { success: false, error: result.error };
          }
        }

        return { success: true };
      },

      syncShopSettingsFromShop: (shop) => {
        if (!shop) {
          return;
        }

        const s = shop.settings;
        set((state) => ({
          shopSettings: {
            ...state.shopSettings,
            shopName: shop.name,
            shopPhone: shop.phone ?? '',
            shopAddress: shop.address ?? '',
            baseHandPrice: shop.baseHandPrice,
            baseFootPrice: shop.baseFootPrice,
            businessHours:
              shop.businessHours.length > 0
                ? shop.businessHours
                : state.shopSettings.businessHours,
            // DB settings 동기화 (값이 있을 때만 덮어씀)
            ...(s ? {
              shopAddressDetail: s.addressDetail ?? state.shopSettings.shopAddressDetail,
              baseOffSameShop: s.baseOffSameShop ?? state.shopSettings.baseOffSameShop,
              baseOffOtherShop: s.baseOffOtherShop ?? state.shopSettings.baseOffOtherShop,
              baseSolidPointPrice: s.baseSolidPointPrice ?? state.shopSettings.baseSolidPointPrice,
              baseFullArtPrice: s.baseFullArtPrice ?? state.shopSettings.baseFullArtPrice,
              baseMonthlyArtPrice: s.baseMonthlyArtPrice ?? state.shopSettings.baseMonthlyArtPrice,
              designerCount: s.designerCount ?? state.shopSettings.designerCount,
              selectedServices: s.selectedServices ?? state.shopSettings.selectedServices,
              serviceStructure: s.serviceStructure
                ? { ...state.shopSettings.serviceStructure, ...s.serviceStructure }
                : state.shopSettings.serviceStructure,
              surcharges: s.surcharges
                ? { ...state.shopSettings.surcharges, ...s.surcharges }
                : state.shopSettings.surcharges,
              timeSettings: s.timeSettings
                ? { ...state.shopSettings.timeSettings, ...s.timeSettings }
                : state.shopSettings.timeSettings,
              customerNotice: s.customerNotice ?? state.shopSettings.customerNotice,
              categoryPricing: s.categoryPricing
                ? { ...state.shopSettings.categoryPricing, ...s.categoryPricing }
                : state.shopSettings.categoryPricing,
              kakaoTalkUrl: s.kakaoTalkUrl ?? state.shopSettings.kakaoTalkUrl,
              naverReservationUrl: s.naverReservationUrl ?? state.shopSettings.naverReservationUrl,
              revisitMessageTemplate:
                s.revisitMessageTemplate ?? state.shopSettings.revisitMessageTemplate,
            } : {}),
          },
        }));
      },

      resetApp: () =>
        set({
          shopSettings: { ...DEFAULT_SHOP_SETTINGS },
        }),
    }),
    {
      name: 'bdx-app',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      ),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppStore> | undefined;
        if (!p) return current;
        return {
          ...current,
          ...p,
          shopSettings: {
            ...DEFAULT_SHOP_SETTINGS,
            ...(p.shopSettings ?? {}),
            selectedServices: p.shopSettings?.selectedServices ?? DEFAULT_SHOP_SETTINGS.selectedServices,
            businessHours: p.shopSettings?.businessHours ?? DEFAULT_SHOP_SETTINGS.businessHours,
            serviceStructure: {
              ...DEFAULT_SHOP_SETTINGS.serviceStructure,
              ...(p.shopSettings?.serviceStructure ?? {}),
            },
            surcharges: {
              ...DEFAULT_SHOP_SETTINGS.surcharges,
              ...(p.shopSettings?.surcharges ?? {}),
            },
            timeSettings: {
              ...DEFAULT_SHOP_SETTINGS.timeSettings,
              ...(p.shopSettings?.timeSettings ?? {}),
            },
            customerNotice: p.shopSettings?.customerNotice ?? DEFAULT_SHOP_SETTINGS.customerNotice,
            categoryPricing: {
              ...DEFAULT_CATEGORY_PRICING,
              ...(p.shopSettings?.categoryPricing ?? {}),
            },
            revisitMessageTemplate:
              p.shopSettings?.revisitMessageTemplate ?? DEFAULT_SHOP_SETTINGS.revisitMessageTemplate,
          },
        };
      },
    },
  ),
);
