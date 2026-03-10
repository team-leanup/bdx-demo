'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { hasSupabaseEnv, supabase, supabaseConfigErrorMessage } from '@/lib/supabase';
import { DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD } from '@/lib/demo-account';
import {
  dbCreateShopAccount,
  fetchDesignerById,
  fetchShopByOwnerId,
} from '@/lib/db';
import type { UserRole } from '@/types/auth';

const SALT = 'bdx-salt';
const DEFAULT_PASSWORD_HASH = (() => {
  let hash = 0;
  const str = '1234' + SALT;
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(36)}`;
})();

function hashPassword(password: string): string {
  let hash = 0;
  const str = password + SALT;
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(36)}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

interface PendingGoogleSignup {
  userId: string;
  email: string;
  ownerName: string;
}

interface AuthStore {
  isInitialized: boolean;
  role: UserRole;
  currentShopId: string | null;
  currentShopOnboardingComplete: boolean;
  activeDesignerId: string | null;
  activeDesignerName: string | null;
  pendingGoogleSignup: PendingGoogleSignup | null;
  passwords: Record<string, string>;

  initializeAuth: () => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => Promise<{ success: boolean; error?: string }>;
  completePendingGoogleSignup: (payload: { shopName: string; ownerName: string }) => Promise<{ success: boolean; error?: string }>;
  signupShopAccount: (payload: {
    shopName: string;
    ownerName: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setPassword: (designerId: string, newPassword: string) => void;
  checkPassword: (designerId: string, password: string) => boolean;
  setCurrentShopOnboardingComplete: (complete: boolean) => void;
  isOwner: () => boolean;
  isStaff: () => boolean;
  isLoggedIn: () => boolean;
}

interface ResolvedAuthContext {
  role: UserRole;
  currentShopId: string;
  currentShopOnboardingComplete: boolean;
  activeDesignerId: string;
  activeDesignerName: string;
}

async function resolveAuthContext(userId: string): Promise<ResolvedAuthContext | null> {
  const shop = await fetchShopByOwnerId(userId);
  if (!shop) {
    return null;
  }

  const ownerDesigner = await fetchDesignerById(userId);
  const activeDesignerId = ownerDesigner?.id ?? userId;
  const activeDesignerName = ownerDesigner?.name ?? '원장';

  return {
    role: 'owner',
    currentShopId: shop.id,
    currentShopOnboardingComplete: Boolean(shop.onboardingCompletedAt),
    activeDesignerId,
    activeDesignerName,
  };
}

function getLoggedOutState(): Pick<
  AuthStore,
  'role' | 'currentShopId' | 'currentShopOnboardingComplete' | 'activeDesignerId' | 'activeDesignerName'
> {
  return {
    role: null,
    currentShopId: null,
    currentShopOnboardingComplete: false,
    activeDesignerId: null,
    activeDesignerName: null,
  };
}

function getGoogleOwnerName(user: { user_metadata?: Record<string, unknown> } | null): string {
  const fullName = user?.user_metadata?.full_name;
  if (typeof fullName === 'string' && fullName.trim()) {
    return fullName.trim();
  }

  const name = user?.user_metadata?.name;
  if (typeof name === 'string' && name.trim()) {
    return name.trim();
  }

  return '';
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      ...getLoggedOutState(),
      pendingGoogleSignup: null,
      passwords: {},

      initializeAuth: async () => {
        if (!hasSupabaseEnv) {
          set({ isInitialized: true, ...getLoggedOutState() });
          return;
        }

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('[auth] getSession error:', error);
          set({ isInitialized: true, ...getLoggedOutState() });
          return;
        }

        const userId = session?.user?.id;
        if (!userId) {
          set({ isInitialized: true, pendingGoogleSignup: null, ...getLoggedOutState() });
          return;
        }

        let context = await resolveAuthContext(userId);
        if (!context) {
          if (session.user.app_metadata.provider === 'google') {
            set({
              isInitialized: true,
              pendingGoogleSignup: {
                userId,
                email: session.user.email ?? '',
                ownerName: getGoogleOwnerName(session.user),
              },
              ...getLoggedOutState(),
            });
            return;
          }
        }

        if (!context) {
          await supabase.auth.signOut();
          set({ isInitialized: true, pendingGoogleSignup: null, ...getLoggedOutState() });
          return;
        }

        set({
          isInitialized: true,
          pendingGoogleSignup: null,
          ...context,
        });
      },

      loginWithPassword: async (email, password) => {
        if (!hasSupabaseEnv) {
          return { success: false, error: supabaseConfigErrorMessage };
        }

        const normalizedEmail = normalizeEmail(email);
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error || !data.user) {
          return { success: false, error: error?.message ?? '로그인에 실패했습니다.' };
        }

        const context = await resolveAuthContext(data.user.id);
        if (!context) {
          await supabase.auth.signOut();
          return { success: false, error: '이 계정에 연결된 샵을 찾을 수 없습니다.' };
        }

        set({
          isInitialized: true,
          pendingGoogleSignup: null,
          ...context,
        });

        return { success: true };
      },

      loginWithGoogle: async () => {
        if (!hasSupabaseEnv) {
          return { success: false, error: supabaseConfigErrorMessage };
        }

        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=/login`,
            scopes: 'email profile',
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      },

      loginAsDemo: async () => get().loginWithPassword(DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD),

      completePendingGoogleSignup: async ({ shopName, ownerName }) => {
        const pendingGoogleSignup = get().pendingGoogleSignup;
        if (!pendingGoogleSignup) {
          return { success: false, error: 'Google 회원가입 세션을 찾을 수 없습니다.' };
        }

        const createdAccount = await dbCreateShopAccount(
          pendingGoogleSignup.userId,
          shopName,
          ownerName,
        );

        if (!createdAccount.success) {
          return { success: false, error: createdAccount.error ?? '샵 생성에 실패했습니다.' };
        }

        set({
          isInitialized: true,
          pendingGoogleSignup: null,
          role: 'owner',
          currentShopId: createdAccount.shop!.id,
          currentShopOnboardingComplete: false,
          activeDesignerId: createdAccount.owner!.id,
          activeDesignerName: createdAccount.owner!.name,
        });

        return { success: true };
      },

      signupShopAccount: async ({ shopName, ownerName, email, password }) => {
        if (!hasSupabaseEnv) {
          return { success: false, error: supabaseConfigErrorMessage };
        }

        const normalizedEmail = normalizeEmail(email);
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              shop_name: shopName,
              owner_name: ownerName,
            },
          },
        });

        if (error || !data.user) {
          return { success: false, error: error?.message ?? '회원가입에 실패했습니다.' };
        }

        if (!data.session) {
          return { success: false, error: '이메일 인증 후 다시 로그인해 주세요.' };
        }

        const createdAccount = await dbCreateShopAccount(data.user.id, shopName, ownerName);
        if (!createdAccount.success) {
          await supabase.auth.signOut();
          return { success: false, error: createdAccount.error ?? '샵 생성에 실패했습니다.' };
        }

        set({
          isInitialized: true,
          pendingGoogleSignup: null,
          role: 'owner',
          currentShopId: createdAccount.shop!.id,
          currentShopOnboardingComplete: false,
          activeDesignerId: createdAccount.owner!.id,
          activeDesignerName: createdAccount.owner!.name,
        });

        return { success: true };
      },

      logout: async () => {
        if (!hasSupabaseEnv) {
          set({
            isInitialized: true,
            ...getLoggedOutState(),
          });
          return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('[auth] signOut error:', error);
        }

        set({
          isInitialized: true,
          pendingGoogleSignup: null,
          ...getLoggedOutState(),
        });
      },

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

      setCurrentShopOnboardingComplete: (complete) =>
        set({ currentShopOnboardingComplete: complete }),

      isOwner: () => get().role === 'owner',
      isStaff: () => get().role === 'staff',
      isLoggedIn: () => get().role !== null && get().currentShopId !== null,
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
      partialize: (state) => ({
        passwords: state.passwords,
      }),
    },
  ),
);
