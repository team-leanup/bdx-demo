'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function RootPage() {
  const router = useRouter();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const currentShopOnboardingComplete = useAuthStore((s) => s.currentShopOnboardingComplete);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (isLoggedIn()) {
      router.replace(currentShopOnboardingComplete ? '/home' : '/onboarding');
    } else {
      router.replace('/splash');
    }
  }, [currentShopOnboardingComplete, isInitialized, isLoggedIn, router]);

  return null;
}
