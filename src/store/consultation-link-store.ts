'use client';

import { create } from 'zustand';
import {
  dbCreateConsultationLink,
  dbDeleteConsultationLink,
  dbUpdateConsultationLink,
  fetchConsultationLinksByShop,
} from '@/lib/db';
import type {
  ConsultationLink,
  ConsultationLinkStatus,
  CreateConsultationLinkInput,
} from '@/types/consultation-link';

interface ConsultationLinkState {
  links: ConsultationLink[];
  isHydrating: boolean;
  hydrateFromDB: (shopId: string) => Promise<void>;
  createLink: (input: CreateConsultationLinkInput) => Promise<{ success: boolean; link?: ConsultationLink; error?: string }>;
  updateLink: (
    id: string,
    shopId: string,
    patch: Partial<{
      title: string;
      description: string;
      designerId: string | null;
      styleCategory: string | null;
      validFrom: string;
      validUntil: string;
      estimatedDurationMin: number;
      slotIntervalMin: number;
      status: ConsultationLinkStatus;
    }>,
  ) => Promise<{ success: boolean; error?: string }>;
  removeLink: (id: string, shopId: string) => Promise<{ success: boolean; error?: string }>;
}

export const useConsultationLinkStore = create<ConsultationLinkState>((set, get) => ({
  links: [],
  isHydrating: false,

  hydrateFromDB: async (shopId) => {
    if (!shopId) return;
    set({ isHydrating: true });
    const links = await fetchConsultationLinksByShop(shopId);
    set({ links, isHydrating: false });
  },

  createLink: async (input) => {
    const result = await dbCreateConsultationLink(input);
    if (result.success && result.link) {
      set((s) => ({ links: [result.link!, ...s.links] }));
    }
    return result;
  },

  updateLink: async (id, shopId, patch) => {
    const result = await dbUpdateConsultationLink(id, shopId, patch);
    if (result.success) {
      set((s) => ({
        links: s.links.map((l) =>
          l.id === id
            ? {
                ...l,
                ...(patch.title !== undefined ? { title: patch.title || undefined } : {}),
                ...(patch.description !== undefined ? { description: patch.description || undefined } : {}),
                ...(patch.designerId !== undefined ? { designerId: patch.designerId ?? undefined } : {}),
                ...(patch.styleCategory !== undefined
                  ? { styleCategory: (patch.styleCategory as ConsultationLink['styleCategory']) ?? undefined }
                  : {}),
                ...(patch.validFrom !== undefined ? { validFrom: patch.validFrom } : {}),
                ...(patch.validUntil !== undefined ? { validUntil: patch.validUntil } : {}),
                ...(patch.estimatedDurationMin !== undefined ? { estimatedDurationMin: patch.estimatedDurationMin } : {}),
                ...(patch.slotIntervalMin !== undefined ? { slotIntervalMin: patch.slotIntervalMin } : {}),
                ...(patch.status !== undefined ? { status: patch.status } : {}),
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
      }));
    }
    return result;
  },

  removeLink: async (id, shopId) => {
    const result = await dbDeleteConsultationLink(id, shopId);
    if (result.success) {
      set((s) => ({ links: s.links.filter((l) => l.id !== id) }));
    }
    return result;
  },
}));

// 편의 getter
export function getActiveLinks(): ConsultationLink[] {
  return useConsultationLinkStore.getState().links.filter((l) => l.status === 'active');
}
