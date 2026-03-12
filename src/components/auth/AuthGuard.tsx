'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import type { AuthGuardProps } from '@/types/auth';

export function AuthGuard({ children, requiredRole, fallbackPath = '/home' }: AuthGuardProps) {
  const router = useRouter();
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const role = useAuthStore((s) => s.role);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isInitialized) return;
    if (!isLoggedIn()) {
      router.replace('/login');
      return;
    }
    if (requiredRole && role !== requiredRole) {
      router.replace(fallbackPath);
    }
  }, [mounted, isInitialized, isLoggedIn, role, requiredRole, fallbackPath, router]);

  if (!mounted || !isInitialized || !isLoggedIn() || (requiredRole && role !== requiredRole)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <img
          src="/bdx-logo/bdx-symbol.svg"
          alt="BDX"
          className="h-16 w-16 animate-pulse"
        />
      </div>
    );
  }

  return <>{children}</>;
}
