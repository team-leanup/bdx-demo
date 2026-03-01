'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import type { BookingRequest } from '@/types/consultation';

// DAY_LABELS will be computed inside component using i18n hook

interface MonthCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  reservations: BookingRequest[];
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function MonthCalendar({ selectedDate, onSelectDate, reservations }: MonthCalendarProps) {
  const t = useT();
  const today = getTodayStr();
  const DAY_LABELS = [t('day.sun'), t('day.mon'), t('day.tue'), t('day.wed'), t('day.thu'), t('day.fri'), t('day.sat')];
  const [year, setYear] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return d.getFullYear();
  });
  const [month, setMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return d.getMonth() + 1;
  });
  const [direction, setDirection] = useState(0);

  const goToPrev = () => {
    setDirection(-1);
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goToNext = () => {
    setDirection(1);
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to complete weeks
  while (cells.length % 7 !== 0) cells.push(null);

  // Build reservation date set for quick lookup
  const reservationDates = new Set(
    reservations
      .filter((r) => r.reservationDate.startsWith(`${year}-${String(month).padStart(2, '0')}`))
      .map((r) => r.reservationDate),
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={goToPrev}
          className="w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-text-secondary hover:border-primary/40 hover:text-primary transition-all active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-base font-bold text-text">
          {t('calendar.yearMonth').replace('{year}', String(year)).replace('{month}', String(month))}
        </span>
        <button
          type="button"
          onClick={goToNext}
          className="w-9 h-9 rounded-xl border border-border bg-surface flex items-center justify-center text-text-secondary hover:border-primary/40 hover:text-primary transition-all active:scale-90"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 text-center">
        {DAY_LABELS.map((d, i) => (
          <span
            key={d}
            className={cn(
              'text-[11px] font-semibold py-1',
              i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-text-muted',
            )}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-y-1"
        >
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-10" />;
            }

            const dateStr = toDateStr(year, month, day);
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const hasReservation = reservationDates.has(dateStr);
            const dayOfWeek = idx % 7;
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;

            return (
              <div key={day} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onSelectDate(dateStr)}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-150 relative',
                    isToday && !isSelected
                      ? 'bg-primary text-white'
                      : isSelected
                      ? 'ring-2 ring-primary bg-primary/10 text-primary'
                      : isSunday
                      ? 'text-red-500 hover:bg-red-50'
                      : isSaturday
                      ? 'text-blue-500 hover:bg-blue-50'
                      : 'text-text hover:bg-surface-alt',
                  )}
                >
                  {day}
                </button>
                {/* Reservation dot */}
                {hasReservation && (
                  <div
                    className={cn(
                      'w-1.5 h-1.5 rounded-full -mt-0.5',
                      isSelected ? 'bg-primary' : 'bg-primary/60',
                    )}
                  />
                )}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
