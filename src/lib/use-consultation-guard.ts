'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConsultationStore } from '@/store/consultation-store';

/**
 * Redirects to /consultation if the consultation flow hasn't been started.
 * Use on step pages to prevent direct URL access without data.
 */
export function useConsultationGuard(isEnabled = true): void {
  const router = useRouter();
  const entryPoint = useConsultationStore((s) => s.consultation.entryPoint);

  useEffect(() => {
    if (isEnabled && !entryPoint) {
      router.replace('/consultation');
    }
  }, [entryPoint, isEnabled, router]);
}
