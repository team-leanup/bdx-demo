'use client';

import { motion } from 'framer-motion';
import { useConsultationStore } from '@/store/consultation-store';
import { Counter } from '@/components/ui';
import { EXTENSION_TYPE_OPTIONS } from '@/data/service-options';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useT, useLocale, useKo } from '@/lib/i18n';

interface ExtensionSelectorProps {
  className?: string;
}

// Iconic visuals for Extension/Repair
const EXT_ICONS: Record<string, (selected: boolean) => React.ReactNode> = {
  // none: Natural clean nail
  none: (selected) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="14" y="20" width="20" height="24" rx="10" fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'} stroke="currentColor" strokeWidth="2" />
      <path d="M14 20 Q14 10 24 10 Q34 10 34 20" fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'} stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  // repair: Nail with a subtle "fix" or band-aid cross
  repair: (selected) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <rect x="14" y="20" width="20" height="24" rx="10" fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'} stroke="currentColor" strokeWidth="2" />
      <path d="M14 20 Q14 10 24 10 Q34 10 34 20" fill="currentColor" fillOpacity={selected ? '0.2' : '0.08'} stroke="currentColor" strokeWidth="2" />
      {/* Plus/Fix symbol */}
      <path d="M20 18 L28 18 M24 14 L24 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  // extension: Nail being lengthened (arrow up / dashed extension)
  extension: (selected) => (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      {/* Base nail */}
      <rect x="14" y="26" width="20" height="18" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" />
      {/* Extended part */}
      <path d="M14 26 Q14 4 24 4 Q34 4 34 26" fill="currentColor" fillOpacity={selected ? '0.4' : '0.2'} stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
      {/* Arrow up indicator */}
      <path d="M24 18 L24 8 M21 11 L24 8 L27 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

// i18n key mapping for extension option labels
const EXT_OPTION_I18N_KEYS: Record<string, string> = {
  none: 'off.none',
  repair: 'consultation.repair',
  extension: 'consultation.extension',
};

export function ExtensionSelector({ className }: ExtensionSelectorProps) {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const extensionType = useConsultationStore((s) => s.consultation.extensionType);
  const repairCount = useConsultationStore((s) => s.consultation.repairCount ?? 1);
  const setExtensionType = useConsultationStore((s) => s.setExtensionType);
  const setRepairCount = useConsultationStore((s) => s.setRepairCount);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div className="flex items-center gap-2.5 px-1">
        <div className="w-7 h-7 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-primary">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} stroke="currentColor" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
        <p className="text-sm font-extrabold text-text-secondary tracking-tight">
          {t('selector.extensionRepair')}
          {locale !== 'ko' && <span className="ml-2 text-xs font-medium text-text-muted opacity-60">{tKo('selector.extensionRepair')}</span>}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {EXTENSION_TYPE_OPTIONS.map((opt) => {
          const isSelected = extensionType === opt.value;
          return (
            <motion.button
              key={opt.value}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setExtensionType(opt.value)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-3 py-6 px-2 rounded-3xl border-2 transition-all duration-300',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/10'
                  : 'border-border bg-surface text-text-muted hover:border-primary/30',
              )}
            >
              {/* Icon */}
              <span className={cn('transition-transform duration-300', isSelected ? 'scale-110' : 'opacity-60')}>
                {EXT_ICONS[opt.value](isSelected)}
              </span>

              {/* Labels */}
              <div className="flex flex-col items-center gap-0.5">
                <span className={cn('text-xs font-black', isSelected ? 'text-primary' : 'text-text')}>
                  {t(EXT_OPTION_I18N_KEYS[opt.value])}
                </span>
                {locale !== 'ko' && (
                  <span className="text-[10px] text-text-muted font-bold opacity-70">{tKo(EXT_OPTION_I18N_KEYS[opt.value])}</span>
                )}
                {opt.price !== undefined && opt.price > 0 && (
                  <span className={cn('text-[10px] font-black mt-1 px-2 py-0.5 rounded-full', isSelected ? 'bg-primary/20 text-primary' : 'bg-surface-alt text-text-muted')}>
                    {opt.value === 'repair' ? `${formatPrice(opt.price)}${t('selector.perUnit')}` : formatPrice(opt.price)}
                  </span>
                )}
              </div>

              {/* Selected mark */}
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-sm"
                >
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Repair Count Control */}
      {extensionType === 'repair' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-3xl bg-surface border-2 border-primary/20 flex flex-col gap-3"
        >
          <Counter
            label={t('selector.repairQuantity')}
            value={repairCount}
            onChange={setRepairCount}
            min={1}
            max={10}
          />
          <div className="flex justify-between items-center text-xs font-bold px-1">
            <span className="text-text-muted">{t('summary.subtotal')}</span>
            <span className="text-primary">{formatPrice(repairCount * 3000)}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
