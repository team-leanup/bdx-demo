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

const HAND_ICON = <span className="text-[64px] leading-none">🤚</span>;
const FOOT_ICON = <span className="text-[64px] leading-none">🦶</span>;

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
