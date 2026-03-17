'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PortfolioPhoto, PortfolioPhotoKind } from '@/types/portfolio';
import { useAuthStore } from '@/store/auth-store';
import {
  fetchPortfolioPhotos,
  dbInsertPortfolioPhoto,
  dbUpdatePortfolioPhoto,
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
  updatePhoto: (
    id: string,
    updates: Partial<Omit<PortfolioPhoto, 'id' | 'createdAt' | 'shopId' | 'imageDataUrl' | 'imagePath'>>,
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

  return 'id' in value && 'kind' in value && 'imageDataUrl' in value;
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

const DEMO_PORTFOLIO_PHOTOS: PortfolioPhoto[] = [
  {
    id: 'demo-photo-1',
    shopId: 'shop-demo',
    customerId: 'demo-customer-1',
    kind: 'treatment',
    createdAt: '2026-02-15T10:30:00+09:00',
    takenAt: '2026-02-15T10:30:00+09:00',
    imageDataUrl: '',
    tags: ['글리터', '파스텔'],
    colorLabels: ['핑크', '실버'],
    designType: '글리터 그라데이션',
    serviceType: '풀아트',
    price: 95000,
    note: '봄 웨딩 시즌 디자인',
  },
  {
    id: 'demo-photo-2',
    shopId: 'shop-demo',
    customerId: 'demo-customer-2',
    kind: 'treatment',
    createdAt: '2026-02-10T14:00:00+09:00',
    takenAt: '2026-02-10T14:00:00+09:00',
    imageDataUrl: '',
    tags: ['프렌치', '심플'],
    colorLabels: ['화이트', '누드'],
    designType: '프렌치 팁',
    serviceType: '원컬러',
    price: 55000,
    note: '깔끔한 오피스 네일',
  },
  {
    id: 'demo-photo-3',
    shopId: 'shop-demo',
    customerId: 'demo-customer-1',
    kind: 'reference',
    createdAt: '2026-02-08T11:00:00+09:00',
    takenAt: '2026-02-08T11:00:00+09:00',
    imageDataUrl: '',
    tags: ['플라워', '봄'],
    colorLabels: ['핑크', '그린'],
    designType: '플라워 아트',
    serviceType: '풀아트',
    price: 110000,
  },
  {
    id: 'demo-photo-4',
    shopId: 'shop-demo',
    customerId: 'demo-customer-3',
    kind: 'treatment',
    createdAt: '2026-01-28T16:00:00+09:00',
    takenAt: '2026-01-28T16:00:00+09:00',
    imageDataUrl: '',
    tags: ['캐릭터', '트렌디'],
    colorLabels: ['블루', '옐로'],
    designType: '캐릭터 아트',
    serviceType: '풀아트',
    price: 120000,
    note: '인기 캐릭터 디자인',
  },
  {
    id: 'demo-photo-5',
    shopId: 'shop-demo',
    customerId: 'demo-customer-2',
    kind: 'treatment',
    createdAt: '2026-01-20T13:30:00+09:00',
    takenAt: '2026-01-20T13:30:00+09:00',
    imageDataUrl: '',
    tags: ['그라데이션', '심플'],
    colorLabels: ['레드', '와인'],
    designType: '그라데이션',
    serviceType: '단색+포인트',
    price: 70000,
  },
  {
    id: 'demo-photo-6',
    shopId: 'shop-demo',
    customerId: 'demo-customer-4',
    kind: 'reference',
    createdAt: '2026-01-15T09:00:00+09:00',
    takenAt: '2026-01-15T09:00:00+09:00',
    imageDataUrl: '',
    tags: ['마블', '고급'],
    colorLabels: ['블랙', '골드'],
    designType: '마블 아트',
    serviceType: '풀아트',
    price: 130000,
    note: '고급스러운 마블 패턴',
  },
  {
    id: 'demo-photo-7',
    shopId: 'shop-demo',
    customerId: 'demo-customer-3',
    kind: 'treatment',
    createdAt: '2026-01-10T15:00:00+09:00',
    takenAt: '2026-01-10T15:00:00+09:00',
    imageDataUrl: '',
    tags: ['젤리', '투명'],
    colorLabels: ['투명', '핑크'],
    designType: '젤리 네일',
    serviceType: '이달의 아트',
    price: 85000,
  },
  {
    id: 'demo-photo-8',
    shopId: 'shop-demo',
    customerId: 'demo-customer-4',
    kind: 'treatment',
    createdAt: '2026-01-05T11:30:00+09:00',
    takenAt: '2026-01-05T11:30:00+09:00',
    imageDataUrl: '',
    tags: ['미러', '메탈릭'],
    colorLabels: ['실버', '크롬'],
    designType: '미러 네일',
    serviceType: '단색+포인트',
    price: 75000,
    note: '트렌디한 미러 효과',
  },
];

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
          // localStorage에 사진이 없으면 데모 데이터 주입
          if (get().photos.length === 0) {
            set({ photos: DEMO_PORTFOLIO_PHOTOS, _dbReady: true });
          } else {
            set({ _dbReady: true });
          }
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

      updatePhoto: async (id, updates) => {
        const currentShopId = useAuthStore.getState().currentShopId;
        if (!currentShopId) {
          return { success: false, error: '활성 샵 정보가 없습니다' };
        }

        if (currentShopId === 'shop-demo') {
          set((state) => ({
            photos: state.photos.map((photo) =>
              photo.id === id ? { ...photo, ...updates } : photo,
            ),
          }));
          return { success: true };
        }

        const dbUpdates: Parameters<typeof dbUpdatePortfolioPhoto>[2] = {};
        if ('customerId' in updates) dbUpdates.customer_id = updates.customerId ?? null;
        if ('recordId' in updates) dbUpdates.record_id = updates.recordId ?? null;
        if ('kind' in updates && updates.kind !== undefined) dbUpdates.kind = updates.kind;
        if ('takenAt' in updates) dbUpdates.taken_at = updates.takenAt ?? null;
        if ('note' in updates) dbUpdates.note = updates.note ?? null;
        if ('tags' in updates) dbUpdates.tags = (updates.tags ?? null) as import('@/types/database').Json | null;
        if ('colorLabels' in updates) dbUpdates.color_labels = (updates.colorLabels ?? null) as import('@/types/database').Json | null;
        if ('designType' in updates) dbUpdates.design_type = updates.designType ?? null;
        if ('serviceType' in updates) dbUpdates.service_type = updates.serviceType ?? null;
        if ('price' in updates) dbUpdates.price = updates.price ?? null;

        const result = await dbUpdatePortfolioPhoto(id, currentShopId, dbUpdates);
        if (!result.success) {
          return { success: false, error: result.error };
        }

        set((state) => ({
          photos: state.photos.map((photo) =>
            photo.id === id ? { ...photo, ...updates } : photo,
          ),
        }));
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
