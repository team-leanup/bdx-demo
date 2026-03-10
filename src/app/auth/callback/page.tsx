'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export default function AuthCallbackPage(): React.ReactElement {
  const router = useRouter();

  useEffect(() => {
    async function handleOAuthCallback(): Promise<void> {
      // 1. URL에 code 파라미터가 있으면 PKCE 코드 교환
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // 2. Supabase SDK가 hash/code에서 세션을 파싱할 때까지 대기
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/login?error=auth_failed');
        return;
      }

      // 3. 세션 확인 후 auth store 초기화
      await useAuthStore.getState().initializeAuth();

      // 4. 초기화 완료 후 상태 기반 라우팅
      const state = useAuthStore.getState();
      if (state.isLoggedIn()) {
        router.replace(state.currentShopOnboardingComplete ? '/home' : '/onboarding');
      } else if (state.pendingGoogleSignup) {
        router.replace('/signup/google');
      } else {
        router.replace('/login?error=auth_failed');
      }
    }

    void handleOAuthCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        <p className="text-sm text-slate-500">로그인 처리 중...</p>
      </div>
    </div>
  );
}
