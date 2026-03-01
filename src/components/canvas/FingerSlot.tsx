'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import type { FingerPosition, FingerSelection } from '@/types/canvas';

interface FingerSlotProps {
  finger: FingerPosition;
  handLabel: string;
  selection?: FingerSelection;
  onTap: () => void;
  className?: string;
}

const FINGER_LABELS: Record<FingerPosition, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  pinky: '소지',
};

export function FingerSlot({ finger, handLabel, selection, onTap, className }: FingerSlotProps) {
  const hasColor = !!selection?.colorCode;
  const hasParts = selection?.parts && selection.parts.length > 0;
  const topPart = selection?.parts?.[0];

  return (
    <motion.button
      type="button"
      onClick={onTap}
      whileTap={{ scale: 0.93 }}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-200',
        'min-w-[60px] touch-manipulation',
        hasColor
          ? 'bg-surface shadow-md border-2 border-primary/40'
          : 'bg-surface-alt border-2 border-border',
        className,
      )}
      aria-label={`${handLabel} ${FINGER_LABELS[finger]}`}
    >
      {/* Iconic Finger/Nail preview */}
      <div className="relative w-10 h-12 flex items-center justify-center">
        {/* Finger Body (Clean capsule) */}
        <div 
          className={cn(
            'absolute inset-0 w-8 h-12 rounded-full border-2 transition-all duration-300',
            hasColor ? 'bg-surface border-primary/20' : 'bg-surface-alt border-border'
          )}
        />
        
        {/* Nail plate (Iconic shape) */}
        <div
          className={cn(
            'absolute top-1.5 w-6 h-6.5 rounded-t-full rounded-b-md border-1.5 transition-all duration-300',
            hasColor ? 'border-white shadow-sm' : 'border-border bg-surface',
          )}
          style={
            hasColor
              ? {
                  backgroundColor: selection.colorCode,
                  boxShadow: `0 2px 6px ${selection.colorCode}66`,
                }
              : {}
          }
        >
          {/* Nail shine */}
          {hasColor && (
            <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-white/40 pointer-events-none" />
          )}
        </div>

        {/* Parts badge */}
        {hasParts && topPart && (
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center shadow-sm z-10">
            <span className="text-white text-[9px] font-extrabold leading-none">
              {topPart.grade}
            </span>
          </div>
        )}

        {/* Point art indicator */}
        {selection?.isPoint && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 border border-white shadow-sm" />
        )}
      </div>

      {/* Finger name */}
      <span
        className={cn(
          'text-[11px] font-bold leading-none tracking-tight',
          hasColor ? 'text-primary' : 'text-text-muted',
        )}
      >
        {FINGER_LABELS[finger]}
      </span>
    </motion.button>
  );
}
