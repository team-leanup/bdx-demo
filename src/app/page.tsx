'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

export default function RootPage() {
  const router = useRouter();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const currentShopOnboardingComplete = useAuthStore((s) => s.currentShopOnboardingComplete);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const pendingGoogleSignup = useAuthStore((s) => s.pendingGoogleSignup);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (pendingGoogleSignup) {
      router.replace('/signup/google');
      return;
    }

    if (isLoggedIn()) {
      router.replace(currentShopOnboardingComplete ? '/home' : '/onboarding');
    } else {
      router.replace('/splash');
    }
  }, [currentShopOnboardingComplete, isInitialized, isLoggedIn, pendingGoogleSignup, router]);

  return null;
}
