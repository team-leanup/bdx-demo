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

const PBKDF2_SALT = 'bdx-pin-salt-v2';
const PBKDF2_ITERATIONS = 100000;

let _defaultHash: string | null = null;

async function hashPassword(password: string, designerId?: string): Promise<string> {
  const encoder = new TextEncoder();
  const saltStr = designerId ? `${PBKDF2_SALT}:${designerId}` : PBKDF2_SALT;
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(saltStr),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  return 'pbkdf2_' + hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
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
  switchToDesigner: (designerId: string, designerName: string, designerRole: 'owner' | 'staff') => void;
  setPassword: (designerId: string, newPassword: string) => Promise<void>;
  checkPassword: (designerId: string, password: string) => Promise<boolean>;
  resetInitFlag: () => void;
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
// signup/login이 진행 중임을 나타내는 플래그 — SupabaseProvider 의 onAuthStateChange
// 에서 setSession 직후 SIGNED_IN race 로 initializeAuth 가 재진입하면
// 아직 shop 이 생성되지 않은 상태에서 signOut 되는 버그 방지.
let _isAuthenticating = false;
export function isAuthenticatingNow(): boolean {
  return _isAuthenticating;
}

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
        // 데모 모드 쿠키 체크: Supabase 호출 전 최우선 확인
        // (getUser() 에러 경로에서도 데모 상태가 초기화되는 race condition 방지)
        if (typeof document !== 'undefined' && document.cookie.includes('bdx-demo=true')) {
          set({
            isInitialized: true,
            pendingGoogleSignup: null,
            role: 'owner',
            currentShopId: 'shop-demo',
            currentShopOnboardingComplete: true,
            activeDesignerId: '9a0ce791-7906-4476-811b-be48f7dee2c8',
            activeDesignerName: '데모 원장',
          });
          return;
        }

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
          // C2 fix: Supabase 세션 없으면 무조건 로그아웃 (localStorage 복구 금지)
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

        _isAuthenticating = true;
        try {
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
          _initDone = true;

          return { success: true };
        } finally {
          _isAuthenticating = false;
        }
      },

      loginWithGoogle: async (intent = 'login') => {
        if (!hasSupabaseEnv) {
          return { success: false, error: supabaseConfigErrorMessage };
        }

        const nextPath = intent === 'signup' ? '/signup' : '/login';
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=${encodeURIComponent(nextPath)}`,
            scopes: 'email profile',
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      },

      loginAsDemo: async () => {
        _isAuthenticating = true;
        try {
          // 항상 로컬 데모 모드로 즉시 진입 (Supabase 호출 없음)
          // middleware가 데모 세션을 인식하도록 쿠키 설정
          if (typeof document !== 'undefined') {
            document.cookie = 'bdx-demo=true;path=/;max-age=86400;SameSite=Strict;Secure';
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
          _initDone = true;

          return { success: true };
        } finally {
          _isAuthenticating = false;
        }
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

        _isAuthenticating = true;
        try {
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
          _initDone = true;

          return { success: true };
        } finally {
          _isAuthenticating = false;
        }
      },

      logout: async () => {
        _initDone = false;

        if (typeof document !== 'undefined') {
          document.cookie = 'bdx-demo=;path=/;max-age=0';
        }

        if (!hasSupabaseEnv) {
          ['bdx-customers','bdx-shop','bdx-records','bdx-reservations','bdx-portfolio','bdx-app','bdx-parts','bdx-shop-settings','bdx-pre-consult'].forEach(k => localStorage.removeItem(k));
          sessionStorage.removeItem('bdx-consultation');
          set({
            isInitialized: true,
            passwords: {},
            ...getLoggedOutState(),
          });
          return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('[auth] signOut error:', error);
        }

        ['bdx-customers','bdx-shop','bdx-records','bdx-reservations','bdx-portfolio','bdx-app','bdx-parts','bdx-shop-settings','bdx-pre-consult'].forEach(k => localStorage.removeItem(k));
        sessionStorage.removeItem('bdx-consultation');
        sessionStorage.removeItem('bdx-field-mode');

        set({
          isInitialized: true,
          pendingGoogleSignup: null,
          passwords: {},
          ...getLoggedOutState(),
        });
      },

      resetInitFlag: () => {
        _initDone = false;
        _initPromise = null;
      },

      switchToDesigner: (designerId, designerName, designerRole) =>
        set({
          activeDesignerId: designerId,
          activeDesignerName: designerName,
          role: designerRole,
        }),

      setPassword: async (designerId, newPassword) => {
        const hashed = await hashPassword(newPassword, designerId);
        set((state) => ({
          passwords: {
            ...state.passwords,
            [designerId]: hashed,
          },
        }));
      },

      checkPassword: async (designerId, password) => {
        const stored = get().passwords[designerId];
        const inputHash = await hashPassword(password, designerId);

        if (!stored) {
          if (!_defaultHash) {
            _defaultHash = await hashPassword('1234');
          }
          return inputHash === _defaultHash;
        }

        if (stored.startsWith('h_')) {
          return false;
        }

        return stored === inputHash;
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
        role: state.role,
        currentShopId: state.currentShopId,
        currentShopOnboardingComplete: state.currentShopOnboardingComplete,
        activeDesignerId: state.activeDesignerId,
        activeDesignerName: state.activeDesignerName,
      }),
    },
  ),
);
