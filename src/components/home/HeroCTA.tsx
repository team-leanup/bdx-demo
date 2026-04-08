'use client';

import { motion } from 'framer-motion';
import { IconScissors, IconCalendar } from '@/components/icons';

interface HeroCTAProps {
  onStartConsultation: () => void;
  onNewReservation: () => void;
  onQuickSale: () => void;
  consultationLabel: string;
  consultationTitle: string;
  consultationSubtitle: string;
  reservationLabel: string;
  reservationTitle: string;
  quickSaleLabel: string;
  quickSaleTitle: string;
  itemVariants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number; transition: { duration: number; ease: number[] } };
  };
}

export function HeroCTA({
  onStartConsultation,
  onNewReservation,
  onQuickSale,
  consultationLabel,
  consultationTitle,
  consultationSubtitle,
  reservationLabel,
  reservationTitle,
  quickSaleLabel,
  quickSaleTitle,
  itemVariants,
}: HeroCTAProps): React.ReactElement {

  return (
    <motion.div data-tour-id="tour-new-consultation" variants={itemVariants} className="flex flex-col gap-3">
      {/* Top row: 새 예약 등록 + 매출 등록 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 새 예약 등록 */}
        <motion.button
          onClick={onNewReservation}
          className="relative overflow-hidden rounded-2xl bg-primary px-4 py-5 text-left active:scale-[0.98] transition-transform"
          whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <IconCalendar className="h-5 w-5 text-white" />
          </div>
          <p className="text-xs font-medium text-white/70">{reservationLabel}</p>
          <h2 className="mt-0.5 text-base font-medium text-white">{reservationTitle}</h2>
        </motion.button>

        {/* 매출 등록 */}
        <motion.button
          onClick={onQuickSale}
          className="relative overflow-hidden rounded-2xl bg-primary px-4 py-5 text-left active:scale-[0.98] transition-transform"
          whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-4-8h8M7 20h10a2 2 0 002-2V6a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xs font-medium text-white/70">{quickSaleLabel}</p>
          <h2 className="mt-0.5 text-base font-medium text-white">{quickSaleTitle}</h2>
        </motion.button>
      </div>

      {/* 신규 고객 상담 — full width, secondary style */}
      <motion.button
        onClick={onStartConsultation}
        className="relative overflow-hidden rounded-2xl bg-surface border border-border px-4 py-5 text-left active:scale-[0.98] transition-transform hover:bg-surface-alt"
        whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <IconScissors className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-text-muted">{consultationLabel}</p>
            <h2 className="mt-0.5 text-base font-medium text-text">{consultationTitle}</h2>
            <p className="mt-0.5 text-xs text-text-muted">{consultationSubtitle}</p>
          </div>
        </div>
      </motion.button>

    </motion.div>
  );
}
