'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';

export default function OnboardingWelcomePage() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-8 py-12 max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center text-center gap-8 w-full"
      >
        {/* Illustration */}
        <div
          className="w-32 h-32 rounded-3xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-primary-light)' }}
        >
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="22" r="12" fill="var(--color-primary)" opacity="0.2" />
            <circle cx="36" cy="22" r="7" fill="var(--color-primary)" opacity="0.5" />
            <circle cx="36" cy="22" r="3.5" fill="var(--color-primary)" />
            <path
              d="M14 52c0-12.2 9.8-22 22-22s22 9.8 22 22"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.3"
            />
            <path
              d="M20 52c0-8.8 7.2-16 16-16s16 7.2 16 16"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M26 52c0-5.5 4.5-10 10-10s10 4.5 10 10"
              stroke="var(--color-primary)"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Text */}
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-text">
            샵 설정을 시작할게요.
          </h1>
          <p className="text-base text-text-secondary">
            3분이면 완료됩니다.
          </p>

          {/* Step indicator: 4 circles */}
          <div className="flex items-center justify-center gap-2 mt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full border-2"
                style={{ borderColor: 'var(--color-primary)', opacity: 0.3 }}
              />
            ))}
          </div>
        </div>

        <Button size="lg" fullWidth onClick={() => router.push('/onboarding/shop-info')}>
          시작하기
        </Button>
      </motion.div>
    </div>
  );
}
