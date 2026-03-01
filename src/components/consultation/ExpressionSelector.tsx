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

// SVG icons: small base nail (left) + large magnifier loupe (right) showing zoomed detail
const EXPRESSION_ICONS: Record<string, (selected: boolean) => React.ReactNode> = {
  // ── 기본 (solid): 균일한 광택 강조 ──
  solid: (selected) => (
    <svg width="96" height="80" viewBox="0 0 96 80" fill="none">
      <defs>
        <clipPath id="s-lens"><circle cx="60" cy="40" r="22" /></clipPath>
      </defs>
      {/* Small base nail */}
      <path d="M6 60 C6 40 12 28 20 28 C28 28 34 40 34 60" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.04" strokeLinecap="round" />
      <path d="M9 56 Q9 32 20 32 Q31 32 31 56" fill="currentColor" fillOpacity={selected ? '0.35' : '0.1'} stroke="currentColor" strokeWidth="2" />
      <path d="M14 40 Q16 36 22 36" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      {/* ── Large magnifier ── */}
      <g clipPath="url(#s-lens)">
        <circle cx="60" cy="40" r="22" fill="currentColor" fillOpacity="0.05" />
        {/* Zoomed nail surface — uniform glossy coat */}
        <path d="M42 66 Q42 18 60 18 Q78 18 78 66" fill="currentColor" fillOpacity={selected ? '0.55' : '0.18'} />
        {/* Glossy highlight streaks */}
        <path d="M50 30 Q54 22 64 22" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        <path d="M52 40 Q55 34 62 34" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        <path d="M54 50 Q56 46 61 46" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
      </g>
      {/* Rim + handle */}
      <circle cx="60" cy="40" r="22" stroke="currentColor" strokeWidth="3.5" fill="none" opacity={selected ? '0.8' : '0.3'} />
      <line x1="76" y1="56" x2="88" y2="68" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" opacity={selected ? '0.8' : '0.3'} />
    </svg>
  ),

  // ── 그라데이션: 아래→위 색 번짐 강조 ──
  gradient: (selected) => (
    <svg width="96" height="80" viewBox="0 0 96 80" fill="none">
      <defs>
        <clipPath id="g-lens"><circle cx="60" cy="40" r="22" /></clipPath>
        <linearGradient id="g-zoom" x1="60" y1="66" x2="60" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity={selected ? '0.75' : '0.35'} />
          <stop offset="60%" stopColor="currentColor" stopOpacity="0.15" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="g-base" x1="20" y1="56" x2="20" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="currentColor" stopOpacity={selected ? '0.45' : '0.2'} />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Small base nail */}
      <path d="M6 60 C6 40 12 28 20 28 C28 28 34 40 34 60" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.04" strokeLinecap="round" />
      <path d="M9 56 Q9 32 20 32 Q31 32 31 56" fill="url(#g-base)" stroke="currentColor" strokeWidth="2" />
      {/* ── Large magnifier ── */}
      <g clipPath="url(#g-lens)">
        <circle cx="60" cy="40" r="22" fill="currentColor" fillOpacity="0.03" />
        {/* Zoomed gradient nail — clear color fade */}
        <path d="M42 66 Q42 18 60 18 Q78 18 78 66" fill="url(#g-zoom)" />
        {/* Soft blend rings to emphasize gradation */}
        <ellipse cx="60" cy="50" rx="14" ry="8" fill="currentColor" fillOpacity="0.12" />
        <ellipse cx="60" cy="42" rx="10" ry="6" fill="currentColor" fillOpacity="0.08" />
        <ellipse cx="60" cy="35" rx="6" ry="4" fill="currentColor" fillOpacity="0.05" />
      </g>
      <circle cx="60" cy="40" r="22" stroke="currentColor" strokeWidth="3.5" fill="none" opacity={selected ? '0.8' : '0.3'} />
      <line x1="76" y1="56" x2="88" y2="68" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" opacity={selected ? '0.8' : '0.3'} />
    </svg>
  ),

  // ── 프렌치: 팁 라인 경계 강조 ──
  french: (selected) => (
    <svg width="96" height="80" viewBox="0 0 96 80" fill="none">
      <defs>
        <clipPath id="f-lens"><circle cx="60" cy="40" r="22" /></clipPath>
      </defs>
      {/* Small base nail */}
      <path d="M6 60 C6 40 12 28 20 28 C28 28 34 40 34 60" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.04" strokeLinecap="round" />
      <path d="M9 56 Q9 32 20 32 Q31 32 31 56" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="2" />
      <path d="M9 44 Q9 32 20 32 Q31 32 31 44 L31 47 Q31 36 20 36 Q9 36 9 47 Z" fill="currentColor" fillOpacity={selected ? '0.4' : '0.18'} />
      {/* ── Large magnifier ── */}
      <g clipPath="url(#f-lens)">
        <circle cx="60" cy="40" r="22" fill="currentColor" fillOpacity="0.03" />
        {/* Zoomed nail base — nude */}
        <path d="M42 66 Q42 18 60 18 Q78 18 78 66" fill="currentColor" fillOpacity="0.06" />
        {/* Prominent white french tip */}
        <path d="M42 36 Q42 18 60 18 Q78 18 78 36 L78 42 Q78 26 60 26 Q42 26 42 42 Z" fill="currentColor" fillOpacity={selected ? '0.8' : '0.35'} />
        {/* Tip boundary line */}
        <path d="M42 36 Q42 18 60 18 Q78 18 78 36" stroke="currentColor" strokeWidth="2.5" opacity="0.6" />
        {/* Smile line curve */}
        <path d="M46 40 Q60 30 74 40" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.3" />
      </g>
      <circle cx="60" cy="40" r="22" stroke="currentColor" strokeWidth="3.5" fill="none" opacity={selected ? '0.8' : '0.3'} />
      <line x1="76" y1="56" x2="88" y2="68" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" opacity={selected ? '0.8' : '0.3'} />
    </svg>
  ),

  // ── 마그네틱/캣아이: 대각선 쉬머 라인 강조 ──
  magnetic: (selected) => (
    <svg width="96" height="80" viewBox="0 0 96 80" fill="none">
      <defs>
        <clipPath id="m-lens"><circle cx="60" cy="40" r="22" /></clipPath>
      </defs>
      {/* Small base nail */}
      <path d="M6 60 C6 40 12 28 20 28 C28 28 34 40 34 60" stroke="currentColor" strokeWidth="2.5" fill="currentColor" fillOpacity="0.04" strokeLinecap="round" />
      <path d="M9 56 Q9 32 20 32 Q31 32 31 56" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
      <path d="M11 52 Q20 40 29 32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity={selected ? '0.5' : '0.2'} />
      {/* ── Large magnifier ── */}
      <g clipPath="url(#m-lens)">
        <circle cx="60" cy="40" r="22" fill="currentColor" fillOpacity="0.1" />
        {/* Dark base coat */}
        <path d="M42 66 Q42 18 60 18 Q78 18 78 66" fill="currentColor" fillOpacity="0.15" />
        {/* Bold diagonal cat-eye shimmer */}
        <path d="M42 60 Q60 36 78 24" stroke="currentColor" strokeWidth="10" strokeLinecap="round" opacity={selected ? '0.7' : '0.3'} />
        <path d="M42 60 Q60 36 78 24" stroke="white" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
        {/* Sparkle highlights */}
        <circle cx="68" cy="30" r="3" fill="white" opacity="0.85" />
        <circle cx="72" cy="34" r="1.5" fill="white" opacity="0.5" />
        <circle cx="52" cy="52" r="2" fill="white" opacity="0.4" />
        <circle cx="48" cy="56" r="1" fill="white" opacity="0.3" />
      </g>
      <circle cx="60" cy="40" r="22" stroke="currentColor" strokeWidth="3.5" fill="none" opacity={selected ? '0.8' : '0.3'} />
      <line x1="76" y1="56" x2="88" y2="68" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" opacity={selected ? '0.8' : '0.3'} />
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
