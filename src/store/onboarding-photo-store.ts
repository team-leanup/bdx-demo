'use client';

import { create } from 'zustand';
import type { StyleCategory } from '@/types/portfolio';

export interface OnboardingPhoto {
  id: string;
  dataUrl: string;
  category?: StyleCategory;
}

interface OnboardingPhotoStore {
  photos: OnboardingPhoto[];
  featuredIds: string[];
  setPhotos: (photos: OnboardingPhoto[]) => void;
  addPhotos: (newPhotos: OnboardingPhoto[]) => void;
  removePhoto: (id: string) => void;
  classifyPhoto: (id: string, category: StyleCategory) => void;
  setFeaturedIds: (ids: string[]) => void;
  reset: () => void;
}

export const useOnboardingPhotoStore = create<OnboardingPhotoStore>((set) => ({
  photos: [],
  featuredIds: [],
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
  reset: () => set({ photos: [], featuredIds: [] }),
}));
