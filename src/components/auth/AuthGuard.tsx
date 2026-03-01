'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import type { AuthGuardProps } from '@/types/auth';

export function AuthGuard({ children, requiredRole, fallbackPath = '/home' }: AuthGuardProps) {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const role = useAuthStore((s) => s.role);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isLoggedIn()) {
      router.replace('/auth/lock');
      return;
    }
    if (requiredRole && role !== requiredRole) {
      router.replace(fallbackPath);
    }
  }, [mounted, isLoggedIn, role, requiredRole, fallbackPath, router]);

  if (!mounted) return null;
  if (!isLoggedIn()) return null;
  if (requiredRole && role !== requiredRole) return null;

  return <>{children}</>;
}
