'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';

export default function RootPage() {
  const router = useRouter();
  const isOnboardingComplete = useAppStore((s) => s.isOnboardingComplete);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  useEffect(() => {
    if (isOnboardingComplete) {
      if (isLoggedIn()) {
        router.replace('/home');
      } else {
        router.replace('/lock');
      }
    } else {
      router.replace('/splash');
    }
  }, [isOnboardingComplete, isLoggedIn, router]);

  return null;
}
