'use client';

import { useLayoutEffect, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useLocaleStore } from '@/store/locale-store';
import { useAuthStore } from '@/store/auth-store';
import { useReservationStore } from '@/store/reservation-store';
import type { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const locale = useLocaleStore((s) => s.locale);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const currentShopOnboardingComplete = useAuthStore((s) => s.currentShopOnboardingComplete);

  useLayoutEffect(() => {
    setLocale('ko');
  }, [setLocale, locale]);

  useEffect(() => {
    if (!isInitialized) return;
    if (isLoggedIn() && !currentShopOnboardingComplete) {
      router.replace('/onboarding');
    }
  }, [isInitialized, isLoggedIn, currentShopOnboardingComplete, router]);

  const hydrateFromDB = useReservationStore((s) => s.hydrateFromDB);

  useEffect(() => {
    const poll = (): void => {
      if (document.visibilityState === 'visible') {
        hydrateFromDB().catch(console.error);
      }
    };
    poll();
    const interval = setInterval(poll, 30000);
    document.addEventListener('visibilitychange', poll);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [hydrateFromDB]);

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
