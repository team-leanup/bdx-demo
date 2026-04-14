'use client';

import { useT, useKo, useLocale } from '@/lib/i18n';

export default function ConsultationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 bg-background">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error/10">
        <svg className="h-7 w-7 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-text">{t('consultation.error.title')}</h2>
        {locale !== 'ko' && (
          <span className="block text-xs text-text-muted opacity-60 mt-0.5">{tKo('consultation.error.title')}</span>
        )}
        <p className="mt-1 text-sm text-text-muted">{t('consultation.error.subtitle')}</p>
        {locale !== 'ko' && (
          <span className="block text-xs text-text-muted opacity-60 mt-0.5">{tKo('consultation.error.subtitle')}</span>
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-xl bg-surface-alt px-5 py-2.5 text-sm font-semibold text-text transition-colors hover:bg-surface-alt/80"
        >
          {t('consultation.error.retry')}
          {locale !== 'ko' && (
            <span className="block text-xs text-text-muted opacity-60">{tKo('consultation.error.retry')}</span>
          )}
        </button>
        <a
          href="/home"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          {t('consultation.error.goHome')}
          {locale !== 'ko' && (
            <span className="block text-xs text-white/70">{tKo('consultation.error.goHome')}</span>
          )}
        </a>
      </div>
    </div>
  );
}
