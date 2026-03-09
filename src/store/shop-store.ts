'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Shop, Designer } from '@/types/shop';
import { fetchShop, fetchDesigners, dbUpsertShop } from '@/lib/db';
import { useAuthStore } from '@/store/auth-store';

interface ShopStore {
  shop: Shop | null;
  designers: Designer[];
  _dbReady: boolean;

  hydrateFromDB: () => Promise<void>;
  updateShop: (updates: Partial<Shop>) => void;
  getDesignerById: (id: string) => Designer | undefined;
  getDesignerName: (id: string) => string;
  getActiveDesigners: () => Designer[];
}

export const useShopStore = create<ShopStore>()(
  persist(
    (set, get) => ({
      shop: null,
      designers: [],
      _dbReady: false,

      hydrateFromDB: async () => {
        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId) {
          set({ shop: null, designers: [], _dbReady: true });
          return;
        }

        const [shop, designers] = await Promise.all([
          fetchShop(currentShopId),
          fetchDesigners(currentShopId),
        ]);
        set({ shop, designers, _dbReady: true });
      },

      updateShop: (updates) => {
        const current = get().shop;
        if (!current) return;
        const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
        set({ shop: updated });
        dbUpsertShop(updated).catch(console.error);
      },

      getDesignerById: (id) => get().designers.find((d) => d.id === id),
      getDesignerName: (id) => get().designers.find((d) => d.id === id)?.name ?? '미정',
      getActiveDesigners: () => get().designers.filter((d) => d.isActive),
    }),
    {
      name: 'bdx-shop',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      merge: (persisted, current) => {
        const p = persisted as Partial<ShopStore> | undefined;
        if (!p) return current;
        return { ...current, ...p } as ShopStore;
      },
    },
  ),
);
