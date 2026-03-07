'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PortfolioPhoto, PortfolioPhotoKind } from '@/types/portfolio';
import {
  PORTFOLIO_MAX_PHOTOS,
  estimatePortfolioSize,
  PORTFOLIO_MAX_BYTES,
} from '@/lib/storage-budget';

interface PortfolioStore {
  photos: PortfolioPhoto[];

  addPhoto: (
    photo: Omit<PortfolioPhoto, 'id' | 'createdAt'>,
  ) => { success: boolean; error?: string; evicted?: number };
  removePhoto: (id: string) => void;

  getByCustomerId: (customerId: string) => PortfolioPhoto[];
  getByRecordId: (recordId: string) => PortfolioPhoto[];
  getRecent: (limit?: number) => PortfolioPhoto[];
  getByKind: (kind: PortfolioPhotoKind) => PortfolioPhoto[];

  clearAll: () => void;
}

function generateId(): string {
  return `photo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      photos: [],

      addPhoto: (input) => {
        const photos = get().photos;

        // Estimate new photo size
        const idx = input.imageDataUrl.indexOf(',');
        const data = idx >= 0 ? input.imageDataUrl.slice(idx + 1) : input.imageDataUrl;
        const newPhotoSize = Math.ceil((data.length * 3) / 4);

        // Check limits and evict if needed
        let evicted = 0;
        let currentPhotos = [...photos];

        // Check count limit
        if (currentPhotos.length >= PORTFOLIO_MAX_PHOTOS) {
          // Evict oldest
          const sorted = currentPhotos.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
          currentPhotos = sorted.slice(1);
          evicted = 1;
        }

        // Check size limit
        const currentSize = estimatePortfolioSize(currentPhotos);
        if (currentSize + newPhotoSize > PORTFOLIO_MAX_BYTES) {
          // Evict oldest until we have room
          const sorted = currentPhotos.sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );

          let sizeToFree = currentSize + newPhotoSize - PORTFOLIO_MAX_BYTES;
          while (sizeToFree > 0 && sorted.length > 0) {
            const oldest = sorted.shift()!;
            const oldestIdx = oldest.imageDataUrl.indexOf(',');
            const oldestData =
              oldestIdx >= 0 ? oldest.imageDataUrl.slice(oldestIdx + 1) : oldest.imageDataUrl;
            const oldestSize = Math.ceil((oldestData.length * 3) / 4);
            sizeToFree -= oldestSize;
            evicted++;
          }
          currentPhotos = sorted;
        }

        const newPhoto: PortfolioPhoto = {
          ...input,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        try {
          set({ photos: [...currentPhotos, newPhoto] });
          return { success: true, evicted };
        } catch (e) {
          if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            return {
              success: false,
              error: '저장 공간이 부족합니다. 설정에서 데이터를 정리해주세요.',
            };
          }
          return { success: false, error: '저장 실패' };
        }
      },

      removePhoto: (id) =>
        set((state) => ({
          photos: state.photos.filter((p) => p.id !== id),
        })),

      getByCustomerId: (customerId) => get().photos.filter((p) => p.customerId === customerId),

      getByRecordId: (recordId) => get().photos.filter((p) => p.recordId === recordId),

      getRecent: (limit = 20) => {
        const sorted = [...get().photos].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        return sorted.slice(0, limit);
      },

      getByKind: (kind) => get().photos.filter((p) => p.kind === kind),

      clearAll: () => set({ photos: [] }),
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
    },
  ),
);

export default usePortfolioStore;
