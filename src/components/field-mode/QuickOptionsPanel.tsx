'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import type { SurchargeSettings } from '@/types/shop';
import type {
  RemovalPreference,
  LengthPreference,
  ExtensionLength,
  AddOnOption,
} from '@/types/pre-consultation';

interface QuickOptionsPanelProps {
  removalType: RemovalPreference;
  lengthType: LengthPreference;
  extensionLength: ExtensionLength | null;
  addOns: AddOnOption[];
  surcharges: SurchargeSettings;
  onRemovalChange: (type: RemovalPreference) => void;
  onLengthChange: (type: LengthPreference) => void;
  onExtensionChange: (length: ExtensionLength) => void;
  onToggleAddOn: (option: AddOnOption) => void;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface OptionButton<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickOptionsPanel({
  removalType,
  lengthType,
  extensionLength,
  addOns,
  surcharges,
  onRemovalChange,
  onLengthChange,
  onExtensionChange,
  onToggleAddOn,
}: QuickOptionsPanelProps) {
  const t = useT();

  const removalOptions: OptionButton<RemovalPreference>[] = [
    { value: 'none', label: t('fieldMode.optionRemovalNone') },
    {
      value: 'self_shop',
      label: t('fieldMode.optionRemovalSelf'),
      sublabel: `+₩${surcharges.selfRemoval.toLocaleString()}`,
    },
    {
      value: 'other_shop',
      label: t('fieldMode.optionRemovalOther'),
      sublabel: `+₩${surcharges.otherRemoval.toLocaleString()}`,
    },
  ];

  const lengthOptions: OptionButton<LengthPreference>[] = [
    { value: 'keep', label: t('fieldMode.optionLengthKeep') },
    { value: 'shorten', label: t('fieldMode.optionLengthShorten') },
    {
      value: 'extend',
      label: t('fieldMode.optionLengthExtend'),
      sublabel: `+₩${surcharges.extension.toLocaleString()}`,
    },
  ];

  const extensionOptions: OptionButton<ExtensionLength>[] = [
    { value: 'natural', label: t('fieldMode.extensionNatural') },
    { value: 'medium', label: t('fieldMode.extensionMedium') },
    { value: 'long', label: t('fieldMode.extensionLong') },
  ];

  const addOnOptions: OptionButton<AddOnOption>[] = [
    { value: 'stone', label: t('fieldMode.addStone'), sublabel: '+₩5,000' },
    {
      value: 'parts',
      label: t('fieldMode.addParts'),
      sublabel: `+₩${surcharges.largeParts.toLocaleString()}`,
    },
    { value: 'glitter', label: t('fieldMode.addGlitter'), sublabel: '+₩3,000' },
    {
      value: 'point_art',
      label: t('fieldMode.addPointArt'),
      sublabel: `+₩${surcharges.pointArt.toLocaleString()}`,
    },
  ];

  return (
    <div className="flex flex-col gap-6 px-4 pt-4 pb-40 overflow-y-auto">
      {/* Section 1: 제거 여부 */}
      <section>
        <SectionLabel>{t('fieldMode.optionRemovalTitle')}</SectionLabel>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {removalOptions.map((opt) => (
            <OptionBtn
              key={opt.value}
              active={removalType === opt.value}
              label={opt.label}
              sublabel={opt.sublabel}
              onClick={() => onRemovalChange(opt.value)}
            />
          ))}
        </div>
      </section>

      {/* Section 2: 길이 */}
      <section>
        <SectionLabel>{t('fieldMode.optionLengthTitle')}</SectionLabel>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {lengthOptions.map((opt) => (
            <OptionBtn
              key={opt.value}
              active={lengthType === opt.value}
              label={opt.label}
              sublabel={opt.sublabel}
              onClick={() => onLengthChange(opt.value)}
            />
          ))}
        </div>

        {/* Extension sub-options */}
        <AnimatePresence>
          {lengthType === 'extend' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-3 gap-2 mt-2">
                {extensionOptions.map((opt) => (
                  <OptionBtn
                    key={opt.value}
                    active={extensionLength === opt.value}
                    label={opt.label}
                    onClick={() => onExtensionChange(opt.value)}
                    variant="sub"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Section 3: 랩핑 여부 */}
      <section>
        <SectionLabel>랩핑</SectionLabel>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <OptionBtn active={!addOns.includes('wrapping' as AddOnOption)} label="없음" onClick={() => { /* default */ }} />
          <OptionBtn active={addOns.includes('wrapping' as AddOnOption)} label="랩핑" sublabel="+₩5,000" onClick={() => onToggleAddOn('wrapping' as AddOnOption)} />
        </div>
      </section>

      {/* Section 4: 추가 옵션 */}
      <section>
        <SectionLabel>{t('fieldMode.optionAddOnTitle')}</SectionLabel>
        <div className="flex flex-wrap gap-2 mt-3">
          {addOnOptions.map((opt) => (
            <AddOnChip
              key={opt.value}
              active={addOns.includes(opt.value)}
              label={opt.label}
              sublabel={opt.sublabel}
              onClick={() => onToggleAddOn(opt.value)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm font-bold text-text-secondary uppercase tracking-wide">{children}</p>
  );
}

function OptionBtn({
  active,
  label,
  sublabel,
  onClick,
  variant = 'default',
}: {
  active: boolean;
  label: string;
  sublabel?: string;
  onClick: () => void;
  variant?: 'default' | 'sub';
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-3 text-sm font-semibold min-h-[56px] transition-all duration-150 active:scale-[0.96] border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        variant === 'sub' && 'min-h-[44px] text-xs',
        active
          ? 'bg-primary text-white border-primary'
          : 'bg-surface-alt text-text-secondary border-border hover:bg-surface-inset',
      )}
    >
      <span className={cn('leading-tight', variant === 'sub' ? 'text-xs' : 'text-sm')}>
        {label}
      </span>
      {sublabel && (
        <span
          className={cn(
            'font-normal leading-none',
            active ? 'text-white/80' : 'text-text-muted',
            variant === 'sub' ? 'text-[10px]' : 'text-xs',
          )}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

function AddOnChip({
  active,
  label,
  sublabel,
  onClick,
}: {
  active: boolean;
  label: string;
  sublabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold min-h-[44px] border transition-all duration-150 active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        active
          ? 'bg-primary/10 text-primary border-primary'
          : 'bg-surface-alt text-text-secondary border-border hover:bg-surface-inset',
      )}
    >
      {active && (
        <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden="true">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <span>{label}</span>
      {sublabel && (
        <span className={cn('text-xs font-normal', active ? 'text-primary/70' : 'text-text-muted')}>
          {sublabel}
        </span>
      )}
    </button>
  );
}
