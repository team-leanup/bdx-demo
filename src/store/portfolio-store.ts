'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PortfolioPhoto, PortfolioPhotoKind } from '@/types/portfolio';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';
import {
  fetchPortfolioPhotos,
  dbInsertPortfolioPhoto,
  dbDeletePortfolioPhoto,
  dbDeleteAllPortfolioPhotos,
  dbTogglePhotoVisibility,
  dbUpdatePhotoFeatured,
  dbUpdatePhotoMetadata,
} from '@/lib/db';
import { getNowInKoreaIso } from '@/lib/format';
import { DEMO_PORTFOLIO_PHOTOS } from '@/data/demo-portfolio';

const PORTFOLIO_STORAGE_KEY = 'bdx-portfolio';
let portfolioHydrationVersion = 0;

interface PortfolioNotice {
  type: 'success' | 'error' | 'info';
  message: string;
}

interface PortfolioStore {
  photos: PortfolioPhoto[];
  _dbReady: boolean;
  migrationNotice: PortfolioNotice | null;

  hydrateFromDB: () => Promise<void>;
  clearMigrationNotice: () => void;

  addPhoto: (
    photo: Omit<PortfolioPhoto, 'id' | 'createdAt' | 'shopId'>,
  ) => Promise<{ success: boolean; error?: string }>;
  removePhoto: (id: string) => Promise<{ success: boolean; error?: string }>;

  getByCustomerId: (customerId: string) => PortfolioPhoto[];
  getByRecordId: (recordId: string) => PortfolioPhoto[];
  getRecent: (limit?: number) => PortfolioPhoto[];
  getByKind: (kind: PortfolioPhotoKind) => PortfolioPhoto[];

  togglePhotoVisibility: (id: string) => void;
  toggleMenu: (id: string, price?: number) => Promise<{ success: boolean; error?: string }>;
  getMenuPhotos: () => PortfolioPhoto[];
  updatePhoto: (id: string, updates: Partial<PortfolioPhoto>) => void;
  /** DB 동기화 포함 메타데이터 업데이트 (시술종류/디자인타입/가격/메모/태그/컬러/촬영일/대표 등) */
  updatePhotoMetadata: (id: string, updates: Partial<PortfolioPhoto>) => Promise<{ success: boolean; error?: string }>;
  setPhotos: (photos: PortfolioPhoto[]) => void;

  // 카테고리 관리 — SSOT 는 shopSettings(customCategories / categoryLabels).
  // DB 동기화를 await 하고 결과를 반환해 실패를 호출부에서 처리한다.
  addCategory: (label: string) => Promise<{ success: boolean; error?: string }>;
  renameCategory: (key: string, label: string) => Promise<{ success: boolean; error?: string }>;
  removeCategory: (key: string) => Promise<{ success: boolean; error?: string }>;

  clearAll: () => Promise<{ success: boolean; error?: string }>;
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `photo-${crypto.randomUUID()}`;
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return 'photo-' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isPortfolioPhoto(value: unknown): value is PortfolioPhoto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'id' in value &&
    'customerId' in value &&
    'kind' in value &&
    'imageDataUrl' in value &&
    'shopId' in value &&
    typeof (value as Record<string, unknown>).shopId === 'string'
  );
}

function readLegacyPortfolioPhotos(): PortfolioPhoto[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as { state?: { photos?: unknown[] } };
    const photos = parsed.state?.photos ?? [];

    return photos
      .filter(isPortfolioPhoto)
      .filter((photo) => photo.imageDataUrl.startsWith('data:image/') || !!photo.imagePath);
  } catch (error) {
    console.error('[portfolio-store] readLegacyPortfolioPhotos error:', error);
    return [];
  }
}

function sortPortfolioPhotos(photos: PortfolioPhoto[]): PortfolioPhoto[] {
  return [...photos].sort((a, b) => {
    const left = new Date(b.takenAt ?? b.createdAt).getTime();
    const right = new Date(a.takenAt ?? a.createdAt).getTime();
    return left - right;
  });
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      photos: [],
      _dbReady: false,
      migrationNotice: null,

      hydrateFromDB: async () => {
        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId) {
          set({ photos: [], _dbReady: true, migrationNotice: null });
          return;
        }

        if (currentShopId === 'shop-demo') {
          // 데모 모드: 유저가 온보딩에서 업로드한 사진이 있으면 유지
          const current = get().photos;
          const hasUserPhotos = current.some((p) => p.customerId === 'onboarding');
          if (hasUserPhotos) {
            set({ _dbReady: true });
          } else {
            set({ photos: DEMO_PORTFOLIO_PHOTOS, _dbReady: true });
          }
          return;
        }

        const hydrationVersion = ++portfolioHydrationVersion;
        const legacyPhotos = readLegacyPortfolioPhotos().filter((p) => p.shopId === currentShopId);
        const remotePhotos = await fetchPortfolioPhotos(currentShopId);
        const remoteIds = new Set(remotePhotos.map((photo) => photo.id));

        if (legacyPhotos.length === 0) {
          set({ photos: sortPortfolioPhotos(remotePhotos), _dbReady: true });
          return;
        }

        const missingLegacyPhotos = legacyPhotos.filter((photo) => !remoteIds.has(photo.id));

        if (missingLegacyPhotos.length === 0) {
          set({ photos: sortPortfolioPhotos(remotePhotos), _dbReady: true });
          return;
        }

        const migratedPhotos: PortfolioPhoto[] = [];
        const failedPhotos: PortfolioPhoto[] = [];

        for (const photo of missingLegacyPhotos) {
          const result = await dbInsertPortfolioPhoto({
            ...photo,
            shopId: currentShopId,
          });

          if (hydrationVersion !== portfolioHydrationVersion) {
            if (result.success && result.photo) {
              await dbDeletePortfolioPhoto(result.photo);
            }
            return;
          }

          if (result.success && result.photo) {
            migratedPhotos.push(result.photo);
            continue;
          }

          failedPhotos.push(photo);
        }

        const mergedPhotos = sortPortfolioPhotos([
          ...remotePhotos,
          ...migratedPhotos,
          ...failedPhotos,
        ]);

        set({
          photos: mergedPhotos,
          _dbReady: true,
          migrationNotice:
            failedPhotos.length === 0
              ? {
                  type: 'success',
                  message: `기존 포트폴리오 ${migratedPhotos.length}장을 Supabase로 옮겼어요`,
                }
              : {
                  type: 'error',
                  message: `기존 포트폴리오 ${migratedPhotos.length}장은 옮겼고 ${failedPhotos.length}장은 다시 시도 필요해요`,
                },
        });
      },

      clearMigrationNotice: () => set({ migrationNotice: null }),

      addPhoto: async (input) => {
        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId) {
          return { success: false, error: '활성 샵 정보가 없습니다' };
        }

        const newPhoto: PortfolioPhoto = {
          ...input,
          id: generateId(),
          shopId: currentShopId,
          createdAt: getNowInKoreaIso(),
        };

        if (currentShopId === 'shop-demo') {
          set((state) => ({ photos: [newPhoto, ...state.photos] }));
          return { success: true };
        }

        const result = await dbInsertPortfolioPhoto(newPhoto);
        if (!result.success || !result.photo) {
          return { success: false, error: result.error };
        }

        set((state) => ({ photos: [result.photo!, ...state.photos.filter((photo) => photo.id !== result.photo!.id)] }));
        return { success: true };
      },

      removePhoto: async (id) => {
        const target = get().photos.find((photo) => photo.id === id);
        if (!target) {
          return { success: false, error: '삭제할 사진을 찾을 수 없습니다' };
        }

        const currentShopId = useAuthStore.getState().currentShopId;

        if (currentShopId === 'shop-demo') {
          set((state) => ({ photos: state.photos.filter((photo) => photo.id !== id) }));
          return { success: true };
        }

        const previousPhotos = get().photos;

        set((state) => ({
          photos: state.photos.filter((photo) => photo.id !== id),
        }));

        const result = await dbDeletePortfolioPhoto(target);
        if (!result.success) {
          set({ photos: previousPhotos });
          return { success: false, error: result.error };
        }

        return { success: true };
      },

      getByCustomerId: (customerId) => get().photos.filter((p) => p.customerId === customerId),

      getByRecordId: (recordId) => get().photos.filter((p) => p.recordId === recordId),

      getRecent: (limit = 20) => {
        const sorted = [...get().photos].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        return sorted.slice(0, limit);
      },

      getByKind: (kind) => get().photos.filter((p) => p.kind === kind),

      togglePhotoVisibility: (id) => {
        const currentShopId = useAuthStore.getState().currentShopId;
        const photo = get().photos.find((p) => p.id === id);
        if (!photo) return;
        const newIsPublic = !(photo.isPublic ?? true);
        set((state) => ({
          photos: state.photos.map((p) => (p.id === id ? { ...p, isPublic: newIsPublic } : p)),
        }));
        if (currentShopId && currentShopId !== 'shop-demo') {
          dbTogglePhotoVisibility(id, currentShopId, newIsPublic).catch(console.error);
        }
      },

      toggleMenu: async (id, price) => {
        const currentShopId = useAuthStore.getState().currentShopId;
        const current = get().photos.find((p) => p.id === id);
        if (!current) return { success: false, error: '사진을 찾을 수 없습니다' };
        const turningOn = !current.isFeatured;
        const updates: Partial<PortfolioPhoto> = turningOn
          ? { isFeatured: true, price }
          : { isFeatured: false, price: undefined };
        // optimistic update
        get().updatePhoto(id, updates);
        if (!currentShopId || currentShopId === 'shop-demo') {
          return { success: true };
        }
        const result = await dbUpdatePhotoFeatured(id, currentShopId, turningOn, turningOn ? price : undefined);
        if (!result.success) {
          // rollback
          get().updatePhoto(id, { isFeatured: current.isFeatured, price: current.price });
          return { success: false, error: result.error };
        }
        return { success: true };
      },

      getMenuPhotos: () => get().photos.filter((p) => p.isFeatured === true),

      updatePhoto: (id, updates) => {
        set((state) => ({
          photos: state.photos.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      updatePhotoMetadata: async (id, updates) => {
        const previous = get().photos.find((p) => p.id === id);
        if (!previous) {
          return { success: false, error: '사진을 찾을 수 없습니다' };
        }

        // optimistic update
        set((state) => ({
          photos: state.photos.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));

        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId || currentShopId === 'shop-demo') {
          return { success: true };
        }

        // NOTE: partsMemo는 낙관적 업데이트(위 set)로 store에 이미 반영됨.
        // db.ts의 dbUpdatePhotoMetadata updates 타입에 partsMemo가 추가되면
        // 아래 payload에 자동 전달되도록 별도 인자로 분리.
        const dbUpdates: Parameters<typeof dbUpdatePhotoMetadata>[2] = {
          styleCategory: updates.styleCategory ?? null,
          designType: updates.designType ?? null,
          serviceType: updates.serviceType ?? null,
          price: updates.price ?? null,
          note: updates.note ?? null,
          tags: updates.tags,
          colorLabels: updates.colorLabels,
          takenAt: updates.takenAt ?? null,
          isFeatured: updates.isFeatured,
          isStaffPick: updates.isStaffPick,
          isPopular: updates.isPopular,
          partsMemo: updates.partsMemo ?? null,
        };
        const result = await dbUpdatePhotoMetadata(id, currentShopId, dbUpdates);

        if (!result.success) {
          // rollback
          set((state) => ({
            photos: state.photos.map((p) => (p.id === id ? previous : p)),
          }));
        }

        return result;
      },

      setPhotos: (photos) => {
        set({ photos: sortPortfolioPhotos(photos) });
      },

      // 0530: 시술 종류 SSOT = shopSettings(customCategories / categoryLabels).
      // 포트폴리오 메뉴 카테고리는 별도 로컬 리스트를 두지 않고 shopSettings 에서 파생한다.
      // 추가/수정/삭제는 setShopSettings(DB) 를 await 하고 결과를 반환 — 실패 시 호출부에서 안내.
      // setShopSettings 가 이미 낙관적 업데이트 + 실패 롤백을 처리하므로 로컬 분리(divergence)가 없다.
      addCategory: async (label) => {
        const app = useAppStore.getState();
        const existing = app.shopSettings.customCategories ?? [];
        const key = `custom-${Date.now()}`;
        if (existing.some((c) => c.id === key)) return { success: true };
        return app.setShopSettings({
          customCategories: [...existing, { id: key, name: label, price: 0, time: 60, order: existing.length }],
        });
      },
      renameCategory: async (key, label) => {
        const app = useAppStore.getState();
        if (key.startsWith('custom-')) {
          const existing = app.shopSettings.customCategories ?? [];
          if (!existing.some((c) => c.id === key)) {
            return { success: false, error: '카테고리를 찾을 수 없습니다' };
          }
          return app.setShopSettings({
            customCategories: existing.map((c) => (c.id === key ? { ...c, name: label } : c)),
          });
        }
        // builtin 카테고리(simple/french/magnet/art) rename → shop categoryLabels 에 영속
        const existing = app.shopSettings.categoryLabels ?? {};
        return app.setShopSettings({ categoryLabels: { ...existing, [key]: label } });
      },
      removeCategory: async (key) => {
        // 해당 카테고리에 속한 사진들을 기본값 'simple'로 재할당 (orphan 방지)
        const orphanIds: string[] = get().photos
          .filter((p) => p.styleCategory === key)
          .map((p) => p.id);
        if (orphanIds.length > 0) {
          set((s) => ({
            photos: s.photos.map((p) =>
              p.styleCategory === key ? { ...p, styleCategory: 'simple' } : p,
            ),
          }));
          // 낙관적 업데이트 후 DB 동기화 (shop-demo 제외)
          const currentShopId = useAuthStore.getState().currentShopId;
          if (currentShopId && currentShopId !== 'shop-demo') {
            for (const id of orphanIds) {
              void dbUpdatePhotoMetadata(id, currentShopId, { styleCategory: 'simple' });
            }
          }
        }
        if (key.startsWith('custom-')) {
          const app = useAppStore.getState();
          const existing = app.shopSettings.customCategories ?? [];
          if (existing.some((c) => c.id === key)) {
            return app.setShopSettings({ customCategories: existing.filter((c) => c.id !== key) });
          }
        }
        return { success: true };
      },

      clearAll: async () => {
        const currentShopId = useAuthStore.getState().currentShopId;

        if (currentShopId === 'shop-demo') {
          set({ photos: [] });
          return { success: true };
        }

        portfolioHydrationVersion += 1;
        const currentPhotos = get().photos;
        set({ photos: [] });

        const result = await dbDeleteAllPortfolioPhotos(currentPhotos);
        if (!result.success) {
          set({ photos: currentPhotos });
          return { success: false, error: result.error };
        }

        return { success: true };
      },
    }),
    {
      name: 'bdx-portfolio',
      version: 1,
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
      partialize: (state) => ({
        ...state,
        photos: state.photos.map((p) => ({
          ...p,
          imageDataUrl: p.imagePath ? '' : p.imageDataUrl,
        })),
      }),
    },
  ),
);

export default usePortfolioStore;
