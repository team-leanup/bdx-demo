'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

const STEP_LABELS = [
  '기본 정보',
  '포트폴리오\n업로드',
  '포트폴리오\n정리',
  '가격 & 시간',
  '추가 비용',
  '안내 문구',
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export default function OnboardingWelcomePage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-[calc(100dvh-80px)] px-6 py-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center text-center gap-8 w-full max-w-sm"
      >
        {/* Illustration */}
        <motion.div variants={itemVariants} className="relative">
          <div
            className="w-40 h-40 rounded-3xl flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <svg width="80" height="92" viewBox="0 0 80 92" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Cap */}
              <rect x="24" y="2" width="32" height="18" rx="7" fill="var(--color-primary-dark)" />
              {/* Cap shine */}
              <rect x="28" y="5" width="8" height="10" rx="3" fill="white" opacity="0.2" />
              {/* Neck */}
              <rect x="33" y="20" width="14" height="8" fill="var(--color-primary)" opacity="0.75" />
              {/* Bottle body */}
              <rect x="14" y="28" width="52" height="52" rx="14" fill="var(--color-primary)" />
              {/* Bottle shine */}
              <rect x="21" y="34" width="12" height="26" rx="6" fill="white" opacity="0.22" />
              {/* Label */}
              <rect x="18" y="50" width="44" height="20" rx="5" fill="white" opacity="0.12" />
              {/* Brush */}
              <line x1="40" y1="80" x2="40" y2="88" stroke="var(--color-primary-dark)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
              <ellipse cx="40" cy="90" rx="3" ry="2" fill="var(--color-primary-dark)" opacity="0.5" />
            </svg>

            {/* Sparkle top-right */}
            <div className="absolute top-2.5 right-2.5">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 0L8.4 5.6L14 7L8.4 8.4L7 14L5.6 8.4L0 7L5.6 5.6L7 0Z" fill="var(--color-primary-dark)" opacity="0.55" />
              </svg>
            </div>
            {/* Sparkle bottom-left */}
            <div className="absolute bottom-3 left-3">
              <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                <path d="M4.5 0L5.4 3.6L9 4.5L5.4 5.4L4.5 9L3.6 5.4L0 4.5L3.6 3.6L4.5 0Z" fill="var(--color-primary)" opacity="0.5" />
              </svg>
            </div>
            {/* Sparkle top-left */}
            <div className="absolute top-5 left-4">
              <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                <path d="M3.5 0L4.2 2.8L7 3.5L4.2 4.2L3.5 7L2.8 4.2L0 3.5L2.8 2.8L3.5 0Z" fill="var(--color-primary)" opacity="0.35" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div variants={itemVariants} className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-text leading-snug">
            3분만에 준비하고<br />바로 시작해볼게요
          </h1>
          <p className="text-sm md:text-base text-text-secondary leading-relaxed">
            포트폴리오만 준비하면, 바로 시작할 수 있어요
          </p>
        </motion.div>

        {/* Step preview grid */}
        <motion.div variants={itemVariants} className="w-full">
          <div className="grid grid-cols-3 gap-2">
            {STEP_LABELS.map((label, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border px-2 py-3 flex flex-col items-center gap-1.5"
                style={{ backgroundColor: 'var(--color-surface)' }}
              >
                <span
                  className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary-dark)',
                  }}
                >
                  {i + 1}
                </span>
                <span className="text-xs text-text-secondary leading-tight whitespace-pre-line text-center">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div variants={itemVariants} className="w-full">
          <Button size="lg" fullWidth onClick={() => router.push('/onboarding/shop-info')}>
            시작하기
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
