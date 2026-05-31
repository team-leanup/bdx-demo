'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { SelectCard } from '@/components/ui/SelectCard';
import type { NailCurrentStatus, RemovalPreference, WrappingPreference } from '@/types/pre-consultation';

interface NailStatusSelectorProps {
  onComplete: () => void;
}

export function NailStatusSelector({ onComplete }: NailStatusSelectorProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const store = usePreConsultStore();
  const shopData = usePreConsultStore((s) => s.shopData);
  // 사장님이 설정에서 OFF한 경우 — 오프(제거) 옵션 숨김 → 기존 네일 선택 시 바로 wrapping으로
  const removalEnabled = shopData?.serviceStructure?.removal !== false;
  const [showRemoval, setShowRemoval] = useState(removalEnabled && store.nailStatus === 'existing');
  const [showWrapping, setShowWrapping] = useState(store.wrappingPreference !== null);

  const handleSelect = (status: NailCurrentStatus): void => {
    store.setNailStatus(status);
    if (status === 'none') {
      store.setRemovalPreference('none');
      setShowRemoval(false); // 'none' 선택 시 잔여 오프 섹션 정리
      setShowWrapping(true);
    } else if (!removalEnabled) {
      // 오프 제공 안 함 — 오프 옵션 건너뛰고 바로 wrapping
      store.setRemovalPreference('none');
      setShowRemoval(false);
      setShowWrapping(true);
    } else {
      setShowRemoval(true);
    }
  };

  const handleRemoval = (pref: RemovalPreference): void => {
    store.setRemovalPreference(pref);
    setShowWrapping(true);
  };

  const handleWrapping = (pref: WrappingPreference): void => {
    store.setWrappingPreference(pref);
    onComplete();
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-base font-bold text-text">
          {t('preConsult.currentNailTitle')}
        </h3>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-0.5">
            {tKo('preConsult.currentNailTitle')}
          </p>
        )}
      </div>

      {/* 0531 회의: 시술 상태에 따라 시간·비용이 추가될 수 있음을 미리 안내 */}
      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
        <svg className="w-4 h-4 shrink-0 mt-0.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-text break-keep">{t('preConsult.statusSurchargeNotice')}</p>
          {locale !== 'ko' && (
            <p className="text-[11px] text-text-muted opacity-70 mt-0.5 break-keep">{tKo('preConsult.statusSurchargeNotice')}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <SelectCard
          selected={store.nailStatus === 'none'}
          onSelect={() => handleSelect('none')}
          icon={<span>✨</span>}
          title={t('preConsult.nailNone')}
          subLabel={locale !== 'ko' ? tKo('preConsult.nailNone') : undefined}
        />
        <SelectCard
          selected={store.nailStatus === 'existing'}
          onSelect={() => handleSelect('existing')}
          icon={<span>💅</span>}
          title={t('preConsult.nailExisting')}
          subLabel={locale !== 'ko' ? tKo('preConsult.nailExisting') : undefined}
        />
      </div>

      <AnimatePresence>
        {showRemoval && (
          <motion.div
            key="removal"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3 pt-2"
          >
            <p className="text-sm text-primary font-medium mb-2">
              {t('preConsult.existingMsg')}
            </p>
            <div>
              <p className="text-sm font-semibold text-text-muted">
                {t('preConsult.removalTitle')}
              </p>
              {locale !== 'ko' && (
                <p className="text-xs text-text-muted opacity-60">
                  {tKo('preConsult.removalTitle')}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <SelectCard
                selected={store.removalPreference === 'self_shop'}
                onSelect={() => handleRemoval('self_shop')}
                icon={<span>🏪</span>}
                title={t('preConsult.removalSelf')}
                subLabel={locale !== 'ko' ? tKo('preConsult.removalSelf') : undefined}
              />
              <SelectCard
                selected={store.removalPreference === 'other_shop'}
                onSelect={() => handleRemoval('other_shop')}
                icon={<span>🔄</span>}
                title={t('preConsult.removalOther')}
                subLabel={locale !== 'ko' ? tKo('preConsult.removalOther') : undefined}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWrapping && (
          <motion.div
            key="wrapping"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3 pt-2"
          >
            <div>
              <p className="text-sm font-semibold text-text-muted">
                {t('preConsult.wrappingTitle')}
              </p>
              {locale !== 'ko' && (
                <p className="text-xs text-text-muted opacity-60">
                  {tKo('preConsult.wrappingTitle')}
                </p>
              )}
              <p className="text-xs text-text-muted mt-0.5">
                {t('preConsult.wrappingDesc')}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <SelectCard
                selected={store.wrappingPreference === 'yes'}
                onSelect={() => handleWrapping('yes')}
                icon={<span>💅</span>}
                title={t('preConsult.wrappingYes')}
                subLabel={locale !== 'ko' ? tKo('preConsult.wrappingYes') : undefined}
              />
              <SelectCard
                selected={store.wrappingPreference === 'no'}
                onSelect={() => handleWrapping('no')}
                icon={<span>🙅‍♀️</span>}
                title={t('preConsult.wrappingNo')}
                subLabel={locale !== 'ko' ? tKo('preConsult.wrappingNo') : undefined}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
