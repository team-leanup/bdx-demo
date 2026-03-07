'use client';

import { motion } from 'framer-motion';
import { IconSparkle, IconCalendar } from '@/components/icons';

interface HeroCTAProps {
  onStartConsultation: () => void;
  onNewReservation: () => void;
  consultationLabel: string;
  consultationTitle: string;
  reservationLabel: string;
  reservationTitle: string;
  itemVariants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number; transition: { duration: number; ease: number[] } };
  };
}

export function HeroCTA({
  onStartConsultation,
  onNewReservation,
  consultationLabel,
  consultationTitle,
  reservationLabel,
  reservationTitle,
  itemVariants,
}: HeroCTAProps): React.ReactElement {
  return (
    <motion.div data-tour-id="tour-new-consultation" variants={itemVariants} className="grid grid-cols-2 gap-3">
      {/* 새 상담 시작 */}
      <motion.button
        onClick={onStartConsultation}
        className="relative overflow-hidden rounded-2xl bg-primary px-4 py-5 text-left active:scale-[0.98] transition-transform"
        whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
          <IconSparkle className="h-5 w-5 text-white" />
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
    </motion.div>
  );
}
