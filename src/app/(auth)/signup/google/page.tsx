'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

export default function GoogleSignupPage(): React.ReactElement {
  const router = useRouter();
  const resetApp = useAppStore((s) => s.resetApp);
  const setShopSettings = useAppStore((s) => s.setShopSettings);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const currentShopOnboardingComplete = useAuthStore((s) => s.currentShopOnboardingComplete);
  const pendingGoogleSignup = useAuthStore((s) => s.pendingGoogleSignup);
  const completePendingGoogleSignup = useAuthStore((s) => s.completePendingGoogleSignup);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (isLoggedIn()) {
      router.replace(currentShopOnboardingComplete ? '/home' : '/onboarding');
      return;
    }

    if (!pendingGoogleSignup) {
      router.replace('/login');
      return;
    }

    if (!ownerName && pendingGoogleSignup.ownerName) {
      setOwnerName(pendingGoogleSignup.ownerName);
    }
  }, [currentShopOnboardingComplete, isInitialized, isLoggedIn, ownerName, pendingGoogleSignup, router]);

  const isReady = shopName.trim().length > 0 && ownerName.trim().length > 0;

  const handleComplete = async (): Promise<void> => {
    if (!shopName.trim()) {
      setError('샵 이름을 입력해 주세요.');
      return;
    }

    if (!ownerName.trim()) {
      setError('이름을 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await completePendingGoogleSignup({
        shopName: shopName.trim(),
        ownerName: ownerName.trim(),
      });

      if (!result.success) {
        setError(result.error ?? 'Google 회원가입을 완료하지 못했습니다.');
        return;
      }

      resetApp();
      setShopSettings({ shopName: shopName.trim() });
      // useEffect handles redirect
    } finally {
      setIsLoading(false);
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
              <img src="/bdx-logo/bdx-symbol.svg" alt="BDX" className="h-20" />
              <div className="mt-6 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Google Signup</p>
                <h1 className="text-[26px] font-bold tracking-tight text-slate-900">샵 정보 마무리</h1>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3.5">
                <Input
                  id="google-signup-email"
                  label="Google 계정 이메일"
                  type="email"
                  value={pendingGoogleSignup?.email ?? ''}
                  disabled
                  className="h-[52px] rounded-[14px] border-[#d7dce3] bg-slate-100 px-4 text-[15px] text-slate-500"
                />
                <Input
                  id="google-signup-owner-name"
                  label="이름"
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
                  id="google-signup-shop-name"
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
              </div>

              {error && <p className="text-sm font-medium text-error">{error}</p>}

              <Button
                size="lg"
                fullWidth
                onClick={handleComplete}
                disabled={!isReady || isLoading}
                className="mt-2 h-[52px] md:h-[52px] rounded-[14px] bg-primary text-[15px] md:text-[15px] font-semibold text-white shadow-none hover:bg-primary-dark"
              >
                Google 회원가입 완료
              </Button>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
