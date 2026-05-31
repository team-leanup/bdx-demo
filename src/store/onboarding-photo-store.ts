'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StyleCategory } from '@/types/portfolio';

export interface OnboardingPhoto {
  id: string;
  dataUrl: string;
  category?: StyleCategory;
}

interface OnboardingPhotoStore {
  photos: OnboardingPhoto[];
  featuredIds: string[];
  pendingLogoDataUrl: string | null;
  setPhotos: (photos: OnboardingPhoto[]) => void;
  addPhotos: (newPhotos: OnboardingPhoto[]) => void;
  removePhoto: (id: string) => void;
  classifyPhoto: (id: string, category: StyleCategory) => void;
  setFeaturedIds: (ids: string[]) => void;
  setPendingLogoDataUrl: (dataUrl: string | null) => void;
  reset: () => void;
}

// 0529 이슈: 회원가입 onboarding에서 업로드한 사진이 commit 시점에 휘발돼 portfolio_photos가 비는 케이스 차단.
// sessionStorage로 persist — 탭 닫으면 자연스럽게 정리, 같은 탭에서 새로고침해도 유지.
export const useOnboardingPhotoStore = create<OnboardingPhotoStore>()(
  persist(
    (set) => ({
      photos: [],
      featuredIds: [],
      pendingLogoDataUrl: null,
      setPhotos: (photos) => set({ photos }),
      addPhotos: (newPhotos) =>
        set((s) => ({ photos: [...s.photos, ...newPhotos].slice(0, 20) })),
      removePhoto: (id) =>
        set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })),
      classifyPhoto: (id, category) =>
        set((s) => ({
          photos: s.photos.map((p) => (p.id === id ? { ...p, category } : p)),
        })),
      setFeaturedIds: (ids) => set({ featuredIds: ids }),
      setPendingLogoDataUrl: (dataUrl) => set({ pendingLogoDataUrl: dataUrl }),
      reset: () => set({ photos: [], featuredIds: [], pendingLogoDataUrl: null }),
    }),
    {
      name: 'bdx-onboarding-photos',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
