'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useT, useLocale } from '@/lib/i18n';

interface ConsultationHeaderProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  titleKo?: string;
  backHref?: string;
  onBack?: () => void;
  onClose?: () => void;
  className?: string;
}

export function ConsultationHeader({
  stepNumber,
  totalSteps,
  title,
  titleKo,
  backHref,
  onBack,
  onClose,
  className,
}: ConsultationHeaderProps) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.push('/home');
    }
  };

  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 md:px-8 py-3 md:h-16 bg-surface border-b border-border',
        className,
      )}
    >
      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-surface-alt transition-colors"
        aria-label={t('consultation.backLabel')}
      >
        <svg
          className="w-5 h-5 text-text"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Step info */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs font-semibold text-text-secondary tracking-wider uppercase">
          STEP {stepNumber}/{totalSteps}
        </span>
        <span className="text-base font-bold text-text">{title}</span>
        {locale !== 'ko' && titleKo && (
          <span className="text-[10px] text-text-muted opacity-60">{titleKo}</span>
        )}
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        className="w-11 h-11 rounded-xl flex items-center justify-center hover:bg-surface-alt transition-colors"
        aria-label={t('consultation.closeConsultation')}
      >
        <svg
          className="w-5 h-5 text-text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </header>
  );
}
