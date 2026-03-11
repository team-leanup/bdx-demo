'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { hasSupabaseEnv, supabase, supabaseConfigErrorMessage } from '@/lib/supabase';
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
  loginWithGoogle: (intent?: 'login' | 'signup') => Promise<{ success: boolean; error?: string }>;
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
  | 'role'
  | 'currentShopId'
  | 'currentShopOnboardingComplete'
  | 'activeDesignerId'
  | 'activeDesignerName'
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

let _initPromise: Promise<void> | null = null;
let _initDone = false;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      ...getLoggedOutState(),
      pendingGoogleSignup: null,
      passwords: {},

      initializeAuth: async () => {
        if (_initDone) return;
        if (_initPromise) return _initPromise;
        _initPromise = (async () => {
        if (!hasSupabaseEnv) {
          set({ isInitialized: true, ...getLoggedOutState() });
          return;
        }

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error('[auth] getSession error:', error);
          set({ isInitialized: true, ...getLoggedOutState() });
          return;
        }

        const userId = user?.id;
        if (!userId) {
          set({ isInitialized: true, pendingGoogleSignup: null, ...getLoggedOutState() });
          return;
        }

        let context = await resolveAuthContext(userId);
        if (!context) {
          const providers = user.app_metadata?.providers as string[] | undefined;
          const isGoogleUser = providers?.includes('google') ||
            user.app_metadata?.provider === 'google';
          if (isGoogleUser) {
            set({
              isInitialized: true,
              pendingGoogleSignup: {
                userId,
                email: user.email ?? '',
                ownerName: getGoogleOwnerName(user),
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
        })();
        try {
          await _initPromise;
        } finally {
          _initDone = true;
          _initPromise = null;
        }
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

      loginWithGoogle: async (intent = 'login') => {
        if (!hasSupabaseEnv) {
          return { success: false, error: supabaseConfigErrorMessage };
        }

        const nextPath = intent === 'signup' ? '/signup' : '/login';
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
            scopes: 'email profile',
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      },

      loginAsDemo: async () => {
        // 항상 로컬 데모 모드로 즉시 진입 (Supabase 호출 없음)
        // middleware가 데모 세션을 인식하도록 쿠키 설정
        if (typeof document !== 'undefined') {
          document.cookie = 'bdx-demo=true;path=/;max-age=86400';
        }

        set({
          isInitialized: true,
          pendingGoogleSignup: null,
          role: 'owner',
          currentShopId: 'shop-demo',
          currentShopOnboardingComplete: true,
          activeDesignerId: '9a0ce791-7906-4476-811b-be48f7dee2c8',
          activeDesignerName: '데모 원장',
        });

        return { success: true };
      },

      completePendingGoogleSignup: async ({ shopName, ownerName }) => {
        if (!hasSupabaseEnv) {
          return { success: false, error: supabaseConfigErrorMessage };
        }

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
          return { success: false, error: '이미 등록된 이메일입니다. 로그인을 이용해 주세요.' };
        }

        // Explicitly set session so auth.uid() is available for subsequent RPC calls.
        // @supabase/ssr cookie-based storage may not apply immediately after signUp.
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        const userId = data.user.id;

        const createdAccount = await dbCreateShopAccount(userId, shopName, ownerName);
        if (!createdAccount.success) {
          console.error('[auth] Shop creation failed for user:', userId, createdAccount.error);
          await supabase.auth.signOut();
          return { success: false, error: createdAccount.error ?? '샵 생성에 실패했습니다. 다시 시도해 주세요.' };
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
        // 데모 쿠키 제거
        if (typeof document !== 'undefined') {
          document.cookie = 'bdx-demo=;path=/;max-age=0';
        }

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
