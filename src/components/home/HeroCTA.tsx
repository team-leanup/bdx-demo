'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { IconScissors, IconCalendar } from '@/components/icons';

interface HeroCTAProps {
  onStartConsultation: () => void;
  onNewReservation: () => void;
  onGenerateQR?: () => void;
  shopId?: string;
  shopName?: string;
  consultationLabel: string;
  consultationTitle: string;
  reservationLabel: string;
  reservationTitle: string;
  qrLabel?: string;
  itemVariants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number; transition: { duration: number; ease: number[] } };
  };
}

export function HeroCTA({
  onStartConsultation,
  onNewReservation,
  onGenerateQR,
  shopId,
  shopName,
  consultationLabel,
  consultationTitle,
  reservationLabel,
  reservationTitle,
  qrLabel,
  itemVariants,
}: HeroCTAProps): React.ReactElement {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = (): void => {
    const base = `${window.location.origin}/consultation?entry=customer-link`;
    const url = `${base}${shopId ? `&shopId=${shopId}` : ''}${shopName ? `&shopName=${encodeURIComponent(shopName)}` : ''}`;
    void navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };
  return (
    <motion.div data-tour-id="tour-new-consultation" variants={itemVariants} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {/* 새 상담 시작 */}
        <motion.button
          onClick={onStartConsultation}
          className="relative overflow-hidden rounded-2xl bg-primary px-4 py-5 text-left active:scale-[0.98] transition-transform"
          whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <IconScissors className="h-5 w-5 text-white" />
          </div>
          <p className="text-xs font-medium text-white/70">{consultationLabel}</p>
          <h2 className="mt-0.5 text-base font-bold text-white">{consultationTitle}</h2>
        </motion.button>

        {/* 새 예약 등록 */}
        <motion.button
          onClick={onNewReservation}
          className="relative overflow-hidden rounded-2xl bg-surface border border-border px-4 py-5 text-left active:scale-[0.98] transition-transform hover:bg-surface-alt"
          whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <IconCalendar className="h-5 w-5 text-primary" />
          </div>
          <p className="text-xs font-medium text-text-muted">{reservationLabel}</p>
          <h2 className="mt-0.5 text-base font-bold text-text">{reservationTitle}</h2>
        </motion.button>
      </div>

      {/* QR 생성 + 링크 발송 버튼 */}
      <div className="flex gap-2">
        {onGenerateQR && (
          <motion.button
            onClick={onGenerateQR}
            className="flex items-center justify-center gap-2.5 flex-1 rounded-2xl border border-dashed border-border bg-surface-alt px-4 py-3 text-text-secondary hover:bg-surface hover:border-primary/40 hover:text-primary active:scale-[0.98] transition-all"
            whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 18.75h.75v.75h-.75v-.75zM18 13.5h.75v.75H18v-.75zM18 18.75h.75v.75H18v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
            </svg>
            <span className="text-sm font-semibold">{qrLabel ?? 'QR 생성'}</span>
            <span className="text-xs text-text-muted ml-auto">사전 상담 링크</span>
          </motion.button>
        )}

        <motion.button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface-alt px-4 py-3 text-text-secondary hover:bg-surface hover:border-primary/40 hover:text-primary active:scale-[0.98] transition-all"
          whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
        >
          {linkCopied ? (
            <svg className="w-4 h-4 flex-shrink-0 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          ) : (
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          )}
          <span className="text-sm font-semibold whitespace-nowrap">
            {linkCopied ? '복사됨!' : '링크 발송'}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
