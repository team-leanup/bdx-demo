'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { SelectCard } from '@/components/ui/SelectCard';
import type { NailCurrentStatus, RemovalPreference } from '@/types/pre-consultation';

interface NailStatusSelectorProps {
  onComplete: () => void;
}

export function NailStatusSelector({ onComplete }: NailStatusSelectorProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const store = usePreConsultStore();
  const [showRemoval, setShowRemoval] = useState(store.nailStatus === 'existing');

  const handleSelect = (status: NailCurrentStatus): void => {
    store.setNailStatus(status);
    if (status === 'none') {
      store.setRemovalPreference('none');
      onComplete();
    } else {
      setShowRemoval(true);
    }
  };

  const handleRemoval = (pref: RemovalPreference): void => {
    store.setRemovalPreference(pref);
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
    </div>
  );
}
