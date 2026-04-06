'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/lib/i18n';
import type { DesignScope } from '@/types/consultation';
import type { StyleCategory } from '@/types/portfolio';
import { cn } from '@/lib/cn';

function designScopeToCategory(scope: DesignScope): StyleCategory {
  switch (scope) {
    case 'solid_tone': return 'simple';
    case 'solid_point': return 'french';
    case 'full_art': return 'art';
    case 'monthly_art': return 'art';
    default: return 'simple';
  }
}

interface Props {
  shopId: string;
  shopPhone?: string;
  kakaoTalkUrl?: string;
  naverReservationUrl?: string;
  shareCardId: string;
  designScope: DesignScope;
}

export function ShareCardCTASection({
  shopId,
  shopPhone,
  kakaoTalkUrl,
  naverReservationUrl,
  shareCardId,
  designScope,
}: Props): React.ReactElement {
  const t = useT();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((message: string): void => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  const handleKakaoClick = useCallback(async (): Promise<void> => {
    if (!kakaoTalkUrl) return;

    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/share/${shareCardId}`
        : `/share/${shareCardId}`;

    const autoMessage = `${t('shareCard.kakaoAutoMsg')}\n${shareUrl}`;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(autoMessage);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = autoMessage;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast(t('shareCard.kakaoToastCopied'));
    } catch {
      showToast('메시지 복사에 실패했어요');
    }

    if (kakaoTalkUrl.startsWith('https://') || kakaoTalkUrl.startsWith('http://')) {
      window.open(kakaoTalkUrl, '_blank', 'noopener,noreferrer');
    }
  }, [kakaoTalkUrl, shareCardId, t, showToast]);

  const consultHref = `/pre-consult/${shopId}?from=share&designCategory=${designScopeToCategory(designScope)}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Primary CTA */}
      <Link
        href={consultHref}
        className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-white rounded-2xl font-bold text-base active:scale-[0.98] transition-transform"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {t('shareCard.ctaConsult')}
      </Link>

      {/* Secondary buttons */}
      {(kakaoTalkUrl || naverReservationUrl || shopPhone) && (
        <div className="flex gap-2">
          {kakaoTalkUrl && (
            <button
              onClick={handleKakaoClick}
              className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3 border border-border rounded-2xl bg-surface text-text-secondary active:bg-surface/80 transition-colors"
            >
              <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.7 1.5 5.1 3.8 6.6l-1 3.6 4.2-2.8c.9.2 1.9.3 2.9.3 5.523 0 10-3.477 10-7.7S17.523 3 12 3z" />
              </svg>
              <span className="text-xs font-medium">{t('shareCard.ctaKakao')}</span>
            </button>
          )}

          {naverReservationUrl && (
            <a
              href={naverReservationUrl?.startsWith('http') ? naverReservationUrl : '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3 border border-border rounded-2xl bg-surface text-text-secondary active:bg-surface/80 transition-colors"
            >
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" />
              </svg>
              <span className="text-xs font-medium">{t('shareCard.ctaNaver')}</span>
            </a>
          )}

          {shopPhone && (
            <a
              href={`tel:${shopPhone}`}
              className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3 border border-border rounded-2xl bg-surface text-text-secondary active:bg-surface/80 transition-colors"
            >
              <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span className="text-xs font-medium">{t('shareCard.ctaPhone')}</span>
            </a>
          )}
        </div>
      )}

      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live="polite"
            className={cn(
              'fixed bottom-36 left-1/2 -translate-x-1/2 z-50',
              'px-4 py-2.5 rounded-xl bg-text text-background text-sm font-medium',
              'shadow-lg whitespace-nowrap'
            )}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
