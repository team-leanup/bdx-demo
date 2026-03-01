'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { UserRole } from '@/types/auth';
import { MOCK_DESIGNERS } from '@/data/mock-shop';

const SALT = 'bdx-salt';

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

function buildDefaultPasswords(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const designer of MOCK_DESIGNERS) {
    result[designer.id] = hashPassword('1234');
  }
  return result;
}

interface AuthStore {
  role: UserRole;
  activeDesignerId: string | null;
  activeDesignerName: string | null;
  passwords: Record<string, string>;

  login: (designerId: string, role: UserRole) => void;
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
      passwords: buildDefaultPasswords(),

      login: (designerId, role) => {
        const designer = MOCK_DESIGNERS.find((d) => d.id === designerId);
        set({
          role,
          activeDesignerId: designerId,
          activeDesignerName: designer?.name ?? null,
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
