'use client';

import { useLayoutEffect, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useLocaleStore } from '@/store/locale-store';
import { useAuthStore } from '@/store/auth-store';
import type { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const currentShopOnboardingComplete = useAuthStore((s) => s.currentShopOnboardingComplete);

  // 마운트 시 1회만 ko 강제 설정 (locale을 deps에서 제외하여 restoreLocale 무력화 방지)
  useLayoutEffect(() => {
    setLocale('ko');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setLocale]);

  useEffect(() => {
    if (!isInitialized) return;
    if (isLoggedIn() && !currentShopOnboardingComplete) {
      router.replace('/onboarding');
    }
  }, [isInitialized, isLoggedIn, currentShopOnboardingComplete, router]);

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
