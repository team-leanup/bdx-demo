'use client';

import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { BODY_PART_OPTIONS } from '@/data/service-options';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT, useLocale } from '@/lib/i18n';

interface BodyPartSelectorProps {
  className?: string;
}

/**
 * Intuitive Hand Icon - Accurate anatomy in simple line style
 */
const HAND_ICON = (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    {/* Thumb - Angled out naturally */}
    <path
      d="M22 52 C14 48 10 42 12 38 C14 34 18 34 22 38 L28 44"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Fingers and Palm silhouette */}
    <path
      d="M28 68 C22 68 18 64 18 58 L18 42 C18 38 21 36 24 36 C27 36 30 38 30 42 L30 52 L30 26 C30 22 33 20 36 20 C39 20 42 22 42 26 L42 50 L42 22 C42 18 45 16 48 16 C51 16 54 18 54 22 L54 50 L54 28 C54 24 57 22 60 22 C63 22 66 24 66 28 L66 58 C66 68 56 72 42 72 C28 72 28 68 28 68 Z"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Intuitive Foot Icon - Clear sole shape and toe size difference
 */
const FOOT_ICON = (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
    {/* Detailed Sole Silhouette with Arch */}
    <path
      d="M32 74 C18 74 14 58 16 42 C18 28 28 24 38 24 C52 24 62 40 62 58 C62 70 48 74 32 74 Z"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Toes - Graduated sizes for instant recognition */}
    <g fill="currentColor">
      {/* Big Toe (Largest) */}
      <circle cx="44" cy="14" r="7.5" />
      {/* 2nd to 5th Toes (Decreasing) */}
      <circle cx="58" cy="19" r="5.5" />
      <circle cx="68" cy="28" r="4.5" />
      <circle cx="72" cy="40" r="3.5" />
      <circle cx="70" cy="52" r="3" />
    </g>
  </svg>
);

const ICONS: Record<string, React.ReactNode> = {
  hand: HAND_ICON,
  foot: FOOT_ICON,
};

// Korean labels for secondary display
const KO_LABELS: Record<string, string> = {
  hand: '핸드',
  foot: '페디큐어',
};

export function BodyPartSelector({ className }: BodyPartSelectorProps) {
  const bodyPart = useConsultationStore((s) => s.consultation.bodyPart);
  const setBodyPart = useConsultationStore((s) => s.setBodyPart);
  const t = useT();
  const locale = useLocale();

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} stroke="currentColor" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        </div>
        <p className="text-lg font-black text-text-secondary tracking-tight">시술 부위</p>
      </div>
      <div className="grid grid-cols-2 gap-5 md:gap-12">
        {BODY_PART_OPTIONS.map((opt) => {
          const isSelected = bodyPart === opt.value;
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileTap={{ scale: 0.94 }}
              onClick={() => setBodyPart(opt.value)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-6 py-12 px-8 rounded-[48px] border-2 transition-all duration-300',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary shadow-2xl shadow-primary/20'
                  : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:bg-surface-alt hover:text-text',
              )}
            >
              {/* Intuitive Hand/Foot SVG */}
              <span className={cn('transition-all duration-300 transform', isSelected ? 'text-primary scale-110' : 'text-text-muted/30')}>
                {ICONS[opt.value]}
              </span>
              {/* Labels */}
              <div className="flex flex-col items-center gap-1.5">
                <span className={cn('text-xl font-black tracking-tight', isSelected ? 'text-primary' : 'text-text')}>
                  {t(`bodyPart.${opt.value}`)}
                </span>
                {locale !== 'ko' && (
                  <span className="text-sm text-text-muted font-bold opacity-60">{KO_LABELS[opt.value]}</span>
                )}
                {opt.price && (
                  <span className={cn('text-sm font-black mt-3 px-5 py-2 rounded-full', isSelected ? 'bg-primary/20 text-primary' : 'bg-surface-alt text-text-muted')}>
                    {formatPrice(opt.price)}~
                  </span>
                )}
              </div>
              {isSelected && (
                <motion.span
                  initial={{ scale: 0, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  className="absolute top-6 right-6 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/40 border-4 border-white"
                >
                  <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6l2.5 2.5 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
