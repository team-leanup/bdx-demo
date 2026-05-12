'use client';

import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { Button } from '@/components/ui/Button';

interface AdditionalRequestProps {
  onComplete: () => void;
}

const MAX_LENGTH = 500;

export function AdditionalRequest({ onComplete }: AdditionalRequestProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const additionalRequest = usePreConsultStore((s) => s.additionalRequest);
  const setAdditionalRequest = usePreConsultStore((s) => s.setAdditionalRequest);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = e.target.value.slice(0, MAX_LENGTH);
    setAdditionalRequest(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-baseline gap-2">
          <h3 className="text-base font-bold text-text">
            {t('preConsult.additionalRequestTitle')}
          </h3>
          <span className="text-xs text-text-muted">
            {t('preConsult.additionalRequestOptional')}
          </span>
        </div>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-0.5">
            {tKo('preConsult.additionalRequestTitle')}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <textarea
          aria-label={t('preConsult.additionalRequestTitle')}
          value={additionalRequest}
          onChange={handleChange}
          rows={4}
          maxLength={MAX_LENGTH}
          placeholder={t('preConsult.additionalRequestPlaceholder')}
          className="w-full rounded-2xl border-2 border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors resize-none"
          style={{ fontSize: '16px', minHeight: '120px' }}
        />
        <div className="flex justify-end">
          <span className="text-xs text-text-muted tabular-nums">
            {additionalRequest.length}/{MAX_LENGTH}
          </span>
        </div>
      </div>

      <Button fullWidth onClick={onComplete} className="mt-2">
        {t('preConsult.next')}
      </Button>
    </div>
  );
}
