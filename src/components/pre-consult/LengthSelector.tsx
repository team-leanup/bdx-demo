'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { SelectCard } from '@/components/ui/SelectCard';
import type { LengthPreference, ExtensionLength } from '@/types/pre-consultation';

interface LengthSelectorProps {
  onComplete: () => void;
}

export function LengthSelector({ onComplete }: LengthSelectorProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const store = usePreConsultStore();
  const [showExtension, setShowExtension] = useState(store.lengthPreference === 'extend');

  const handleLengthSelect = (pref: LengthPreference): void => {
    store.setLengthPreference(pref);
    if (pref === 'extend') {
      setShowExtension(true);
    } else {
      store.setExtensionLength('natural'); // reset extension length
      setShowExtension(false);
      onComplete();
    }
  };

  const handleExtensionSelect = (len: ExtensionLength): void => {
    store.setExtensionLength(len);
    onComplete();
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h3 className="text-base font-bold text-text">
          {t('preConsult.lengthTitle')}
        </h3>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-0.5">
            {tKo('preConsult.lengthTitle')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <SelectCard
          selected={store.lengthPreference === 'keep'}
          onSelect={() => handleLengthSelect('keep')}
          icon={<span>📏</span>}
          title={t('preConsult.lengthKeep')}
          subLabel={locale !== 'ko' ? tKo('preConsult.lengthKeep') : undefined}
        />
        <SelectCard
          selected={store.lengthPreference === 'shorten'}
          onSelect={() => handleLengthSelect('shorten')}
          icon={<span>✂️</span>}
          title={t('preConsult.lengthShort')}
          subLabel={locale !== 'ko' ? tKo('preConsult.lengthShort') : undefined}
        />
        <SelectCard
          selected={store.lengthPreference === 'extend'}
          onSelect={() => handleLengthSelect('extend')}
          icon={<span>💎</span>}
          title={t('preConsult.lengthExtend')}
          subLabel={locale !== 'ko' ? tKo('preConsult.lengthExtend') : undefined}
        />
      </div>

      <AnimatePresence>
        {showExtension && (
          <motion.div
            key="extension"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-3 pt-2"
          >
            <div>
              <p className="text-sm font-semibold text-text-muted">
                {t('preConsult.extensionMsg')}
              </p>
              {locale !== 'ko' && (
                <p className="text-xs text-text-muted opacity-60">
                  {tKo('preConsult.extensionMsg')}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <SelectCard
                selected={store.extensionLength === 'natural'}
                onSelect={() => handleExtensionSelect('natural')}
                icon={<span>🌿</span>}
                title={t('preConsult.extensionNatural')}
                subLabel={locale !== 'ko' ? tKo('preConsult.extensionNatural') : undefined}
              />
              <SelectCard
                selected={store.extensionLength === 'medium'}
                onSelect={() => handleExtensionSelect('medium')}
                icon={<span>🌸</span>}
                title={t('preConsult.extensionMedium')}
                subLabel={locale !== 'ko' ? tKo('preConsult.extensionMedium') : undefined}
              />
              <SelectCard
                selected={store.extensionLength === 'long'}
                onSelect={() => handleExtensionSelect('long')}
                icon={<span>🌺</span>}
                title={t('preConsult.extensionLong')}
                subLabel={locale !== 'ko' ? tKo('preConsult.extensionLong') : undefined}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
