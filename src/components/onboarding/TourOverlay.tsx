'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: 'tour-stats',
    title: '오늘 현황',
    description: '오늘 예약과 상담 현황을 한눈에 확인하세요',
    position: 'bottom',
  },
  {
    targetId: 'tour-new-consultation',
    title: '새 상담 시작',
    description: '여기서 새 상담을 바로 시작할 수 있어요',
    position: 'bottom',
  },
  {
    targetId: 'tour-recent',
    title: '최근 상담',
    description: '최근 상담 기록을 확인하고 이어서 진행하세요',
    position: 'top',
  },
  {
    targetId: 'tour-nav',
    title: '네비게이션',
    description: '탭으로 기록, 고객, 대시보드, 설정에 접근하세요',
    position: 'top',
  },
];

interface TourOverlayProps {
  active: boolean;
  onComplete: () => void;
}

export function TourOverlay({ active, onComplete }: TourOverlayProps) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const retryCountRef = useRef(0);

  const currentStep = TOUR_STEPS[step];

  const measureTarget = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
    if (!el) {
      if (retryCountRef.current < 5) {
        retryCountRef.current++;
        setTimeout(measureTarget, 200);
      } else {
        setTargetRect(null);
        retryCountRef.current = 0;
      }
      return;
    }
    retryCountRef.current = 0;
    setTargetRect(el.getBoundingClientRect());
  }, [currentStep]);

  // Continuously re-measure for the first second to catch animation settling
  useEffect(() => {
    retryCountRef.current = 0;
    const timers = [
      setTimeout(measureTarget, 100),
      setTimeout(measureTarget, 300),
      setTimeout(measureTarget, 600),
      setTimeout(measureTarget, 1000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [currentStep, measureTarget]);

  useEffect(() => {
    if (!active) return;
    // Scroll target into view only for non-fixed elements (fixed elements like the bottom tab
    // bar don't respond to scrollIntoView, and calling it on them scrolls the page body,
    // which can push other tour targets out of the viewport).
    if (currentStep?.targetId) {
      const el = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
      if (el) {
        const style = window.getComputedStyle(el);
        const isFixed = style.position === 'fixed' || style.position === 'sticky';
        if (!isFixed) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Re-measure multiple times after scroll settles
          setTimeout(measureTarget, 400);
          setTimeout(measureTarget, 800);
        }
      }
    }
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
    };
  }, [active, step, measureTarget, currentStep]);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setStep(0);
      onComplete();
    }
  };

  const handleSkip = () => {
    setStep(0);
    onComplete();
  };

  if (!active || !currentStep) return null;

  const pad = 8;
  const cutout = targetRect
    ? {
        x: targetRect.x - pad,
        y: targetRect.y - pad,
        w: targetRect.width + pad * 2,
        h: targetRect.height + pad * 2,
      }
    : null;

  // tooltip position — smart version with auto-flip and viewport clamping
  const gap = 12;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  // On mobile (< 480px), constrain tooltip width to viewport minus edge padding
  const tw = Math.min(320, vw - 32);
  // Conservative tooltip height estimate that accounts for multi-line descriptions
  const th = 200;
  const edgePad = 16;
  // Account for safe-area-inset-bottom — iOS devices add ~34px for home indicator.
  // We use a conservative 40px buffer when positioning above bottom-anchored elements.
  const safeBottomBuffer = 40;

  const computeTooltipPos = (): { style: React.CSSProperties; resolvedPos: TourStep['position'] } => {
    if (!targetRect) {
      return {
        style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
        resolvedPos: currentStep.position,
      };
    }

    let pos = currentStep.position;

    // Auto-flip if not enough space
    if (pos === 'top' && targetRect.top - gap - th < edgePad) pos = 'right';
    if (pos === 'bottom' && targetRect.bottom + gap + th > vh - edgePad) pos = 'top';
    if (pos === 'left' && targetRect.left - gap - tw < edgePad) pos = 'right';
    if (pos === 'right' && targetRect.right + gap + tw > vw - edgePad) pos = 'left';

    // On narrow screens, right/left positions often don't have enough room — fall back to top/bottom
    if (pos === 'right' && targetRect.right + gap + tw > vw - edgePad) pos = 'top';
    if (pos === 'left' && targetRect.left - gap - tw < edgePad) pos = 'bottom';

    // Clamped horizontal center: keep tooltip within viewport width
    const centerX = Math.max(edgePad, Math.min(vw - tw - edgePad, targetRect.left + targetRect.width / 2 - tw / 2));
    // Clamped vertical center: keep tooltip within viewport height
    const centerY = Math.max(edgePad, Math.min(vh - th - edgePad, targetRect.top + targetRect.height / 2 - th / 2));

    switch (pos) {
      case 'bottom':
        return {
          style: { top: targetRect.bottom + gap, left: centerX, width: tw },
          resolvedPos: pos,
        };
      case 'top': {
        // Place tooltip above the target, accounting for safe-area-inset-bottom on bottom-anchored elements.
        // Use `bottom` CSS property so tooltip grows upward from above the target.
        const bottomOffset = vh - targetRect.top + gap + safeBottomBuffer;
        // Clamp so tooltip doesn't go off the top edge
        const clampedBottom = Math.min(bottomOffset, vh - th - edgePad);
        return {
          style: { bottom: clampedBottom, left: centerX, width: tw },
          resolvedPos: pos,
        };
      }
      case 'right':
        return { style: { top: centerY, left: targetRect.right + gap, width: Math.min(280, vw - targetRect.right - gap - edgePad) }, resolvedPos: pos };
      case 'left':
        return { style: { top: centerY, right: vw - targetRect.left + gap, width: Math.min(280, targetRect.left - gap - edgePad) }, resolvedPos: pos };
    }
  };

  const { style: tooltipStyle, resolvedPos } = computeTooltipPos();

  // Animation y offset: slide in toward the target (tooltip above target slides up from below)
  const animInitialY = resolvedPos === 'top' ? 8 : resolvedPos === 'bottom' ? -8 : 0;
  const animInitialX = resolvedPos === 'left' ? 8 : resolvedPos === 'right' ? -8 : 0;

  return (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100]"
        onClick={handleNext}
      >
        {/* Dark overlay with cutout */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {cutout && (
                <rect
                  x={cutout.x}
                  y={cutout.y}
                  width={cutout.w}
                  height={cutout.h}
                  rx="16"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.55)"
            mask="url(#tour-mask)"
          />
        </svg>

        {/* Highlight border */}
        {cutout && (
          <motion.div
            layoutId="tour-highlight"
            className="absolute rounded-2xl border-2 border-primary pointer-events-none"
            style={{
              left: cutout.x,
              top: cutout.y,
              width: cutout.w,
              height: cutout.h,
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: animInitialY, x: animInitialX }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="absolute z-10 rounded-2xl bg-surface px-5 py-4 shadow-xl"
          style={tooltipStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow indicator */}
          <div className="flex items-center gap-2 mb-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
              {step + 1}
            </span>
            <span className="text-sm font-bold text-text">{currentStep.title}</span>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{currentStep.description}</p>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSkip();
              }}
              className="text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              건너뛰기
            </button>
            <div className="flex items-center gap-3">
              {/* Step dots */}
              <div className="flex gap-1">
                {TOUR_STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      i === step ? 'w-4 bg-primary' : 'w-1.5 bg-border'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90 active:scale-95 transition-all"
              >
                {step < TOUR_STEPS.length - 1 ? '다음' : '완료'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
