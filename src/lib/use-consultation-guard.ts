'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConsultationStore } from '@/store/consultation-store';

interface ConsultationGuardOptions {
  requireCustomerName?: boolean;
}

/**
 * Redirects to /consultation if the consultation flow hasn't been started.
 * Use on step pages to prevent direct URL access without data.
 *
 * @param isEnabled - Set to false to disable the guard (e.g. when viewing a saved record).
 * @param options.requireCustomerName - If true, also checks that customerName is present.
 *   Use on pages after /consultation/customer where a name is expected.
 */
export function useConsultationGuard(isEnabled = true, options: ConsultationGuardOptions = {}): void {
  const router = useRouter();
  const entryPoint = useConsultationStore((s) => s.consultation.entryPoint);
  const customerName = useConsultationStore((s) => s.consultation.customerName);

  useEffect(() => {
    if (!isEnabled) return;
    if (!entryPoint) {
      router.replace('/consultation');
      return;
    }
    if (options.requireCustomerName && !customerName) {
      router.replace('/consultation/customer');
    }
  }, [entryPoint, customerName, isEnabled, options.requireCustomerName, router]);
}
