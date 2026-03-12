'use client';

import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { DESIGN_SCOPE_OPTIONS } from '@/data/service-options';
import { formatPrice, formatLocaleCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';

interface DesignScopeSelectorProps {
  className?: string;
}

// Context-aware SVG icons for each design scope
const DESIGN_ICONS: Record<string, (selected: boolean) => React.ReactNode> = {
  solid_tone: (selected) => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="solid-grad-v3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d="M20 60 L20 35 C20 25 25 22 32 22 C39 22 44 25 44 35 L44 60" stroke="currentColor" strokeWidth="3.5" fill="url(#solid-grad-v3)" strokeLinecap="round" />
      <rect x="24" y="14" width="16" height="24" rx="8" fill="currentColor" fillOpacity={selected ? '0.7' : '0.2'} stroke="currentColor" strokeWidth="3" />
      <path d="M28 20 Q30 16 34 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  solid_point: (selected) => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="8" y="24" width="18" height="28" rx="9" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.1" />
      <rect x="34" y="16" width="22" height="34" rx="11" stroke="currentColor" strokeWidth="3.5" fill="currentColor" fillOpacity={selected ? '0.6' : '0.3'} />
      <path d="M45 22 L47 18 L49 22 L53 24 L49 26 L47 30 L45 26 L41 24 Z" fill="white" />
      <circle cx="40" cy="34" r="2" fill="white" opacity="0.6" />
    </svg>
  ),
  full_art: (selected) => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <g stroke="currentColor" strokeWidth="2.5">
        <rect x="6" y="28" width="14" height="22" rx="7" fill="currentColor" fillOpacity="0.1" transform="rotate(-10 13 39)" />
        <path d="M8 32 L18 36 M9 38 L19 42" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        <rect x="44" y="28" width="14" height="22" rx="7" fill="currentColor" fillOpacity="0.1" transform="rotate(10 51 39)" />
        <path d="M46 32 Q51 28 56 32" stroke="currentColor" strokeWidth="2" />
        <rect x="22" y="18" width="20" height="32" rx="10" strokeWidth="3.5" fill="currentColor" fillOpacity={selected ? '0.7' : '0.2'} />
        <circle cx="32" cy="28" r="3" fill="white" />
        <circle cx="32" cy="38" r="2" fill="white" opacity="0.6" />
        <path d="M28 28 L36 28 M32 24 L32 32" stroke="white" strokeWidth="1" opacity="0.5" />
      </g>
    </svg>
  ),
  monthly_art: (selected) => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" fill="currentColor" fillOpacity="0.03" />
      <rect x="20" y="16" width="24" height="32" rx="4" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity={selected ? '0.6' : '0.2'} />
      <path d="M42 12 L44 18 L50 18 L45 22 L47 28 L42 24 L37 28 L39 22 L34 18 L40 18 Z" fill="var(--color-primary)" />
      <path d="M26 28 Q32 24 38 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
};

const DESIGN_I18N_KEYS: Record<string, string> = {
  solid_tone: 'design.solidTone',
  solid_point: 'design.solidPoint',
  full_art: 'design.fullArt',
  monthly_art: 'design.monthlyArt',
};

export function DesignScopeSelector({ className }: DesignScopeSelectorProps) {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const designScope = useConsultationStore((s) => s.consultation.designScope);
  const setDesignScope = useConsultationStore((s) => s.setDesignScope);

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-xl bg-surface-alt flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} stroke="currentColor" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
        </div>
        <p className="text-lg font-black text-text-secondary tracking-tight">
          {t('selector.designScope')}
          {locale !== 'ko' && <span className="ml-2 text-xs font-medium text-text-muted opacity-60">{tKo('selector.designScope')}</span>}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-5 md:gap-10">
        {DESIGN_SCOPE_OPTIONS.map((opt) => {
          const isSelected = designScope === opt.value;
          const isMonthly = opt.value === 'monthly_art';

          return (
            <motion.button
              key={opt.value}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setDesignScope(opt.value)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-5 py-7 px-4 md:py-10 md:px-6 rounded-2xl transition-all duration-300 text-left',
                isSelected
                  ? 'border-2 border-primary bg-white shadow-sm'
                  : 'border border-border bg-white text-text-muted hover:border-gray-300',
              )}
            >
              {/* Context-Aware Iconic Visual */}
              <span className={cn('transition-all duration-300 transform', isSelected ? 'text-primary scale-110' : 'opacity-50')}>
                {DESIGN_ICONS[opt.value]?.(isSelected)}
              </span>

              {/* Text labels */}
              <div className="flex flex-col items-center gap-1 w-full">
                <div className="flex flex-col items-center">
                  <span className={cn('text-lg font-black tracking-tight text-center', isSelected ? 'text-primary' : 'text-text')}>
                    {t(DESIGN_I18N_KEYS[opt.value])}
                  </span>
                </div>

                {/* Secondary description */}
                <div className="flex flex-col items-center gap-0.5">
                  {isMonthly ? (
                    <>
                      <span className="text-[10px] text-primary/70 text-center font-bold italic">
                        {t('design.monthlyArt')}
                      </span>
                      {locale !== 'ko' && (
                        <span className="text-xs text-text-muted text-center font-bold opacity-60">
                          {tKo(DESIGN_I18N_KEYS[opt.value])}
                        </span>
                      )}
                    </>
                  ) : (
                    locale !== 'ko' && (
                      <span className="text-xs text-text-muted text-center font-bold opacity-60">
                        {tKo(DESIGN_I18N_KEYS[opt.value])}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Price badge */}
              <div className={cn(
                'px-5 py-2 rounded-full text-sm font-black tracking-tight',
                isSelected
                  ? 'bg-surface-alt border border-primary text-primary'
                  : 'bg-surface-alt text-text-muted',
              )}>
                {opt.price === 0 ? t('selector.includedFree') : (
                  <>
                    +{locale !== 'ko' ? formatLocaleCurrency(opt.price!, locale) : formatPrice(opt.price!)}
                    {locale !== 'ko' && <span className="text-[9px] opacity-50 ml-0.5">{formatPrice(opt.price!)}</span>}
                  </>
                )}
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <motion.span
                  initial={{ scale: 0, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  className="absolute top-6 right-6 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-sm border-4 border-white"
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
