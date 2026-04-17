'use client';

import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { BODY_PART_OPTIONS } from '@/data/service-options';
import { formatPrice, formatLocaleCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';

interface BodyPartSelectorProps {
  className?: string;
}

const HAND_ICON = (
  <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
  </svg>
);
const FOOT_ICON = (
  <svg width="72" height="72" viewBox="90 -15 320 520" fill="none" stroke="currentColor" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round">
    <path d="M184.231,239.9c43.9,23.3,64.5,75.4,49.8,123.3c-2.7,8.6-5.1,17.5-7,26.4c-7.8,40,2.7,90.2,46.7,99.1c22.2,4.7,44.3-3.9,59.9-20.2c46.5-50.5,32.3-202.6,31.9-240.7c0-16.7-0.4-33.8-7-49.4c-14.8-35-56.4-49-93.3-58.7c-60.6-22.1-98.8,5.8-111.6,26.4S131.531,212.5,184.231,239.9z" />
    <ellipse cx="141.831" cy="44.3" rx="31.5" ry="44.3" />
    <ellipse cx="214.631" cy="51.7" rx="18.7" ry="26.4" />
    <ellipse cx="272.931" cy="68" rx="16.7" ry="23.3" />
    <ellipse cx="326.131" cy="81.7" rx="14.8" ry="20.6" />
    <ellipse transform="matrix(-0.2014 0.9795 -0.9795 -0.2014 546.9331 -227.4809)" cx="366.2" cy="109.218" rx="18.3" ry="13.2" />
  </svg>
);

const ICONS: Record<string, React.ReactNode> = {
  hand: HAND_ICON,
  foot: FOOT_ICON,
};

export function BodyPartSelector({ className }: BodyPartSelectorProps) {
  const bodyPart = useConsultationStore((s) => s.consultation.bodyPart);
  const setBodyPart = useConsultationStore((s) => s.setBodyPart);
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <div className="flex items-center gap-3 px-2">
        <div className="w-8 h-8 rounded-xl bg-surface-alt flex items-center justify-center flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} stroke="currentColor" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
          </svg>
        </div>
        <p className="text-lg font-bold text-text-secondary tracking-tight">
          {t('selector.bodyPart')}
          {locale !== 'ko' && <span className="ml-2 text-xs font-medium text-text-muted opacity-60">{tKo('selector.bodyPart')}</span>}
        </p>
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
                'relative flex flex-col items-center justify-center gap-6 py-5 px-4 sm:py-8 sm:px-6 md:py-12 md:px-8 rounded-2xl transition-all duration-300',
                isSelected
                  ? 'border-2 border-primary bg-white shadow-sm'
                  : 'border border-border bg-white hover:border-gray-300',
              )}
            >
              {/* Intuitive Hand/Foot SVG */}
              <span className={cn('transition-all duration-300 transform', isSelected ? 'text-primary scale-110' : 'opacity-50')}>
                {ICONS[opt.value]}
              </span>
              {/* Labels */}
              <div className="flex flex-col items-center gap-1.5">
                <span className={cn('text-xl font-bold', isSelected ? 'text-primary' : 'text-text')}>
                  {t(`bodyPart.${opt.value}`)}
                </span>
                {locale !== 'ko' && (
                  <span className="text-sm text-text-muted font-bold opacity-60">{tKo(`bodyPart.${opt.value}`)}</span>
                )}
                {opt.price && (
                  <span className={cn('text-sm font-bold mt-3 px-5 py-2 rounded-full', isSelected ? 'bg-gray-100 text-primary' : 'bg-surface-alt text-text-muted')}>
                    {locale !== 'ko' ? formatLocaleCurrency(opt.price, locale) : formatPrice(opt.price)}~
                    {locale !== 'ko' && <span className="text-[9px] opacity-50 ml-0.5">{formatPrice(opt.price)}</span>}
                  </span>
                )}
              </div>
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
