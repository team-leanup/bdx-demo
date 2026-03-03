'use client';

import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { OFF_TYPE_OPTIONS } from '@/data/service-options';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';

interface OffSelectorProps {
  className?: string;
}

// Iconic visuals for Off (Removal) - SVG icons only (badges rendered as HTML overlay)
const OFF_ICONS: Record<string, (selected: boolean) => React.ReactNode> = {
  // none: Natural clean nail with a "None" slash
  none: (selected) => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <rect x="22" y="24" width="20" height="26" rx="10" fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'} stroke="currentColor" strokeWidth="2" />
      <path d="M22 24 Q22 14 32 14 Q42 14 42 24" fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'} stroke="currentColor" strokeWidth="2" />
      <line x1="15" y1="45" x2="49" y2="15" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3" />
    </svg>
  ),
  // same_shop: Focus on "Home/Our Shop" with a heart (Loyalty)
  same_shop: (selected) => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M14 52 L14 32 L32 16 L50 32 L50 52 Z" fill="currentColor" fillOpacity={selected ? '0.15' : '0.05'} stroke="currentColor" strokeWidth="2" />
      <path d="M26 52 L26 40 L38 40 L38 52" stroke="currentColor" strokeWidth="2" />
      <path d="M32 35 C32 35 30 31 28 31 C26 31 25 33 25 35 C25 38 32 42 32 42 C32 42 39 38 39 35 C39 33 38 31 36 31 C34 31 32 35 32 35" fill="var(--color-primary)" fillOpacity={selected ? '1' : '0.3'} />
    </svg>
  ),
  // other_shop: Focus on "Transition" - From dotted shop to our shop
  other_shop: (selected) => (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      <path d="M6 46 L6 34 L16 26 L26 34 L26 46 Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.4" />
      <path d="M28 36 L40 36 M36 32 L40 36 L36 40" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 46 L42 26 L54 16 L66 26 L66 46" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.05" />
    </svg>
  ),
};

// Badge config per off type
const OFF_BADGE_CONFIG: Record<string, { key: string; colorType: 'primary' | 'text' } | null> = {
  none: null,
  same_shop: { key: 'consultation.selfBadge', colorType: 'primary' },
  other_shop: { key: 'consultation.otherBadge', colorType: 'text' },
};

// i18n key mapping
const OFF_I18N_KEYS: Record<string, string> = {
  none: 'off.none',
  same_shop: 'off.sameShop',
  other_shop: 'off.otherShop',
};

export function OffSelector({ className }: OffSelectorProps) {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const offType = useConsultationStore((s) => s.consultation.offType);
  const setOffType = useConsultationStore((s) => s.setOffType);

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="flex items-center gap-2.5 px-2">
        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} stroke="currentColor" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>
        <p className="text-base font-black text-text-secondary tracking-tight">
          {t('selector.offType')}
          {locale !== 'ko' && <span className="ml-2 text-xs font-medium text-text-muted opacity-60">{tKo('selector.offType')}</span>}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-3">
        {OFF_TYPE_OPTIONS.map((opt) => {
          const isSelected = offType === opt.value;
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setOffType(opt.value)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-4 py-8 px-2 rounded-[40px] border-2 transition-all duration-300 text-left',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary shadow-2xl shadow-primary/15'
                  : 'border-border bg-surface text-text-muted hover:border-primary/40 hover:bg-surface-alt',
              )}
            >
              {/* Context-Aware Iconic Visual */}
              <span className={cn('relative transition-all duration-300 transform', isSelected ? 'scale-110' : 'opacity-60 grayscale-[0.5]')}>
                {OFF_ICONS[opt.value](isSelected)}
                {OFF_BADGE_CONFIG[opt.value] && (() => {
                  const badge = OFF_BADGE_CONFIG[opt.value]!;
                  const isPrimary = badge.colorType === 'primary';
                  return (
                    <span
                      className={cn(
                        'absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 px-2.5 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap border-[1.5px] leading-tight',
                        isPrimary
                          ? isSelected ? 'bg-primary-dark text-white border-primary' : 'bg-surface text-primary border-primary'
                          : isSelected ? 'bg-text text-white border-text' : 'bg-surface text-text border-text',
                      )}
                    >
                      {t(badge.key)}
                    </span>
                  );
                })()}
              </span>

              {/* Labels */}
              <div className="flex flex-col items-center gap-1.5 w-full">
                <span className={cn('text-sm font-black tracking-tight text-center', isSelected ? 'text-primary' : 'text-text')}>
                  {t(OFF_I18N_KEYS[opt.value])}
                </span>
                {/* Korean secondary label — shown only in non-Korean mode */}
                {locale !== 'ko' && (
                  <span className="text-[10px] text-text-muted text-center font-bold opacity-70">
                    {tKo(OFF_I18N_KEYS[opt.value])}
                  </span>
                )}
                {opt.price !== undefined && opt.price > 0 && (
                  <span className={cn('text-[11px] font-black mt-1 px-3 py-1 rounded-full', isSelected ? 'bg-primary/20 text-primary' : 'bg-surface-alt text-text-muted')}>
                    +{formatPrice(opt.price)}
                  </span>
                )}
                {opt.price === 0 && (
                  <span className={cn('text-[11px] font-bold mt-1 px-2 py-0.5 rounded-full bg-surface-alt text-text-muted opacity-60')}>
                    {t('selector.includedFree')}
                  </span>
                )}
              </div>

              {/* Selected checkmark */}
              {isSelected && (
                <motion.span
                  initial={{ scale: 0, y: 5 }}
                  animate={{ scale: 1, y: 0 }}
                  className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
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
