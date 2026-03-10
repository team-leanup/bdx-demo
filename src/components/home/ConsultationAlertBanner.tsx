'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useReservationStore } from '@/store/reservation-store';

const SEEN_KEY = 'bdx-preconsult-seen';

function getSeenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function markAsSeen(id: string): void {
  const seen = getSeenIds();
  seen.add(id);
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // ignore
  }
}

export function ConsultationAlertBanner(): React.ReactElement | null {
  const router = useRouter();
  const reservations = useReservationStore((s) => s.reservations);
  const [dismissed, setDismissed] = useState(false);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSeenIds(getSeenIds());
  }, []);

  // Find first reservation with preConsultationCompletedAt but not yet seen
  const pending = reservations.find(
    (r) =>
      r.preConsultationCompletedAt &&
      r.status !== 'completed' &&
      r.status !== 'cancelled' &&
      !seenIds.has(r.id),
  );

  if (!pending || dismissed) return null;

  const handleView = () => {
    markAsSeen(pending.id);
    setSeenIds(getSeenIds());
    router.push(`/records?bookingId=${pending.id}`);
  };

  const handleDismiss = () => {
    markAsSeen(pending.id);
    setSeenIds(getSeenIds());
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
        style={{
          background: 'color-mix(in srgb, var(--color-primary) 8%, var(--color-surface))',
          borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
        }}
      >
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, var(--color-surface))' }}
        >
          <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text leading-snug">
            {pending.customerName}
            <span className="font-normal text-text-secondary"> 님이 사전 상담을 제출했어요</span>
          </p>
          <p className="text-xs text-text-muted mt-0.5">탭하여 확인하세요</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleView}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.97]"
            style={{ background: 'var(--color-primary)' }}
          >
            확인
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-alt transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
