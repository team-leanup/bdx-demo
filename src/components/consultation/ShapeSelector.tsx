'use client';

import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { NAIL_SHAPE_OPTIONS } from '@/data/service-options';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';
import type { NailShape } from '@/types/consultation';

interface ShapeSelectorProps {
  className?: string;
}

// High-fidelity nail shape SVGs — large, clear outlines with fill
const SHAPE_ICONS: Record<NailShape, (selected: boolean) => React.ReactNode> = {
  round: (selected) => (
    <svg viewBox="0 0 40 56" fill="none" className="w-10 h-14">
      {/* Nail body */}
      <rect x="6" y="26" width="28" height="26" rx="3"
        fill={selected ? 'currentColor' : 'currentColor'} fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      {/* Round tip */}
      <path d="M6 26 Q6 6 20 6 Q34 6 34 26"
        fill={selected ? 'currentColor' : 'currentColor'} fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      {/* Nail shine */}
      <path d="M12 16 Q14 10 20 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  oval: (selected) => (
    <svg viewBox="0 0 40 56" fill="none" className="w-10 h-14">
      <rect x="8" y="30" width="24" height="22" rx="3"
        fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      {/* Taller, narrower oval tip */}
      <path d="M8 30 Q8 4 20 4 Q32 4 32 30"
        fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      <path d="M13 18 Q15 10 20 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  square: (selected) => (
    <svg viewBox="0 0 40 56" fill="none" className="w-10 h-14">
      {/* Perfect flat top */}
      <rect x="6" y="8" width="28" height="44" rx="3"
        fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      {/* Flat top line emphasis */}
      <line x1="6" y1="8" x2="34" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M11 18 Q13 13 18 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  squoval: (selected) => (
    <svg viewBox="0 0 40 56" fill="none" className="w-10 h-14">
      <rect x="6" y="24" width="28" height="28" rx="3"
        fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      {/* Softened square tip — rounded corners but mostly flat */}
      <path d="M6 24 Q6 8 12 8 L28 8 Q34 8 34 24"
        fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      <path d="M11 16 Q13 10 18 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  almond: (selected) => (
    <svg viewBox="0 0 40 56" fill="none" className="w-10 h-14">
      <rect x="9" y="32" width="22" height="20" rx="3"
        fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      {/* Pointed almond tip */}
      <path d="M9 32 Q9 8 20 4 Q31 8 31 32"
        fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      <path d="M14 20 Q16 10 20 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  stiletto: (selected) => (
    <svg viewBox="0 0 40 56" fill="none" className="w-10 h-14">
      <rect x="11" y="34" width="18" height="18" rx="3"
        fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      {/* Very sharp stiletto point */}
      <path d="M11 34 Q11 10 20 2 Q29 10 29 34"
        fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      <path d="M15 22 Q17 10 20 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  coffin: (selected) => (
    <svg viewBox="0 0 40 56" fill="none" className="w-10 h-14">
      {/* Wide base */}
      <rect x="6" y="32" width="28" height="20" rx="3"
        fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2"
      />
      {/* Tapered sides + flat top — coffin/ballerina shape */}
      <path d="M6 32 L11 8 L29 8 L34 32"
        fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'}
        stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
      />
      {/* Flat top line */}
      <line x1="11" y1="8" x2="29" y2="8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M14 20 Q16 13 20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
};

export function ShapeSelector({ className }: ShapeSelectorProps) {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const nailShape = useConsultationStore((s) => s.consultation.nailShape);
  const setNailShape = useConsultationStore((s) => s.setNailShape);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-xl bg-surface-alt flex items-center justify-center flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} stroke="currentColor" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </div>
        <p className="text-sm font-bold text-text-secondary">
          {t('selector.nailShape')}
          {locale !== 'ko' && <span className="ml-2 text-xs font-medium text-text-muted opacity-60">{tKo('selector.nailShape')}</span>}
        </p>
      </div>
      <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
        {NAIL_SHAPE_OPTIONS.map((opt) => {
          const isSelected = nailShape === opt.value;
          const shape = opt.value as NailShape;
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => setNailShape(shape)}
              className={cn(
                'relative flex flex-col items-center gap-2 pt-4 pb-3 px-2 rounded-2xl transition-all duration-200 touch-manipulation',
                isSelected
                  ? 'border-2 border-primary bg-white shadow-sm'
                  : 'border border-border bg-white hover:border-gray-300',
              )}
            >
              {/* Shape icon — primary visual */}
              <span className={cn('transition-all duration-300 transform inline-block', isSelected ? 'scale-110' : 'opacity-50')}>
                {SHAPE_ICONS[shape](isSelected)}
              </span>
              {/* Label */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[11px] font-bold leading-tight text-center">
                  {t(`shape.${opt.value}`)}
                </span>
                {/* Korean secondary label — shown only in non-Korean mode */}
                {locale !== 'ko' && (
                  <span className="text-[9px] text-text-muted leading-none font-medium">
                    {tKo(`shape.${opt.value}`)}
                  </span>
                )}
              </div>
              {/* Selected checkmark */}
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
