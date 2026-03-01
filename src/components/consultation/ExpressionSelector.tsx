'use client';

import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { EXPRESSION_OPTIONS } from '@/data/service-options';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT, useLocale } from '@/lib/i18n';
import type { ExpressionType } from '@/types/consultation';

interface ExpressionSelectorProps {
  className?: string;
}

// Visual SVG icons for each expression type - Refined with zoomed details
const EXPRESSION_ICONS: Record<string, (selected: boolean) => React.ReactNode> = {
  // 기본 (solid): Zoomed-in glossy nail tip
  solid: (selected) => (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <defs>
        <linearGradient id="solid-zoom-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Zoomed Finger Tip */}
      <path d="M12 50 C12 30 18 20 28 20 C38 20 44 30 44 50" stroke="currentColor" strokeWidth="4" fill="url(#solid-zoom-grad)" strokeLinecap="round" />
      {/* Solid Glossy Nail */}
      <path d="M16 45 Q16 25 28 25 Q40 25 40 45" fill="currentColor" fillOpacity={selected ? '0.7' : '0.2'} stroke="currentColor" strokeWidth="3" />
      {/* Highlight */}
      <path d="M22 32 Q24 28 30 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  // 그라데이션: Zoomed tip showing color blend
  gradient: (selected) => (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <defs>
        <linearGradient id="grad-zoom-fill" x1="28" y1="50" x2="28" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity={selected ? '0.8' : '0.4'} />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      {/* Zoomed Finger Tip */}
      <path d="M12 50 C12 30 18 20 28 20 C38 20 44 30 44 50" stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.05" strokeLinecap="round" />
      {/* Gradient Nail Area */}
      <path d="M16 45 Q16 25 28 25 Q40 25 40 45" fill="url(#grad-zoom-fill)" stroke="currentColor" strokeWidth="3" />
      {/* Blend details */}
      <circle cx="28" cy="35" r="8" fill="currentColor" fillOpacity="0.1" />
      <circle cx="28" cy="35" r="4" fill="currentColor" fillOpacity="0.15" />
    </svg>
  ),
  // 프렌치: Zoomed focus on the tip line
  french: (selected) => (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      {/* Zoomed Finger Tip */}
      <path d="M12 50 C12 30 18 20 28 20 C38 20 44 30 44 50" stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.05" strokeLinecap="round" />
      {/* Nude Nail Base */}
      <path d="M16 45 Q16 25 28 25 Q40 25 40 45" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="3" />
      {/* French Tip - Bold emphasis */}
      <path d="M16 38 Q16 25 28 25 Q40 25 40 38 L40 42 Q40 30 28 30 Q16 30 16 42 Z" fill="currentColor" fillOpacity={selected ? '0.8' : '0.4'} />
      <path d="M16 38 Q16 25 28 25 Q40 25 40 38" stroke="currentColor" strokeWidth="3" />
    </svg>
  ),
  // 마그네틱: Zoomed focus on the cat-eye shimmer line
  magnetic: (selected) => (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      {/* Zoomed Finger Tip */}
      <path d="M12 50 C12 30 18 20 28 20 C38 20 44 30 44 50" stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.05" strokeLinecap="round" />
      {/* Dark Base */}
      <path d="M16 45 Q16 25 28 25 Q40 25 40 45" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="3" />
      {/* Shimmer Cat-Eye Line */}
      <path d="M18 42 Q28 30 38 22" stroke="currentColor" strokeWidth="6" strokeLinecap="round" opacity={selected ? '0.9' : '0.5'} />
      <path d="M18 42 Q28 30 38 22" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      {/* Extra Sparkle */}
      <circle cx="34" cy="28" r="2" fill="white" opacity="0.8" />
    </svg>
  ),
};

// Korean labels for secondary display
const KO_EXPR_LABELS: Record<string, string> = {
  solid: '기본',
  gradient: '그라데이션',
  french: '프렌치',
  magnetic: '마그네틱/캣아이',
};

// i18n key mapping for expression labels
const EXPR_I18N_KEYS: Record<string, string> = {
  solid: 'expression.solid',
  gradient: 'expression.gradient',
  french: 'expression.french',
  magnetic: 'expression.magnetic',
};

export function ExpressionSelector({ className }: ExpressionSelectorProps) {
  const t = useT();
  const locale = useLocale();
  const expressions = useConsultationStore((s) => s.consultation.expressions);
  const toggleExpression = useConsultationStore((s) => s.toggleExpression);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} stroke="currentColor" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
            </svg>
          </div>
          <p className="text-sm font-extrabold text-text-secondary tracking-tight">발색 방법</p>
        </div>
        <span className="text-[10px] font-black text-text-muted bg-surface-alt px-3 py-1 rounded-full border border-border uppercase tracking-widest">복수 선택 가능</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {EXPRESSION_OPTIONS.map((opt) => {
          const isSelected = expressions.includes(opt.value as ExpressionType);
          const isPro = opt.value === 'magnetic';
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => toggleExpression(opt.value as ExpressionType)}
              className={cn(
                'relative flex flex-col items-center gap-4 py-8 px-4 rounded-[40px] border-2 transition-all duration-300',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary shadow-xl shadow-primary/15'
                  : 'border-border bg-surface text-text-muted hover:border-primary/30',
              )}
            >
              {/* PRO badge */}
              {isPro && (
                <span className="absolute top-4 right-4 px-2 py-0.5 text-[9px] font-black bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full uppercase tracking-wider shadow-sm">
                  PRO
                </span>
              )}

              {/* Large Zoomed Icon */}
              <span className={cn('transition-all duration-300 transform', isSelected ? 'scale-110' : 'opacity-50 grayscale-[0.5]')}>
                {EXPRESSION_ICONS[opt.value]?.(isSelected)}
              </span>

              {/* Labels */}
              <div className="flex flex-col items-center gap-1">
                <span className={cn('text-base font-black tracking-tight', isSelected ? 'text-primary' : 'text-text')}>
                  {t(EXPR_I18N_KEYS[opt.value])}
                </span>
                {locale !== 'ko' && (
                  <span className="text-xs text-text-muted font-bold opacity-70">{KO_EXPR_LABELS[opt.value]}</span>
                )}
              </div>

              {/* Price chip */}
              <span className={cn(
                'text-xs font-black px-4 py-1.5 rounded-full tracking-tight',
                isSelected
                  ? 'bg-primary/20 text-primary'
                  : 'bg-surface-alt text-text-muted',
              )}>
                {opt.price === 0 ? '포함' : opt.price !== undefined ? `+${formatPrice(opt.price)}` : ''}
              </span>

              {/* Selected checkmark */}
              {isSelected && (
                <motion.span
                  initial={{ scale: 0, y: 5 }}
                  animate={{ scale: 1, y: 0 }}
                  className="absolute top-4 left-4 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white"
                >
                  <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
