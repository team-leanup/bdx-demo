'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PortfolioPhoto, PortfolioPhotoKind } from '@/types/portfolio';
import { useAuthStore } from '@/store/auth-store';
import {
  fetchPortfolioPhotos,
  dbInsertPortfolioPhoto,
  dbDeletePortfolioPhoto,
  dbDeleteAllPortfolioPhotos,
} from '@/lib/db';
import { getNowInKoreaIso } from '@/lib/format';

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

  clearAll: () => Promise<{ success: boolean; error?: string }>;
}

function generateId(): string {
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isPortfolioPhoto(value: unknown): value is PortfolioPhoto {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return 'id' in value && 'customerId' in value && 'kind' in value && 'imageDataUrl' in value;
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
      .filter((photo) => photo.imageDataUrl.startsWith('data:image/'));
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


        const hydrationVersion = ++portfolioHydrationVersion;
        const legacyPhotos = readLegacyPortfolioPhotos();
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

      clearAll: async () => {
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
        photos: state.photos.map((p) => ({ ...p, imageDataUrl: '' })),
      }),
    },
  ),
);

export default usePortfolioStore;
