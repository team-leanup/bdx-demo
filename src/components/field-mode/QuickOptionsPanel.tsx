'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import type { ServiceStructure, SurchargeSettings } from '@/types/shop';
import type {
  RemovalPreference,
  LengthPreference,
  ExtensionLength,
  AddOnOption,
} from '@/types/pre-consultation';

interface CustomPartItem {
  id: string;
  name: string;
  pricePerUnit: number;
}

interface QuickOptionsPanelProps {
  removalType: RemovalPreference;
  lengthType: LengthPreference;
  extensionLength: ExtensionLength | null;
  addOns: AddOnOption[];
  surcharges: SurchargeSettings;
  serviceStructure?: ServiceStructure;
  customParts?: CustomPartItem[];
  customPartCounts?: Record<string, number>;
  onRemovalChange: (type: RemovalPreference) => void;
  onLengthChange: (type: LengthPreference) => void;
  onExtensionChange: (length: ExtensionLength) => void;
  onToggleAddOn: (option: AddOnOption) => void;
  onAddCustomPart?: (part: CustomPartItem) => void;
  onRemoveCustomPart?: (part: CustomPartItem) => void;
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
  serviceStructure,
  customParts,
  customPartCounts,
  onRemovalChange,
  onLengthChange,
  onExtensionChange,
  onToggleAddOn,
  onAddCustomPart,
  onRemoveCustomPart,
}: QuickOptionsPanelProps) {
  const t = useT();

  // 사장님이 설정에서 OFF한 항목은 옵션에서 제외
  const removalEnabled = serviceStructure?.removal !== false;
  const extensionEnabled = serviceStructure?.extension !== false;
  const partsEnabled = serviceStructure?.parts !== false;
  const pointFullArtEnabled = serviceStructure?.pointFullArt !== false;

  const removalOptions: OptionButton<RemovalPreference>[] = [
    { value: 'none', label: t('fieldMode.optionRemovalNone') },
    ...(removalEnabled
      ? [
          {
            value: 'self_shop' as const,
            label: t('fieldMode.optionRemovalSelf'),
            sublabel: `+₩${surcharges.selfRemoval.toLocaleString()}`,
          },
          {
            value: 'other_shop' as const,
            label: t('fieldMode.optionRemovalOther'),
            sublabel: `+₩${surcharges.otherRemoval.toLocaleString()}`,
          },
        ]
      : []),
  ];

  const lengthOptions: OptionButton<LengthPreference>[] = [
    { value: 'keep', label: t('fieldMode.optionLengthKeep') },
    { value: 'shorten', label: t('fieldMode.optionLengthShorten') },
    ...(extensionEnabled
      ? [
          {
            value: 'extend' as const,
            label: t('fieldMode.optionLengthExtend'),
            sublabel: `+₩${surcharges.extension.toLocaleString()}`,
          },
        ]
      : []),
  ];

  const extensionOptions: OptionButton<ExtensionLength>[] = [
    { value: 'natural', label: t('fieldMode.extensionNatural') },
    { value: 'medium', label: t('fieldMode.extensionMedium') },
    { value: 'long', label: t('fieldMode.extensionLong') },
  ];

  const addOnOptions: OptionButton<AddOnOption>[] = [
    { value: 'stone', label: t('fieldMode.addStone'), sublabel: '+₩5,000' },
    ...(partsEnabled
      ? [
          {
            value: 'parts' as const,
            label: t('fieldMode.addParts'),
            sublabel: `+₩${surcharges.largeParts.toLocaleString()}`,
          },
        ]
      : []),
    { value: 'glitter', label: t('fieldMode.addGlitter'), sublabel: '+₩3,000' },
    ...(pointFullArtEnabled
      ? [
          {
            value: 'point_art' as const,
            label: t('fieldMode.addPointArt'),
            sublabel: `+₩${surcharges.pointArt.toLocaleString()}`,
          },
        ]
      : []),
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
          <OptionBtn active={!addOns.includes('wrapping')} label="없음" onClick={() => { if (addOns.includes('wrapping')) onToggleAddOn('wrapping'); }} />
          <OptionBtn
            active={addOns.includes('wrapping')}
            label="랩핑"
            sublabel={`+₩${(surcharges.wrapping ?? 5000).toLocaleString()}`}
            onClick={() => { if (!addOns.includes('wrapping')) onToggleAddOn('wrapping'); }}
          />
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

      {/* Section 5: 커스텀 파츠 (사장님이 설정에서 등록한 목록) */}
      {customParts && customParts.length > 0 && (() => {
        // 활성 파츠의 총 누적 금액
        const partsTotal = customParts.reduce((sum, part) => {
          const count = customPartCounts?.[part.name] ?? 0;
          return sum + count * part.pricePerUnit;
        }, 0);
        return (
          <section>
            <div className="flex items-baseline justify-between">
              <SectionLabel>커스텀 파츠</SectionLabel>
              {partsTotal > 0 && (
                <span className="text-sm font-bold text-primary tabular-nums">
                  합계 +₩{partsTotal.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {customParts.map((part) => {
                const count = customPartCounts?.[part.name] ?? 0;
                const isActive = count > 0;
                const partTotal = count * part.pricePerUnit;
                return (
                  <div
                    key={part.id}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-1 py-1 text-xs font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-surface-alt border-border text-text-secondary',
                    )}
                  >
                    {isActive && onRemoveCustomPart && (
                      <button
                        type="button"
                        onClick={() => onRemoveCustomPart(part)}
                        className="relative flex h-6 w-6 items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-surface-inset active:scale-90 transition-all"
                        aria-label={`${part.name} 1개 감소`}
                      >
                        <span aria-hidden className="absolute -inset-3" />
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onAddCustomPart?.(part)}
                      disabled={!onAddCustomPart}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 disabled:cursor-default"
                      aria-label={isActive ? `${part.name} 현재 ${count}개, 추가` : `${part.name} 추가`}
                      aria-pressed={isActive}
                    >
                      <span className={cn('font-semibold', isActive ? 'text-primary' : 'text-text')}>{part.name}</span>
                      {isActive ? (
                        <>
                          <span className="text-primary font-bold">×{count}</span>
                          <span className="text-primary">+₩{partTotal.toLocaleString()}</span>
                          <span className="text-[10px] text-primary/60">({part.pricePerUnit.toLocaleString()}/개)</span>
                        </>
                      ) : (
                        <span className="text-primary">+₩{part.pricePerUnit.toLocaleString()}/개</span>
                      )}
                    </button>
                    {onAddCustomPart && (
                      <button
                        type="button"
                        onClick={() => onAddCustomPart(part)}
                        className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark active:scale-90 transition-all"
                        aria-label={`${part.name} 1개 추가`}
                      >
                        <span aria-hidden className="absolute -inset-3" />
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })()}
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
      type="button"
      onClick={onClick}
      aria-pressed={active}
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
      type="button"
      onClick={onClick}
      aria-pressed={active}
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
