'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { ConsultationLocaleButton } from '@/components/consultation/ConsultationLocaleButton';
import { useLocaleStore } from '@/store/locale-store';

export default function ConsultationLayout({ children }: { children: ReactNode }) {
  const restoreLocale = useLocaleStore((s) => s.restoreLocale);

  useEffect(() => {
    return () => {
      // 상담 플로우를 벗어날 때(summary 미경유 이탈 포함) locale 복원
      restoreLocale();
    };
  }, [restoreLocale]);

  return (
    <div className="h-dvh bg-background flex flex-col">
      <ConsultationLocaleButton />
      {children}
    </div>
  );
}
