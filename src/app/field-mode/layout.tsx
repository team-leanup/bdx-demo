'use client';

import { useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuthStore } from '@/store/auth-store';
import { useLocaleStore } from '@/store/locale-store';
import type { ReactNode } from 'react';

export default function FieldModeLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const onboardingComplete = useAuthStore((s) => s.currentShopOnboardingComplete);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const locale = useLocaleStore((s) => s.locale);

  useLayoutEffect(() => {
    setLocale('ko');
  }, [setLocale, locale]);

  useLayoutEffect(() => {
    if (isInitialized && onboardingComplete === false) {
      router.replace('/onboarding');
    }
  }, [isInitialized, onboardingComplete, router]);

  return (
    <AuthGuard>
      <div className="min-h-dvh bg-background">
        {children}
      </div>
    </AuthGuard>
  );
}
