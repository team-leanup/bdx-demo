'use client';

import { useLayoutEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useLocaleStore } from '@/store/locale-store';
import type { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  const setLocale = useLocaleStore((s) => s.setLocale);

  useLayoutEffect(() => {
    setLocale('ko');
  }, [setLocale]);

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
