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

  if (!mounted || !isInitialized) return null;
  if (!isLoggedIn()) return null;
  if (requiredRole && role !== requiredRole) return null;

  return <>{children}</>;
}
