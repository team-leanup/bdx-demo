'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserRole } from '@/types/auth';

const SALT = 'bdx-salt';
const DEFAULT_PASSWORD_HASH = (() => {
  let hash = 0;
  const str = '1234' + SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
})();

function hashPassword(password: string): string {
  let hash = 0;
  const str = password + SALT;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36);
}

interface AuthStore {
  role: UserRole;
  activeDesignerId: string | null;
  activeDesignerName: string | null;
  passwords: Record<string, string>;

  login: (designerId: string, role: UserRole, designerName?: string) => void;
  logout: () => void;
  setPassword: (designerId: string, newPassword: string) => void;
  checkPassword: (designerId: string, password: string) => boolean;
  isOwner: () => boolean;
  isStaff: () => boolean;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      role: null,
      activeDesignerId: null,
      activeDesignerName: null,
      passwords: {},

      login: (designerId, role, designerName) => {
        set({
          role,
          activeDesignerId: designerId,
          activeDesignerName: designerName ?? null,
        });
      },

      logout: () =>
        set({
          role: null,
          activeDesignerId: null,
          activeDesignerName: null,
        }),

      setPassword: (designerId, newPassword) =>
        set((state) => ({
          passwords: {
            ...state.passwords,
            [designerId]: hashPassword(newPassword),
          },
        })),

      checkPassword: (designerId, password) => {
        const stored = get().passwords[designerId];
        if (!stored) {
          return hashPassword(password) === DEFAULT_PASSWORD_HASH;
        }
        return stored === hashPassword(password);
      },

      isOwner: () => get().role === 'owner',
      isStaff: () => get().role === 'staff',
      isLoggedIn: () => get().role !== null,
    }),
    {
      name: 'bdx-auth',
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
