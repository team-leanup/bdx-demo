'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

const SLIDES = [
  {
    icon: (
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="12" width="56" height="48" rx="8" fill="var(--color-primary-light)" />
        <rect x="16" y="24" width="24" height="4" rx="2" fill="var(--color-primary)" />
        <rect x="16" y="32" width="40" height="3" rx="1.5" fill="var(--color-primary)" opacity="0.4" />
        <rect x="16" y="39" width="32" height="3" rx="1.5" fill="var(--color-primary)" opacity="0.4" />
        <circle cx="52" cy="26" r="10" fill="var(--color-primary)" />
        <path d="M47 26l3 3 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: '시술 상담을 구조화하세요.',
    description: '가격과 시간을 자동 계산합니다.',
  },
  {
    icon: (
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="36" cy="28" r="14" fill="var(--color-primary-light)" />
        <circle cx="36" cy="28" r="8" fill="var(--color-primary)" opacity="0.5" />
        <circle cx="36" cy="28" r="4" fill="var(--color-primary)" />
        <rect x="12" y="48" width="48" height="12" rx="6" fill="var(--color-primary-light)" />
        <rect x="18" y="52" width="12" height="4" rx="2" fill="var(--color-primary)" opacity="0.5" />
        <rect x="34" y="52" width="20" height="4" rx="2" fill="var(--color-primary)" opacity="0.3" />
      </svg>
    ),
    title: '합의 내용을 기록하세요.',
    description: '분쟁 없이 상담을 마무리하세요.',
  },
];

export default function IntroPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const goNext = () => {
    if (current < SLIDES.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      router.push('/signup');
    }
  };

  const skip = () => router.push('/signup');

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && current < SLIDES.length - 1) {
        setCurrent((c) => c + 1);
      } else if (diff < 0 && current > 0) {
        setCurrent((c) => c - 1);
      }
    }
  };

  const isLast = current === SLIDES.length - 1;

  return (
    <div
      className="min-h-screen flex flex-col bg-background relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip button */}
      <div className="flex justify-end px-6 md:px-12 pt-6 md:pt-8">
        <button
          onClick={skip}
          className="text-sm md:text-base font-medium text-text-muted hover:text-text transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-alt"
        >
          건너뛰기
        </button>
      </div>

      {/* Slides */}
      <div className="flex-1 flex items-center justify-center px-8 md:px-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="flex flex-col items-center justify-center text-center w-full gap-8 md:gap-12"
          >
            <div className="flex items-center justify-center w-36 h-36 md:w-56 md:h-56 rounded-2xl md:rounded-[2rem] bg-surface shadow-sm">
              <div className="md:scale-150">
                {SLIDES[current].icon}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:gap-4">
              <h1 className="text-2xl md:text-4xl font-bold text-text">{SLIDES[current].title}</h1>
              <p className="text-base md:text-xl text-text-secondary whitespace-pre-line leading-relaxed">
                {SLIDES[current].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="flex flex-col items-center gap-6 md:gap-10 px-8 md:px-16 pb-12 md:pb-20">
        {/* Dot indicators */}
        <div className="flex gap-2 md:gap-3">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current
                  ? 'w-6 h-2.5 md:w-8 md:h-3 bg-primary'
                  : 'w-2.5 h-2.5 md:w-3 md:h-3 bg-border hover:bg-text-muted',
              )}
            />
          ))}
        </div>

        <div className="w-full flex justify-center">
          {isLast ? (
            <Button size="lg" fullWidth onClick={goNext} className="max-w-xs md:max-w-md md:py-4 md:text-lg">
              시작하기
            </Button>
          ) : (
            <Button size="lg" fullWidth onClick={goNext} className="max-w-xs md:max-w-md md:py-4 md:text-lg" variant="secondary">
              다음
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
