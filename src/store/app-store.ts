'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ServiceStructure, SurchargeSettings, TimeSettings, BusinessHours, Shop } from '@/types/shop';

interface ShopSettings {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopAddressDetail: string;
  baseHandPrice: number;
  baseFootPrice: number;
  baseOffSameShop: number;
  baseOffOtherShop: number;
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
  isOnboardingComplete: boolean;
  shopSettings: ShopSettings;

  setOnboardingComplete: (complete: boolean) => void;
  setShopSettings: (settings: Partial<ShopSettings>) => void;
  syncShopSettingsFromShop: (shop: Shop | null) => void;
  resetApp: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      isOnboardingComplete: false,
      shopSettings: { ...DEFAULT_SHOP_SETTINGS },

      setOnboardingComplete: (complete) =>
        set({ isOnboardingComplete: complete }),

      setShopSettings: (settings) =>
        set((state) => ({
          shopSettings: { ...state.shopSettings, ...settings },
        })),

      syncShopSettingsFromShop: (shop) => {
        if (!shop) {
          return;
        }

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
          },
        }));
      },

      resetApp: () =>
        set({
          isOnboardingComplete: false,
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
