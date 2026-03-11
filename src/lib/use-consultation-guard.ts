'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConsultationStore } from '@/store/consultation-store';

/**
 * Redirects to /consultation if the consultation flow hasn't been started.
 * Use on step pages to prevent direct URL access without data.
 */
export function useConsultationGuard(): void {
  const router = useRouter();
  const entryPoint = useConsultationStore((s) => s.consultation.entryPoint);

  useEffect(() => {
    if (!entryPoint) {
      router.replace('/consultation');
    }
  }, [entryPoint, router]);
}
