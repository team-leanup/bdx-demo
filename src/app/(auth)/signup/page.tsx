'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

export default function SignupPage(): React.ReactElement {
  const router = useRouter();
  const resetApp = useAppStore((s) => s.resetApp);
  const setShopSettings = useAppStore((s) => s.setShopSettings);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const currentShopOnboardingComplete = useAuthStore((s) => s.currentShopOnboardingComplete);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const pendingGoogleSignup = useAuthStore((s) => s.pendingGoogleSignup);
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const signupShopAccount = useAuthStore((s) => s.signupShopAccount);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (pendingGoogleSignup) {
      router.replace('/signup/google');
      return;
    }

    if (!isLoggedIn()) {
      return;
    }

    router.replace(currentShopOnboardingComplete ? '/home' : '/onboarding');
  }, [currentShopOnboardingComplete, isInitialized, isLoggedIn, pendingGoogleSignup, router]);

  const isReady =
    shopName.trim().length > 0 &&
    ownerName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === passwordConfirm;

  const handleSignup = async (): Promise<void> => {
    if (!shopName.trim()) {
      setError('샵 이름을 입력해 주세요.');
      return;
    }

    if (!ownerName.trim()) {
      setError('원장 이름을 입력해 주세요.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('비밀번호가 서로 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signupShopAccount({
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
        email,
        password,
      });

      if (!result.success) {
        setError(result.error ?? '회원가입에 실패했습니다.');
        return;
      }

      resetApp();
      setShopSettings({ shopName: shopName.trim() });
      // useEffect handles redirect
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
      // useEffect handles redirect
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async (): Promise<void> => {
    const result = await loginWithGoogle('signup');

    if (!result.success) {
      setError(result.error ?? 'Google 회원가입에 실패했습니다.');
      return;
    }

    setError('');
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
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Create Shop Account</p>
                <h1 className="text-[26px] font-bold tracking-tight text-slate-900">새 샵 회원가입</h1>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => {
                  void handleGoogleSignup();
                }}
                disabled={isLoading}
                className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#d7dce3] bg-white px-4 text-[15px] font-semibold text-slate-800 transition-colors duration-200 hover:border-[#c6ccd5] hover:bg-slate-50 active:scale-[0.995]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.805 10.023h-9.72v3.955h5.573c-.24 1.273-.96 2.35-2.045 3.068v2.548h3.305c1.935-1.782 3.047-4.41 3.047-7.545 0-.677-.06-1.329-.16-2.026z" />
                  <path fill="#34A853" d="M12.084 22c2.76 0 5.08-.915 6.773-2.474l-3.305-2.548c-.916.614-2.086.978-3.468.978-2.664 0-4.923-1.798-5.73-4.215H2.938v2.629A10.224 10.224 0 0012.084 22z" />
                  <path fill="#FBBC05" d="M6.354 13.741A6.144 6.144 0 015.988 12c0-.603.131-1.183.366-1.741V7.63H2.938A10.224 10.224 0 001.854 12c0 1.642.393 3.198 1.084 4.37l3.416-2.629z" />
                  <path fill="#EA4335" d="M12.084 6.044c1.5 0 2.848.516 3.91 1.53l2.932-2.932C17.157 2.998 14.844 2 12.084 2A10.224 10.224 0 002.938 7.63l3.416 2.629c.807-2.417 3.066-4.215 5.73-4.215z" />
                </svg>
                Google로 회원가입
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-[#d9dde4]" />
                <span className="text-[11px] font-medium text-slate-400">또는</span>
                <div className="h-px flex-1 bg-[#d9dde4]" />
              </div>

              <div className="flex flex-col gap-3.5">
                <Input
                  id="signup-shop-name"
                  label="샵 이름"
                  type="text"
                  placeholder="예: 네일숲 강남점"
                  value={shopName}
                  onChange={(e) => {
                    setShopName(e.target.value);
                    setError('');
                  }}
                  className="h-[52px] rounded-[14px] border-[#d7dce3] bg-white px-4 text-[15px] placeholder:text-slate-400 hover:border-[#c6ccd5] focus-visible:ring-primary/20"
                />
                <Input
                  id="signup-owner-name"
                  label="원장 이름"
                  type="text"
                  placeholder="예: 김소율"
                  value={ownerName}
                  onChange={(e) => {
                    setOwnerName(e.target.value);
                    setError('');
                  }}
                  className="h-[52px] rounded-[14px] border-[#d7dce3] bg-white px-4 text-[15px] placeholder:text-slate-400 hover:border-[#c6ccd5] focus-visible:ring-primary/20"
                />
                <Input
                  id="signup-email"
                  label="샵 이메일"
                  type="email"
                  placeholder="shop@bdx.kr"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  className="h-[52px] rounded-[14px] border-[#d7dce3] bg-white px-4 text-[15px] placeholder:text-slate-400 hover:border-[#c6ccd5] focus-visible:ring-primary/20"
                />
                <Input
                  id="signup-password"
                  label="샵 비밀번호"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  className="h-[52px] rounded-[14px] border-[#d7dce3] bg-white px-4 text-[15px] placeholder:text-slate-400 hover:border-[#c6ccd5] focus-visible:ring-primary/20"
                />
                <Input
                  id="signup-password-confirm"
                  label="비밀번호 확인"
                  type="password"
                  placeholder="비밀번호를 한 번 더 입력하세요"
                  value={passwordConfirm}
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    setError('');
                  }}
                  className="h-[52px] rounded-[14px] border-[#d7dce3] bg-white px-4 text-[15px] placeholder:text-slate-400 hover:border-[#c6ccd5] focus-visible:ring-primary/20"
                />
                {password.length > 0 && password.length < 6 && (
                  <p className="text-xs text-text-muted">비밀번호는 6자 이상이어야 합니다.</p>
                )}
              </div>

              {error && <p className="text-sm font-medium text-error">{error}</p>}

              <Button
                size="lg"
                fullWidth
                onClick={handleSignup}
                disabled={!isReady || isLoading}
                className="mt-2 h-[52px] md:h-[52px] rounded-[14px] bg-primary text-[15px] md:text-[15px] font-semibold text-white shadow-none hover:bg-primary-dark"
              >
                회원가입 후 시작하기
              </Button>

            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
              <span>이미 샵 계정이 있으신가요?</span>
              <button
                onClick={() => router.push('/login')}
                className="font-semibold text-primary transition-colors hover:text-primary-dark"
              >
                로그인
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
