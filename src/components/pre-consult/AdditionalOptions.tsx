'use client';

import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface AdditionalOptionsProps {
  onComplete: () => void;
}

// 0602: 고정 add-on(스톤/글리터) 제거 — 추가 파츠는 사장님이 설정에 등록한
// 커스텀 파츠와 동기화된 목록(아래 스테퍼)으로만 선택. 손님 선택은 종류·수량으로 영속.
export function AdditionalOptions({ onComplete }: AdditionalOptionsProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const store = usePreConsultStore();
  const shopData = usePreConsultStore((s) => s.shopData);
  const customParts = shopData?.customParts ?? [];

  const selections = store.customPartSelections;
  const partsTotal = customParts.reduce(
    (sum, p) => sum + (selections[p.name] ?? 0) * p.pricePerUnit,
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-bold text-text">{t('preConsult.partsListTitle')}</h3>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-0.5">{tKo('preConsult.partsListTitle')}</p>
        )}
        <p className="text-xs text-text-muted mt-1">{t('preConsult.partsListHint')}</p>
      </div>

      {/* 사장님이 설정에서 등록한 커스텀 파츠 — 손님이 종류별 개수 선택 */}
      {customParts.length > 0 ? (
        <div className="rounded-2xl bg-surface-alt border border-border p-3">
          {partsTotal > 0 && (
            <div className="flex justify-end mb-2">
              <span className="text-sm font-bold text-primary tabular-nums">
                +₩{partsTotal.toLocaleString()}
              </span>
            </div>
          )}
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
                    isActive ? 'bg-primary/10 border-primary' : 'bg-surface border-border',
                  )}
                >
                  {isActive && (
                    <button
                      type="button"
                      onClick={() => store.decrementCustomPart(part.name)}
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
                    onClick={() => store.incrementCustomPart(part.name)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5"
                    aria-label={isActive ? `${part.name} 현재 ${count}개, 추가` : `${part.name} 추가`}
                    aria-pressed={isActive}
                  >
                    <span className={cn('font-semibold', isActive ? 'text-primary' : 'text-text')}>{part.name}</span>
                    {isActive ? (
                      <>
                        <span className="text-primary font-bold">×{count}</span>
                        <span className="text-primary">+₩{partTotal.toLocaleString()}</span>
                      </>
                    ) : (
                      <span className="text-primary">
                        +₩{part.pricePerUnit.toLocaleString()}{t('preConsult.perUnit')}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => store.incrementCustomPart(part.name)}
                    className="relative flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark active:scale-90 transition-all"
                    aria-label={`${part.name} 1개 추가`}
                  >
                    <span aria-hidden className="absolute -inset-3" />
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-muted py-2 text-center">{t('preConsult.partsListEmpty')}</p>
      )}

      <Button fullWidth onClick={onComplete} className="mt-2">
        {t('preConsult.next')}
      </Button>
    </div>
  );
}
