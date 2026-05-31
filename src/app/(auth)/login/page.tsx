'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';

function EyeIcon({ open }: { open: boolean }): React.ReactElement {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  env_missing: 'Google 로그인 설정이 누락되었습니다. 운영자에게 문의해 주세요.',
  provider_error: 'Google 로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  exchange_failed: 'Google 로그인 세션 교환에 실패했습니다. 다시 시도해 주세요.',
  no_code: 'Google 로그인 응답이 올바르지 않습니다.',
};

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const currentShopOnboardingComplete = useAuthStore((s) => s.currentShopOnboardingComplete);
  const role = useAuthStore((s) => s.role);
  const currentShopId = useAuthStore((s) => s.currentShopId);
  const pendingGoogleSignup = useAuthStore((s) => s.pendingGoogleSignup);
  const loginWithPassword = useAuthStore((s) => s.loginWithPassword);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  useEffect(() => {
    const oauthError = searchParams.get('oauth_error');
    if (oauthError) {
      setError(OAUTH_ERROR_MESSAGES[oauthError] ?? 'Google 로그인에 실패했습니다.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (pendingGoogleSignup) {
      router.replace('/signup/google');
      return;
    }

    if (!role || !currentShopId) {
      return;
    }

    router.replace(currentShopOnboardingComplete ? '/home' : '/onboarding');
  }, [currentShopOnboardingComplete, isInitialized, role, currentShopId, pendingGoogleSignup, router]);

  const isReady = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await loginWithPassword(email, password);
      if (!result.success) {
        setError(result.error ?? '로그인에 실패했습니다.');
      }
      // useEffect handles redirect on isLoggedIn change
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const result = await loginAsDemo();
      if (!result.success) {
        setError(result.error ?? '데모 로그인에 실패했습니다.');
      }
      // useEffect handles redirect on isLoggedIn change
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.error ?? 'Google 로그인에 실패했습니다.');
        return;
      }
      setError('');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
        <div className="flex flex-col items-center gap-4">
          <img src="/bdx-logo/bdx-symbol-v9.svg" alt="BDX" className="h-16 animate-pulse" />
          <p className="text-sm text-slate-400">잠시만 기다려 주세요...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-text">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col">
        <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-8 lg:px-12">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-[360px]"
          >
            <div className="mb-10 flex flex-col items-center text-center">
              <img src="/bdx-logo/bdx-symbol-v9.svg" alt="BDX" className="h-20 w-20 mx-auto block" />
              <div className="mt-6 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Shop Account</p>
                <h1 className="text-[26px] font-bold tracking-tight text-slate-900">샵 로그인</h1>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  void handleGoogleLogin();
                }}
                disabled={isLoading || isGoogleLoading}
                className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#d7dce3] bg-white px-4 text-[15px] font-semibold text-slate-800 transition-colors duration-200 hover:border-[#c6ccd5] hover:bg-slate-50 active:scale-[0.995] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.805 10.023h-9.72v3.955h5.573c-.24 1.273-.96 2.35-2.045 3.068v2.548h3.305c1.935-1.782 3.047-4.41 3.047-7.545 0-.677-.06-1.329-.16-2.026z" />
                  <path fill="#34A853" d="M12.084 22c2.76 0 5.08-.915 6.773-2.474l-3.305-2.548c-.916.614-2.086.978-3.468.978-2.664 0-4.923-1.798-5.73-4.215H2.938v2.629A10.224 10.224 0 0012.084 22z" />
                  <path fill="#FBBC05" d="M6.354 13.741A6.144 6.144 0 015.988 12c0-.603.131-1.183.366-1.741V7.63H2.938A10.224 10.224 0 001.854 12c0 1.642.393 3.198 1.084 4.37l3.416-2.629z" />
                  <path fill="#EA4335" d="M12.084 6.044c1.5 0 2.848.516 3.91 1.53l2.932-2.932C17.157 2.998 14.844 2 12.084 2A10.224 10.224 0 002.938 7.63l3.416 2.629c.807-2.417 3.066-4.215 5.73-4.215z" />
                </svg>
                {isGoogleLoading ? 'Google 로그인 중...' : 'Google로 로그인'}
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-[#d9dde4]" />
                <span className="text-[11px] font-medium text-slate-400">또는</span>
                <div className="h-px flex-1 bg-[#d9dde4]" />
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); void handleLogin(); }}
                className="flex flex-col gap-3.5"
              >
                <Input
                  id="login-email"
                  label="샵 이메일"
                  type="email"
                  autoComplete="email"
                  placeholder="shop@bdx.kr"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="h-[52px] rounded-[14px] border-[#d7dce3] bg-white px-4 text-[15px] placeholder:text-slate-400 hover:border-[#c6ccd5] focus-visible:ring-primary/20"
                />
                <Input
                  id="login-password"
                  label="샵 비밀번호"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="샵 비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="h-[52px] rounded-[14px] border-[#d7dce3] bg-white px-4 text-[15px] placeholder:text-slate-400 hover:border-[#c6ccd5] focus-visible:ring-primary/20"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  }
                />

                {error && <p className="text-sm font-medium text-error">{error}</p>}

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  disabled={!isReady || isLoading}
                  className="mt-2 h-[52px] md:h-[52px] rounded-[14px] bg-primary text-[15px] md:text-[15px] font-semibold text-white shadow-none hover:bg-primary-dark"
                >
                  {isLoading ? '로그인 중...' : '샵 계정으로 로그인'}
                </Button>
              </form>

            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
              <span>아직 샵 계정이 없으신가요?</span>
              <button
                onClick={() => router.push('/signup')}
                className="font-semibold text-primary transition-colors hover:text-primary-dark"
              >
                회원가입
              </button>
            </div>

            <div className="mt-3 flex justify-center">
              <button
                onClick={() => {
                  void handleDemoLogin();
                }}
                disabled={isLoading}
                className="text-sm font-medium text-slate-500 underline underline-offset-4 transition-colors hover:text-primary disabled:opacity-50"
              >
                로그인 없이 서비스 체험하기
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
