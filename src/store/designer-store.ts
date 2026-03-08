'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface DesignerStore {
  profileImages: Record<string, string>;
  setProfileImage: (designerId: string, base64: string) => void;
  removeProfileImage: (designerId: string) => void;
  getProfileImage: (designerId: string) => string | undefined;
}

export const useDesignerStore = create<DesignerStore>()(
  persist(
    (set, get) => ({
      profileImages: {},

      setProfileImage: (designerId, base64) =>
        set((state) => ({
          profileImages: { ...state.profileImages, [designerId]: base64 },
        })),

      removeProfileImage: (designerId) =>
        set((state) => {
          const { [designerId]: _removed, ...rest } = state.profileImages;
          return { profileImages: rest };
        }),

      getProfileImage: (designerId) => get().profileImages[designerId],
    }),
    {
      name: 'bdx-designers',
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
