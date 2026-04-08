'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

interface Slide {
  tag: string;
  title: string;
  bullets: string[];
  screenshot: string;
  screenshotAlt: string;
}

const SLIDES: Slide[] = [
  {
    tag: '세팅만 하면 끝',
    title: '사진 올리고 가격 입력하면\n고객이 직접 고르는 메뉴판 완성',
    bullets: [
      '포트폴리오 사진을 올리면 디자인별 메뉴가 자동 구성돼요',
      '시술 종류별 가격을 입력하면 고객에게 금액이 바로 보여요',
      '한 번 세팅하면 매번 설명할 필요 없이 링크 하나로 끝',
    ],
    screenshot: '/images/intro/slide1-portfolio.jpg',
    screenshotAlt: '포트폴리오 화면 — 네일 사진과 가격이 정리된 모습',
  },
  {
    tag: '시술 전 미리 결정',
    title: '링크 보내면 고객이\n시술 전에 미리 골라와요',
    bullets: [
      '사전 상담 링크를 카톡/문자로 보내세요',
      '고객이 원하는 디자인과 옵션을 직접 선택해요',
      '한국어·영어·중국어·일본어 자동 지원 — 외국인도 OK',
    ],
    screenshot: '/images/intro/slide2-preconsult.jpg',
    screenshotAlt: '사전상담 화면 — 고객이 다국어로 디자인을 고르는 모습',
  },
  {
    tag: 'BDX 도입 효과',
    title: '상담 시간은 줄고\n단골 고객은 늘어요',
    bullets: [
      '시술 전 합의 완료 → 현장 상담 3분 이내',
      '고객별 선호·이력 자동 기록 → 재방문 시 바로 파악',
      '스케줄·매출·고객 데이터를 한 곳에서 관리',
    ],
    screenshot: '/images/intro/slide3-customers.jpg',
    screenshotAlt: '고객 관리 화면 — 단골 고객과 매출을 한눈에 보는 모습',
  },
];

export default function IntroPage(): React.ReactElement {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number>(0);

  const goNext = (): void => {
    if (current < SLIDES.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      router.push('/signup');
    }
  };

  const skip = (): void => {
    router.push('/signup');
  };

  const handleTouchStart = (e: React.TouchEvent): void => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent): void => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && current < SLIDES.length - 1) {
        setCurrent((c) => c + 1);
      } else if (diff < 0 && current > 0) {
        setCurrent((c) => c - 1);
      }
    }
  };

  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  return (
    <div
      className="min-h-screen flex flex-col bg-background relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip */}
      <div className="flex justify-end px-6 pt-5">
        <button
          onClick={skip}
          className="text-sm font-medium text-text-muted hover:text-text transition-colors px-3 py-1.5 rounded-lg hover:bg-surface-alt"
        >
          건너뛰기
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col px-6 pt-2 pb-4 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex flex-col gap-4 flex-1"
          >
            {/* Tag */}
            <span className="self-start rounded-full px-3 py-1 text-xs font-medium bg-primary/10 text-primary">
              {slide.tag}
            </span>

            {/* Title */}
            <h1 className="text-xl font-bold text-text leading-snug whitespace-pre-line">
              {slide.title}
            </h1>

            {/* Bullets */}
            <ul className="flex flex-col gap-1.5">
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-text-secondary leading-relaxed">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary/50 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>

            {/* Phone mockup with screenshot */}
            <div className="flex-1 flex items-center justify-center min-h-0 pt-2">
              <div className="relative w-[200px] h-[400px] rounded-[28px] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-gray-800 rounded-b-2xl z-10" />
                {/* Screen */}
                <div className="w-full h-full rounded-[22px] overflow-hidden bg-white">
                  <Image
                    src={slide.screenshot}
                    alt={slide.screenshotAlt}
                    fill
                    className="object-cover object-top"
                    priority
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + CTA */}
      <div className="flex flex-col items-center gap-5 px-6 pb-10">
        {/* Dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === current
                  ? 'w-6 h-2.5 bg-primary'
                  : 'w-2.5 h-2.5 bg-border hover:bg-text-muted',
              )}
            />
          ))}
        </div>

        <div className="w-full max-w-xs">
          <Button
            size="lg"
            fullWidth
            onClick={goNext}
            variant={isLast ? 'primary' : 'secondary'}
          >
            {isLast ? '시작하기' : '다음'}
          </Button>
        </div>
      </div>
    </div>
  );
}
