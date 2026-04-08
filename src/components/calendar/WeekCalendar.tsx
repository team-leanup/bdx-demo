'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/cn';
import { addDaysInKorea, getKoreanWeekStart, getTodayInKorea, parseKoreanDateString } from '@/lib/format';
import type { BookingRequest } from '@/types/consultation';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getReadinessDotColor(r: BookingRequest): string {
  if (r.preConsultationCompletedAt) return 'bg-emerald-500'; // 응답 완료
  if (r.consultationLinkSentAt) return 'bg-amber-400';      // 응답 대기
  return 'bg-slate-300';                                      // 링크 미발송
}

interface WeekCalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  reservations: BookingRequest[];
  onToggleMonthView?: () => void;
}

function getTodayStr(): string {
  return getTodayInKorea();
}

function getWeekStart(dateStr: string): string {
  return getKoreanWeekStart(dateStr);
}

function formatWeekLabel(startDateStr: string): string {
  const start = parseKoreanDateString(startDateStr);
  const end = parseKoreanDateString(addDaysInKorea(startDateStr, 6));
  const startLabel = `${start.getUTCMonth() + 1}/${start.getUTCDate()}`;
  const endLabel = `${end.getUTCMonth() + 1}/${end.getUTCDate()}`;
  return `${start.getUTCFullYear()}년 ${startLabel} – ${endLabel}`;
}

export function WeekCalendar({ selectedDate, onSelectDate, reservations, onToggleMonthView }: WeekCalendarProps) {
  const today = getTodayStr();
  const [weekStart, setWeekStart] = useState<string>(() => getWeekStart(selectedDate || today));
  const [direction, setDirection] = useState(0);

  const goToPrev = () => {
    setDirection(-1);
    setWeekStart((current) => addDaysInKorea(current, -7));
  };

  const goToNext = () => {
    setDirection(1);
    setWeekStart((current) => addDaysInKorea(current, 7));
  };

  const goToThisWeek = () => {
    setDirection(0);
    setWeekStart(getWeekStart(today));
    onSelectDate(today);
  };

  // Build 7-day array from weekStart
  const days = Array.from({ length: 7 }, (_, i) => {
    const dateStr = addDaysInKorea(weekStart, i);
    const d = parseKoreanDateString(dateStr);
    return {
      dateStr,
      dayOfWeek: d.getUTCDay(),
      date: d.getUTCDate(),
    };
  });

  // Build reservation count map and channel dots per date
  const reservationsByDate = reservations.reduce<Record<string, BookingRequest[]>>((acc, r) => {
    if (!acc[r.reservationDate]) acc[r.reservationDate] = [];
    acc[r.reservationDate].push(r);
    return acc;
  }, {});

  const weekKey = weekStart;

  return (
    <div className="flex flex-col gap-3">
      {/* Week navigation */}
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToThisWeek}
            className="text-sm font-bold text-text hover:text-primary transition-colors"
          >
            {formatWeekLabel(weekStart)}
          </button>
          {onToggleMonthView && (
            <button
              type="button"
              onClick={onToggleMonthView}
              className="flex items-center justify-center w-7 h-7 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
              title="월간 보기"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </button>
          )}
        </div>

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

      {/* Week day strip */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={weekKey}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7 gap-1"
        >
          {days.map(({ dateStr, dayOfWeek, date }) => {
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const dayReservations = reservationsByDate[dateStr] ?? [];
            const count = dayReservations.length;
            const isSunday = dayOfWeek === 0;
            const isSaturday = dayOfWeek === 6;

            // Readiness dots (max 3)
            const readinessDots = dayReservations.slice(0, 3);

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDate(dateStr)}
                className={cn(
                  'flex flex-col items-center gap-1 py-2 px-1 rounded-2xl transition-all duration-150',
                  isSelected
                    ? 'bg-primary text-white shadow-md'
                    : isToday
                    ? 'bg-primary/10 ring-2 ring-primary text-primary'
                    : isSunday
                    ? 'text-red-500 hover:bg-red-50'
                    : isSaturday
                    ? 'text-blue-500 hover:bg-blue-50'
                    : 'text-text hover:bg-surface-alt',
                )}
              >
                {/* Day label */}
                <span
                  className={cn(
                    'text-[10px] font-semibold',
                    isSelected ? 'text-white/80' : '',
                  )}
                >
                  {DAY_LABELS[dayOfWeek]}
                </span>

                {/* Date number */}
                <span className="text-sm font-bold leading-none">{date}</span>

                {/* Count badge */}
                {count > 0 ? (
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-primary/15 text-primary',
                    )}
                  >
                    {count}건
                  </span>
                ) : (
                  <span className="h-4" />
                )}

                {/* Readiness dots */}
                {readinessDots.length > 0 && (
                  <div className="flex gap-0.5">
                    {readinessDots.map((r, i) => (
                      <span
                        key={i}
                        className={cn('w-1.5 h-1.5 rounded-full', getReadinessDotColor(r), isSelected ? 'opacity-80' : '')}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
