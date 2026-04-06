'use client';

import { useT } from '@/lib/i18n';

export default function PreConsultNotFound(): React.ReactElement {
  const t = useT();
  return (
    <div className="h-dvh flex items-center justify-center bg-background">
      <div className="text-center px-6">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="text-xl font-bold text-text mb-2">{t('preConsult.invalidLink')}</h1>
        <p className="text-sm text-text-muted">{t('preConsult.invalidLinkDesc')}</p>
      </div>
    </div>
  );
}
