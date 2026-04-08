'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface Slide {
  icon: string;
  title: string;
  description: string;
  accent: string;
}

const SLIDES: Slide[] = [
  {
    icon: '📸',
    title: '포트폴리오 올리면\n고객이 디자인을 골라요',
    description: '사진만 올리면 자동으로 정리되고,\n고객이 원하는 디자인을 직접 선택할 수 있어요.',
    accent: 'var(--color-primary)',
  },
  {
    icon: '💰',
    title: '가격 설정하면\n총 금액이 자동 계산돼요',
    description: '기본 가격, 추가 옵션까지 한 번에 세팅.\n상담할 때 가격 계산 고민 끝!',
    accent: 'var(--color-success)',
  },
  {
    icon: '🌏',
    title: '상담 시작하면\n외국인도 언어 걱정 없어요',
    description: '한국어로 입력하면 고객 언어로 자동 표시.\n영어, 중국어, 일본어 모두 지원해요.',
    accent: 'var(--color-info)',
  },
  {
    icon: '⚡',
    title: '3분이면 충분해요',
    description: '포트폴리오 업로드부터 가격 설정까지,\n빠르게 세팅하고 바로 시작하세요.',
    accent: 'var(--color-primary)',
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
  }),
};

export default function OnboardingGuidePage(): React.ReactElement {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const isLast = current === SLIDES.length - 1;

  const goNext = (): void => {
    if (isLast) {
      router.push('/onboarding/shop-info');
      return;
    }
    setDirection(1);
    setCurrent((p) => p + 1);
  };

  const goTo = (idx: number): void => {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  };

  const slide = SLIDES[current];

  return (
    <div className="flex flex-col items-center justify-between min-h-[calc(100dvh-80px)] px-6 py-10">
      {/* Slide content */}
      <div className="flex-1 flex items-center justify-center w-full max-w-sm">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center gap-6 w-full"
          >
            {/* Icon */}
            <div
              className="w-28 h-28 rounded-3xl flex items-center justify-center text-5xl"
              style={{ backgroundColor: `color-mix(in srgb, ${slide.accent} 12%, transparent)` }}
            >
              {slide.icon}
            </div>

            {/* Text */}
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl font-bold text-text leading-snug whitespace-pre-line">
                {slide.title}
              </h1>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                {slide.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + CTA */}
      <div className="flex flex-col items-center gap-6 w-full max-w-sm">
        {/* Dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="p-1"
              aria-label={`슬라이드 ${i + 1}`}
            >
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 24 : 8,
                  backgroundColor: i === current ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              />
            </button>
          ))}
        </div>

        {/* CTA */}
        <div className="w-full flex gap-3">
          {!isLast && (
            <Button
              variant="secondary"
              size="lg"
              onClick={() => router.push('/onboarding/shop-info')}
              className="shrink-0"
            >
              건너뛰기
            </Button>
          )}
          <Button size="lg" fullWidth onClick={goNext}>
            {isLast ? '시작하기' : '다음'}
          </Button>
        </div>
      </div>
    </div>
  );
}
