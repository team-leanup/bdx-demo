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
  const loginAsDemo = useAuthStore((s) => s.loginAsDemo);
  const signupShopAccount = useAuthStore((s) => s.signupShopAccount);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isInitialized || !isLoggedIn()) {
      return;
    }

    router.replace(currentShopOnboardingComplete ? '/home' : '/onboarding');
  }, [currentShopOnboardingComplete, isInitialized, isLoggedIn, router]);

  const isReady =
    shopName.trim().length > 0 &&
    ownerName.trim().length > 0 &&
    email.trim().length > 0 &&
    password.trim().length > 0 &&
    passwordConfirm.trim().length > 0;

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
    router.push('/onboarding');
  };

  const handleDemoLogin = async (): Promise<void> => {
    const result = await loginAsDemo();
    if (!result.success) {
      setError(result.error ?? '데모 로그인에 실패했습니다.');
      return;
    }

    setError('');
    router.push(useAuthStore.getState().currentShopOnboardingComplete ? '/home' : '/onboarding');
  };

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
              <img src="/bdx-logo/bdx-symbol.svg" alt="BDX" className="h-20" />
              <div className="mt-6 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Create Shop Account</p>
                <h1 className="text-[26px] font-bold tracking-tight text-slate-900">새 샵 회원가입</h1>
              </div>
            </div>

            <div className="flex flex-col gap-4">
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
              </div>

              {error && <p className="text-sm font-medium text-error">{error}</p>}

              <Button
                size="lg"
                fullWidth
                onClick={handleSignup}
                disabled={!isReady}
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
                className="text-sm font-medium text-slate-500 underline underline-offset-4 transition-colors hover:text-primary"
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
