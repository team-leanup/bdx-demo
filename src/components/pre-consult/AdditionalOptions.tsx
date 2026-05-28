'use client';

import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { Button } from '@/components/ui/Button';
import { ADDON_FIXED_PRICES } from '@/lib/pre-consult-price';
import { cn } from '@/lib/cn';
import type { AddOnOption } from '@/types/pre-consultation';
import type { ServiceStructure, SurchargeSettings } from '@/types/shop';

interface AdditionalOptionsProps {
  onComplete: () => void;
}

interface AddOnConfig {
  key: AddOnOption;
  tKey: string;
  icon: string;
  extraPrice: number;
}

const DEFAULT_SURCHARGES: Pick<SurchargeSettings, 'largeParts' | 'pointArt'> = {
  largeParts: 3000,
  pointArt: 20000,
};

function getAddOnConfigs(surcharges: Pick<SurchargeSettings, 'largeParts' | 'pointArt'>): AddOnConfig[] {
  return [
    { key: 'stone', tKey: 'preConsult.addOnStone', icon: '💎', extraPrice: ADDON_FIXED_PRICES.stone },
    { key: 'parts', tKey: 'preConsult.addOnParts', icon: '🌸', extraPrice: surcharges.largeParts },
    { key: 'glitter', tKey: 'preConsult.addOnGlitter', icon: '✨', extraPrice: ADDON_FIXED_PRICES.glitter },
    { key: 'point_art', tKey: 'preConsult.addOnPointArt', icon: '🎨', extraPrice: surcharges.pointArt },
  ];
}

export function AdditionalOptions({ onComplete }: AdditionalOptionsProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const store = usePreConsultStore();
  const shopData = usePreConsultStore((s) => s.shopData);
  const surcharges = shopData?.surcharges ?? DEFAULT_SURCHARGES;
  const serviceStructure: ServiceStructure | undefined = shopData?.serviceStructure;
  const customParts = shopData?.customParts ?? [];

  // 사장님이 설정에서 OFF한 시술 항목은 옵션에서 제거
  const ADD_ONS = getAddOnConfigs(surcharges).filter((addon) => {
    if (!serviceStructure) return true;
    if (addon.key === 'parts' && !serviceStructure.parts) return false;
    if (addon.key === 'point_art' && !serviceStructure.pointFullArt) return false;
    return true;
  });

  const handleToggle = (opt: AddOnOption): void => {
    store.toggleAddOn(opt);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-bold text-text">
          {t('preConsult.addOnTitle')}
        </h3>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-0.5">
            {tKo('preConsult.addOnTitle')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {ADD_ONS.map((addon) => {
          const isSelected = store.addOns.includes(addon.key);
          return (
            <button
              key={addon.key}
              type="button"
              onClick={() => handleToggle(addon.key)}
              className={[
                'w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-200 text-left',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface hover:border-primary/40',
              ].join(' ')}
            >
              <span className="text-2xl flex-shrink-0">{addon.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-text'}`}>
                  {t(addon.tKey)}
                </p>
                {locale !== 'ko' && (
                  <p className="text-xs text-text-muted opacity-60">
                    {tKo(addon.tKey)}
                  </p>
                )}
              </div>
              {isSelected ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-primary font-medium">
                    +{(addon.extraPrice / 1000).toFixed(0)},000{t('preConsult.won')} {t('preConsult.addOnExtra')}
                  </span>
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <span className="text-xs text-text-muted flex-shrink-0">
                  +{(addon.extraPrice / 1000).toFixed(0)},000{t('preConsult.won')}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 사장님이 등록한 커스텀 파츠 — 손님이 개수 선택 */}
      {customParts.length > 0 && (() => {
        const selections = store.customPartSelections;
        const partsTotal = customParts.reduce((sum, p) => sum + (selections[p.name] ?? 0) * p.pricePerUnit, 0);
        return (
          <div className="rounded-2xl bg-surface-alt border border-border p-3 mt-1">
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-xs font-semibold text-text">{t('preConsult.partsListTitle')}</p>
              {partsTotal > 0 && (
                <span className="text-sm font-bold text-primary tabular-nums">
                  +₩{partsTotal.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {customParts.map((part) => {
                const count = selections[part.name] ?? 0;
                const isActive = count > 0;
                const partTotal = count * part.pricePerUnit;
                return (
                  <div
                    key={part.id}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-1 py-1 text-xs font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 border-primary'
                        : 'bg-surface border-border',
                    )}
                  >
                    {isActive && (
                      <button
                        type="button"
                        onClick={() => store.decrementCustomPart(part.name)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-text-secondary hover:bg-surface-inset active:scale-90 transition-all"
                        aria-label={`${part.name} -1`}
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => store.incrementCustomPart(part.name)}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5"
                    >
                      <span className={cn('font-semibold', isActive ? 'text-primary' : 'text-text')}>{part.name}</span>
                      {isActive ? (
                        <>
                          <span className="text-primary font-bold">×{count}</span>
                          <span className="text-primary">+₩{partTotal.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-primary">+₩{part.pricePerUnit.toLocaleString()}/개</span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => store.incrementCustomPart(part.name)}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark active:scale-90 transition-all"
                      aria-label={`${part.name} +1`}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <Button fullWidth onClick={onComplete} className="mt-2">
        {t('preConsult.next')}
      </Button>
    </div>
  );
}
