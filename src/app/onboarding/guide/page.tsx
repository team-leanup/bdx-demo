'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

interface Slide {
  icon: string;
  title: string;
  description: string;
  visual: React.ReactNode;
}

function HomeScreenVisual() {
  return (
    <div className="w-full max-w-xs mx-auto space-y-3">
      {/* 새 상담 CTA */}
      <div
        className="w-full rounded-2xl p-4 flex items-center gap-3 shadow-sm"
        style={{ background: 'var(--color-primary)' }}
      >
        <span className="text-2xl">✨</span>
        <div>
          <p className="text-sm font-bold text-white">새 상담 시작</p>
          <p className="text-xs text-white/70">고객과 바로 시작하기</p>
        </div>
      </div>
      {/* 3개 미니 카드 */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: '📅', label: '오늘 예약', sub: '3건' },
          { icon: '📋', label: '최근 기록', sub: '12건' },
          { icon: '📊', label: '이번 달 매출', sub: '₩420만' },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl p-3 flex flex-col items-center gap-1 border border-border"
            style={{ background: 'var(--color-surface-alt)' }}
          >
            <span className="text-lg">{item.icon}</span>
            <p className="text-[10px] font-semibold text-text text-center leading-tight">{item.label}</p>
            <p className="text-[10px] text-text-muted">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConsultationFlowVisual() {
  const steps = [
    { num: 1, label: '기본\n정보', active: true },
    { num: 2, label: '디자인\n선택', active: false },
    { num: 3, label: '옵션\n설정', active: false },
  ];
  return (
    <div className="w-full max-w-xs mx-auto space-y-4">
      {/* Step 플로우 */}
      <div className="flex items-center justify-center gap-1">
        {steps.map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                style={{
                  background: step.active ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                  color: step.active ? 'white' : 'var(--color-text-muted)',
                  border: step.active ? 'none' : '2px solid var(--color-border)',
                }}
              >
                {step.num}
              </div>
              <p className="text-[9px] text-text-muted text-center leading-tight w-12 whitespace-pre-line">{step.label}</p>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-0.5 w-8 flex-shrink-0 mx-1 mb-3"
                style={{ background: 'var(--color-border)' }}
              />
            )}
          </div>
        ))}
      </div>
      {/* 자동 계산 태그 */}
      <div className="flex gap-2 justify-center flex-wrap">
        {['가격 자동계산 💰', '시간 자동계산 ⏱️'].map((tag) => (
          <span
            key={tag}
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function CustomerManagementVisual() {
  return (
    <div className="w-full max-w-xs mx-auto space-y-2">
      {[
        { name: '김민지', tag: '단골', visits: '12회', memo: '젤 라이트 핑크 선호' },
        { name: '이수연', tag: '신규', visits: '1회', memo: '첫 방문 — 투명 계열' },
      ].map((c) => (
        <div
          key={c.name}
          className="flex items-center gap-3 rounded-2xl border border-border p-3 shadow-sm"
          style={{ background: 'var(--color-surface)' }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-white text-sm"
            style={{ background: 'var(--color-primary)' }}
          >
            {c.name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-text">{c.name}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
              >
                {c.tag}
              </span>
            </div>
            <p className="text-[10px] text-text-muted truncate">방문 {c.visits} · {c.memo}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function TabBarVisual() {
  const tabs = [
    { icon: '🏠', label: '홈' },
    { icon: '📋', label: '기록' },
    { icon: '👥', label: '고객' },
    { icon: '📊', label: '매출' },
    { icon: '⚙️', label: '설정' },
  ];
  return (
    <div className="w-full max-w-xs mx-auto space-y-4">
      {/* 힌트 텍스트 */}
      <p className="text-center text-xs text-text-muted">하단 탭에서 원하는 기능으로 이동하세요</p>
      {/* 탭바 미니 모형 */}
      <div
        className="w-full rounded-2xl border border-border shadow-md py-3 px-2 flex items-center justify-around"
        style={{ background: 'var(--color-surface)' }}
      >
        {tabs.map((tab, i) => (
          <div key={tab.label} className="flex flex-col items-center gap-1">
            <span className="text-xl">{tab.icon}</span>
            <p
              className="text-[10px] font-medium"
              style={{ color: i === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
            >
              {tab.label}
            </p>
            {i === 0 && (
              <div
                className="h-1 w-4 rounded-full"
                style={{ background: 'var(--color-primary)' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const SLIDES: Slide[] = [
  {
    icon: '🏠',
    title: '홈에서 모든 것을 시작해요',
    description: '새 상담 시작, 오늘의 상담 확인, 최근 상담 기록을 한눈에 볼 수 있어요',
    visual: <HomeScreenVisual />,
  },
  {
    icon: '✨',
    title: '3단계로 상담을 구조화해요',
    description: '기본 정보 → 디자인 선택 → 옵션 설정, 가격과 시간이 자동으로 계산됩니다',
    visual: <ConsultationFlowVisual />,
  },
  {
    icon: '👥',
    title: '고객 정보를 한곳에서 관리해요',
    description: '시술 이력, 선호도 프로필, 메모를 자동으로 기록하고 다음 상담에 활용하세요',
    visual: <CustomerManagementVisual />,
  },
  {
    icon: '🎉',
    title: '설정 완료! 바로 시작해보세요',
    description: '하단 탭에서 원하는 기능을 탐색해보세요. 언제든지 설정을 바꿀 수 있어요',
    visual: <TabBarVisual />,
  },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function GuidePage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  const goNext = () => {
    if (isLast) {
      router.push('/home');
      return;
    }
    setDirection(1);
    setCurrent((prev) => prev + 1);
  };

  const goPrev = () => {
    if (current === 0) return;
    setDirection(-1);
    setCurrent((prev) => prev - 1);
  };

  const goToSlide = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={goPrev}
          className={`flex h-9 w-9 items-center justify-center rounded-full bg-surface-alt text-text-secondary transition-opacity ${current === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => router.push('/home')}
          className="text-sm font-medium text-text-muted"
        >
          건너뛰기
        </button>
      </div>

      {/* 슬라이드 영역 */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-8 px-6"
          >
            {/* 아이콘 */}
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl text-5xl shadow-md"
              style={{ background: 'var(--color-primary-light)' }}
            >
              {slide.icon}
            </div>

            {/* 텍스트 */}
            <div className="text-center flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-text">{slide.title}</h1>
              <p className="text-sm text-text-secondary leading-relaxed max-w-sm mx-auto">
                {slide.description}
              </p>
            </div>

            {/* 비주얼 */}
            <div className="w-full max-w-sm">{slide.visual}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 하단 영역 */}
      <div className="flex flex-col items-center gap-5 px-6 pb-8">
        {/* 도트 인디케이터 */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'w-6 h-2.5 bg-primary' : 'w-2.5 h-2.5 bg-border'
              }`}
            />
          ))}
        </div>

        {/* 다음/시작 버튼 */}
        <button
          onClick={goNext}
          className="w-full max-w-sm rounded-2xl py-4 text-base font-bold text-white shadow-md transition-opacity hover:opacity-90 active:scale-95"
          style={{ background: 'var(--color-primary)' }}
        >
          {isLast ? '시작하기' : '다음'}
        </button>
      </div>
    </div>
  );
}
