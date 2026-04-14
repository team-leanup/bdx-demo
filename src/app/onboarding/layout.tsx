'use client';

import { useRef, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/auth/AuthGuard';

const STEPS = [
  { path: '/onboarding', label: '시작' },
  { path: '/onboarding/shop-info', label: '기본 정보' },
  { path: '/onboarding/portfolio-upload', label: '포트폴리오 업로드' },
  { path: '/onboarding/portfolio-classify', label: '포트폴리오 정리' },
  { path: '/onboarding/pricing', label: '가격 & 시간' },
  { path: '/onboarding/surcharges', label: '추가 비용' },
  { path: '/onboarding/notice', label: '안내 문구' },
  { path: '/onboarding/complete', label: '완료' },
];

const TOTAL_STEPS = STEPS.length - 1; // 시작 페이지 제외, 7단계(6스텝 + 완료)

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [pathname]);

  const currentIndex = STEPS.findIndex((s) => s.path === pathname);
  const isFirst = currentIndex <= 0;
  const showProgress = currentIndex > 0;
  // 시작(index 0)은 step 0, 이후 index 1~7은 step 1~7
  const currentStep = currentIndex > 0 ? currentIndex : 0;

  const handleBack = () => {
    if (!isFirst && currentIndex > 0) {
      router.push(STEPS[currentIndex - 1].path);
    }
  };

  return (
    <AuthGuard>
    <div className="h-dvh bg-background flex flex-col">
      {/* Header */}
      {showProgress && (
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          {/* Progress bar: 7 segments */}
          <div className="flex gap-1 px-4 pt-3">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <motion.div
                key={i}
                className="h-1 md:h-1.5 flex-1 rounded-full overflow-hidden bg-border"
              >
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={false}
                  animate={{ width: currentStep > i ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                />
              </motion.div>
            ))}
          </div>

          {/* Header content */}
          <div className="flex items-center h-14 px-4 md:px-20 max-w-2xl md:max-w-none mx-auto w-full">
            {!isFirst ? (
              <button
                onClick={handleBack}
                className="flex items-center justify-center w-11 h-11 rounded-xl hover:bg-surface-alt transition-colors text-text"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.5 15L7.5 10L12.5 5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <div className="w-9" />
            )}

            <div className="flex-1 flex items-center justify-center">
              <span className="text-sm md:text-base font-medium text-text-muted">
                {currentStep > 0 ? `${currentStep} / ${TOTAL_STEPS}` : ''}
              </span>
            </div>

            {/* 닫기 버튼 제거 — 오른쪽 공간만 유지 */}
            <div className="w-9" />
          </div>
        </div>
      )}

      {/* Page content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="md:flex md:justify-center md:py-10 md:px-16">
          <div className="w-full md:max-w-[640px]">
            {children}
          </div>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
