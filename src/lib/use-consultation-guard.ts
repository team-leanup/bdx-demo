'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConsultationStore, STEP_ORDER } from '@/store/consultation-store';
import type { ConsultationStep } from '@/types/consultation';

/**
 * Redirects to /consultation if the consultation flow hasn't been started.
 * Use on step pages to prevent direct URL access without data.
 *
 * @param isEnabled - guard 활성화 여부 (기본값 true)
 * @param requiredStep - 이 스텝 이전이면 /consultation으로 리다이렉트 (M-3)
 */
export function useConsultationGuard(isEnabled = true, requiredStep?: ConsultationStep): void {
  const router = useRouter();
  const entryPoint = useConsultationStore((s) => s.consultation.entryPoint);
  const currentStep = useConsultationStore((s) => s.consultation.currentStep);

  useEffect(() => {
    if (!isEnabled) return;
    if (!entryPoint) {
      router.replace('/consultation');
      return;
    }
    // M-3: requiredStep이 지정된 경우 이전 스텝이면 상담 시작으로 리다이렉트
    if (requiredStep !== undefined) {
      const currentIndex = STEP_ORDER.indexOf(currentStep);
      const requiredIndex = STEP_ORDER.indexOf(requiredStep);
      if (currentIndex !== -1 && requiredIndex !== -1 && currentIndex < requiredIndex) {
        router.replace('/consultation');
      }
    }
  }, [entryPoint, currentStep, isEnabled, requiredStep, router]);
}
