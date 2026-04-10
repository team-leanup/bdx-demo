'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/i18n';

interface TreatmentTimerProps {
  startedAt: string; // ISO date string
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function TreatmentTimer({ startedAt }: TreatmentTimerProps): React.ReactElement {
  const t = useT();
  const [elapsed, setElapsed] = useState<number>(() =>
    Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
  );

  useEffect(() => {
    const startMs = new Date(startedAt).getTime();
    const id = setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <div className="flex flex-col items-end" aria-hidden="true">
      <span className="text-[10px] font-medium text-text-muted uppercase tracking-widest leading-none mb-0.5">
        {t('fieldMode.elapsed')}
      </span>
      <span className="text-4xl font-bold tabular-nums tracking-tight leading-none text-text">
        {formatElapsed(elapsed)}
      </span>
    </div>
  );
}
