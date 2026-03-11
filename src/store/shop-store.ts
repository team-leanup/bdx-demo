'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Shop, Designer } from '@/types/shop';
import {
  fetchShop,
  fetchDesigners,
  dbUpsertShop,
  dbCreateDesigner,
  dbUpdateDesigner,
  dbDeleteDesigner,
  dbUploadDesignerProfileImage,
  dbDeleteDesignerProfileImage,
} from '@/lib/db';
import { useAuthStore } from '@/store/auth-store';
import { getNowInKoreaIso } from '@/lib/format';

interface ShopStore {
  shop: Shop | null;
  designers: Designer[];
  _dbReady: boolean;

  hydrateFromDB: () => Promise<void>;
  updateShop: (updates: Partial<Shop>) => Promise<{ success: boolean; error?: string }>;
  createDesigner: (payload: { name: string; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  updateDesigner: (designerId: string, updates: { name?: string; phone?: string; isActive?: boolean }) => Promise<{ success: boolean; error?: string }>;
  deleteDesigner: (designerId: string) => Promise<{ success: boolean; error?: string }>;
  uploadDesignerProfileImage: (designerId: string, imageDataUrl: string) => Promise<{ success: boolean; error?: string }>;
  deleteDesignerProfileImage: (designerId: string) => Promise<{ success: boolean; error?: string }>;
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

        const isDemo = currentShopId === 'demo-shop';
        if (isDemo) {
          const { MOCK_SHOP, MOCK_DESIGNERS } = await import('@/data/mock-shop');
          set({
            shop: { ...MOCK_SHOP, id: 'demo-shop', ownerId: 'demo-designer' },
            designers: MOCK_DESIGNERS.map((d) => ({ ...d, shopId: 'demo-shop' })),
            _dbReady: true,
          });
          return;
        }

        const [shop, designers] = await Promise.all([
          fetchShop(currentShopId),
          fetchDesigners(currentShopId),
        ]);
        set({ shop, designers, _dbReady: true });
      },

      updateShop: async (updates) => {
        const current = get().shop;
        if (!current) {
          return { success: false, error: '현재 샵 정보를 찾을 수 없습니다.' };
        }

      const updated = { ...current, ...updates, updatedAt: getNowInKoreaIso() };
        set({ shop: updated });
        const result = await dbUpsertShop(updated);

        if (!result.success) {
          set({ shop: current });
          return { success: false, error: result.error };
        }

        return { success: true };
      },

      createDesigner: async (payload) => {
        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId) {
          return { success: false, error: '현재 샵 정보를 찾을 수 없습니다.' };
        }

        const result = await dbCreateDesigner(currentShopId, payload);
        if (!result.success || !result.designer) {
          return { success: false, error: result.error };
        }

        set((state) => ({ designers: [...state.designers, result.designer!] }));
        return { success: true };
      },

      updateDesigner: async (designerId, updates) => {
        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId) {
          return { success: false, error: '현재 샵 정보를 찾을 수 없습니다.' };
        }

        const result = await dbUpdateDesigner(currentShopId, designerId, updates);
        if (!result.success || !result.designer) {
          return { success: false, error: result.error };
        }

        set((state) => ({
          designers: state.designers.map((designer) =>
            designer.id === designerId ? result.designer! : designer,
          ),
        }));

        return { success: true };
      },

      deleteDesigner: async (designerId) => {
        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId) {
          return { success: false, error: '현재 샵 정보를 찾을 수 없습니다.' };
        }

        const result = await dbDeleteDesigner(currentShopId, designerId);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        set((state) => ({ designers: state.designers.filter((designer) => designer.id !== designerId) }));
        return { success: true };
      },

      uploadDesignerProfileImage: async (designerId, imageDataUrl) => {
        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId) {
          return { success: false, error: '현재 샵 정보를 찾을 수 없습니다.' };
        }

        const result = await dbUploadDesignerProfileImage(currentShopId, designerId, imageDataUrl);
        if (!result.success || !result.designer) {
          return { success: false, error: result.error };
        }

        set((state) => ({
          designers: state.designers.map((designer) =>
            designer.id === designerId ? result.designer! : designer,
          ),
        }));

        return { success: true };
      },

      deleteDesignerProfileImage: async (designerId) => {
        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId) {
          return { success: false, error: '현재 샵 정보를 찾을 수 없습니다.' };
        }

        const result = await dbDeleteDesignerProfileImage(currentShopId, designerId);
        if (!result.success || !result.designer) {
          return { success: false, error: result.error };
        }

        set((state) => ({
          designers: state.designers.map((designer) =>
            designer.id === designerId ? result.designer! : designer,
          ),
        }));

        return { success: true };
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
