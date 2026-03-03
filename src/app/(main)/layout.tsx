'use client';

import { useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useLocaleStore } from '@/store/locale-store';
import type { ReactNode } from 'react';

export default function MainLayout({ children }: { children: ReactNode }) {
  const setLocale = useLocaleStore((s) => s.setLocale);

  useEffect(() => {
    setLocale('ko');
  }, [setLocale]);

  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
