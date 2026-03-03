'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import type { FingerPosition, FingerSelection } from '@/types/canvas';

interface HandSwitcherProps {
  activeHand: 'left' | 'right';
  leftSelections: Partial<Record<FingerPosition, FingerSelection>>;
  rightSelections: Partial<Record<FingerPosition, FingerSelection>>;
  onSwitch: (hand: 'left' | 'right') => void;
  className?: string;
}

function countSelected(selections: Partial<Record<FingerPosition, FingerSelection>>): number {
  return Object.values(selections).filter((s) => s?.colorCode).length;
}

export function HandSwitcher({
  activeHand,
  leftSelections,
  rightSelections,
  onSwitch,
  className,
}: HandSwitcherProps) {
  const t = useT();
  const leftCount = countSelected(leftSelections);
  const rightCount = countSelected(rightSelections);

  return (
    <div
      className={cn(
        'relative flex items-center bg-surface-alt rounded-2xl p-1 gap-1',
        className,
      )}
    >
      {/* Sliding indicator */}
      <motion.div
        layout
        layoutId="hand-indicator"
        className="absolute h-[calc(100%-8px)] rounded-xl bg-surface shadow-sm border border-border"
        style={{
          width: 'calc(50% - 6px)',
          left: activeHand === 'left' ? '4px' : 'calc(50% + 2px)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />

      {(['left', 'right'] as const).map((hand) => {
        const isActive = activeHand === hand;
        const count = hand === 'left' ? leftCount : rightCount;

        return (
          <button
            key={hand}
            type="button"
            onClick={() => onSwitch(hand)}
            className={cn(
              'relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl',
              'transition-all duration-200',
              isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary',
            )}
          >
            {/* New Iconic Hand/Finger Icon */}
            <svg
              className="w-5 h-5 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transform: hand === 'left' ? 'scaleX(-1)' : 'none' }}
            >
              <path d="M18 11V6a2 2 0 00-2-2v0a2 2 0 00-2 2v5" />
              <path d="M14 10V4a2 2 0 00-2-2v0a2 2 0 00-2 2v9" />
              <path d="M10 10.5V6a2 2 0 00-2-2v0a2 2 0 00-2 2v8" />
              <path d="M18 8a2 2 0 114 0v6a8 8 0 01-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 012.83-2.82L7 15" />
            </svg>

            <span className="text-sm font-extrabold tracking-tight">
              {hand === 'left' ? t('canvas.leftHand') : t('canvas.rightHand')}
            </span>

            {/* Count badge */}
            <motion.span
              key={count}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                'text-[10px] font-black min-w-[28px] h-5 rounded-full flex items-center justify-center shadow-sm px-1',
                count > 0
                  ? isActive ? 'bg-primary text-white' : 'bg-border text-text-muted'
                  : 'bg-surface-alt text-text-muted/50',
              )}
            >
              {count}/5
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}
