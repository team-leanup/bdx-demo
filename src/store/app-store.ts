'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ServiceStructure, SurchargeSettings, TimeSettings, BusinessHours, Shop } from '@/types/shop';
import { dbUpdateShopSettings } from '@/lib/db';
import { useAuthStore } from '@/store/auth-store';

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
}

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
          },
        };
      },
    },
  ),
);
