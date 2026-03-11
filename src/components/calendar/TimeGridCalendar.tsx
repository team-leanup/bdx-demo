'use client';

import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/cn';
import { DESIGN_SCOPE_LABEL, BODY_PART_LABEL, EXPRESSION_LABEL } from '@/lib/labels';
import {
  addDaysInKorea,
  formatPrice,
  getCurrentTimeInKorea,
  getKoreanWeekStart,
  getTodayInKorea,
  parseKoreanDateString,
} from '@/lib/format';

export interface TimeGridEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'reservation' | 'consultation';
  status: string;
  channel?: string;
  customerPhone?: string;
  requestNote?: string;
  language?: string;
  designerId?: string;
  originalId: string;
  customerId?: string;
  serviceLabel?: string;
  preConsultationCompletedAt?: string;
  // Consultation details
  designScope?: string;
  bodyPart?: string;
  finalPrice?: number;
  expressions?: string[];
}

interface TimeGridCalendarProps {
  events: TimeGridEvent[];
  weekStartDate: string;
  onEventClick?: (event: TimeGridEvent) => void;
  onWeekChange?: (newStartDate: string) => void;
  startHour?: number;
  endHour?: number;
}

const HOUR_HEIGHT = 64;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-warning/10 border-l-2 border-warning text-warning',
  confirmed: 'border-l-2 text-text',
  completed: 'bg-surface-alt border-l-2 border-border text-text-secondary',
  cancelled: 'bg-error/10 border-l-2 border-error/50 text-error/70 line-through',
  done: 'border-l-2 text-text',
};

const DESIGNER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  // 소율 (owner) - primary/rose 계열
  'designer-001': { bg: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-800' },
  // 도윤 (staff) - success/green 계열
  'designer-002': { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-800' },
  // 하린 (staff) - blue/info 계열
  'designer-003': { bg: 'bg-sky-100', border: 'border-sky-500', text: 'text-sky-800' },
};

const DEFAULT_COLOR = { bg: 'bg-primary/10', border: 'border-primary', text: 'text-primary' };

function getEventColor(ev: TimeGridEvent): string {
  if (ev.designerId && DESIGNER_COLORS[ev.designerId]) {
    const c = DESIGNER_COLORS[ev.designerId];
    return `${c.bg} border-l-2 ${c.border} ${c.text}`;
  }
  if (ev.status === 'cancelled') return STATUS_COLORS.cancelled;
  if (ev.status === 'completed') return STATUS_COLORS.completed;
  if (ev.status === 'pending') return STATUS_COLORS.pending;
  return `${DEFAULT_COLOR.bg} border-l-2 ${DEFAULT_COLOR.border} ${DEFAULT_COLOR.text}`;
}

function getMonday(dateStr: string): string {
  return getKoreanWeekStart(dateStr);
}

function addDays(dateStr: string, days: number): string {
  return addDaysInKorea(dateStr, days);
}

function formatShortDate(dateStr: string): { day: number; weekday: string } {
  const d = parseKoreanDateString(dateStr);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return { day: d.getUTCDate(), weekday: weekdays[d.getUTCDay()] };
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function TimeGridCalendar({ events, weekStartDate, onEventClick, onWeekChange, startHour: propStartHour, endHour: propEndHour }: TimeGridCalendarProps) {
  const [currentTime, setCurrentTime] = useState(getCurrentTimeInKorea());

  const START_HOUR = propStartHour ?? 10;
  const END_HOUR = propEndHour ?? 20;
  const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(getCurrentTimeInKorea()), 60000);
    return () => clearInterval(interval);
  }, []);

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i)),
    [weekStartDate],
  );

  const todayStr = getTodayInKorea();
  const isCurrentWeek = weekDates.includes(todayStr);

  const currentTimeTop = useMemo(() => {
    const { hour: h, minute: m } = currentTime;
    if (h < START_HOUR || h > END_HOUR) return null;
    return (h - START_HOUR) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT;
  }, [currentTime, START_HOUR, END_HOUR]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, TimeGridEvent[]> = {};
    for (const date of weekDates) map[date] = [];
    for (const ev of events) {
      if (map[ev.date]) map[ev.date].push(ev);
    }
    return map;
  }, [events, weekDates]);

  const weekLabel = useMemo(() => {
    const start = parseKoreanDateString(weekDates[0]);
    const end = parseKoreanDateString(weekDates[6]);
    const sm = start.getUTCMonth() + 1;
    const sd = start.getUTCDate();
    const em = end.getUTCMonth() + 1;
    const ed = end.getUTCDate();
    return sm === em ? `${sm}/${sd} – ${ed}` : `${sm}/${sd} – ${em}/${ed}`;
  }, [weekDates]);

  const handlePrev = () => onWeekChange?.(addDays(weekStartDate, -7));
  const handleNext = () => onWeekChange?.(addDays(weekStartDate, 7));
  const handleToday = () => onWeekChange?.(getMonday(todayStr));

  return (
    <div className="flex flex-col gap-3">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-secondary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="text-sm font-semibold text-text min-w-[120px] text-center">{weekLabel}</span>
          <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-surface-alt text-text-secondary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        <button onClick={handleToday} className="px-3 py-1 rounded-lg text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/5">
          Today
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <div className="min-w-[500px]">
          {/* Day headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border bg-surface">
            <div className="p-2" />
            {weekDates.map((date) => {
              const { day, weekday } = formatShortDate(date);
              const isToday = date === todayStr;
              return (
                <div key={date} className={cn('p-2 text-center border-l border-border', isToday && 'bg-primary/5')}>
                  <div className="text-[10px] text-text-muted">{weekday}</div>
                  <div className={cn(
                    'text-sm font-semibold',
                    isToday ? 'text-primary' : 'text-text',
                  )}>{day}</div>
                </div>
              );
            })}
          </div>

          {/* Time grid body */}
          <div className="relative bg-surface" style={{ height: HOURS.length * HOUR_HEIGHT }}>
            {/* Hour lines + labels */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full grid grid-cols-[60px_repeat(7,1fr)]"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
              >
                <div className="text-[10px] text-text-muted text-right pr-2 -translate-y-1/2">
                  {`${String(hour).padStart(2, '0')}:00`}
                </div>
                {weekDates.map((date) => (
                  <div key={date} className="border-l border-t border-border" style={{ height: HOUR_HEIGHT }} />
                ))}
              </div>
            ))}

            {/* Events */}
            <div className="absolute inset-0 grid grid-cols-[60px_repeat(7,1fr)]">
              <div />
              {weekDates.map((date) => (
                <div key={date} className="relative border-l border-border overflow-hidden">
                  {(eventsByDate[date] || []).map((ev) => {
                    const startMin = timeToMinutes(ev.startTime);
                    const endMin = timeToMinutes(ev.endTime);
                    const top = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                    const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 32);
                    const colorClass = getEventColor(ev);

                    return (
                      <button
                        key={ev.id}
                        onClick={() => onEventClick?.(ev)}
                        className={cn(
                          'absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-left overflow-hidden cursor-pointer transition-opacity hover:opacity-80',
                          colorClass,
                        )}
                        style={{ top, height }}
                      >
                        <div className="text-[10px] font-semibold truncate flex items-center gap-1">
                          <span className={cn('inline-block px-0.5 rounded text-[9px] font-bold', ev.type === 'reservation' ? 'bg-warning/20 text-warning' : 'bg-primary/15 text-primary')}>
                            {ev.type === 'reservation' ? '예약' : '상담'}
                          </span>
                          {ev.title}
                        </div>
                        {ev.type === 'consultation' && ev.designScope && (
                          <div className="text-[9px] font-medium truncate">
                            {BODY_PART_LABEL[ev.bodyPart ?? ''] ?? ''} {DESIGN_SCOPE_LABEL[ev.designScope] ?? ev.designScope}
                            {ev.finalPrice != null && ` · ${formatPrice(ev.finalPrice)}`}
                          </div>
                        )}
                        {ev.type === 'consultation' && ev.expressions && ev.expressions.length > 0 && height >= 56 && (
                          <div className="text-[9px] opacity-60 truncate">
                            {ev.expressions.map((e) => EXPRESSION_LABEL[e] ?? e).join(', ')}
                          </div>
                        )}
                        <div className="text-[9px] opacity-70 truncate">{ev.startTime}–{ev.endTime}</div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Current time line */}
            {isCurrentWeek && currentTimeTop !== null && (
              <div
                className="absolute left-[60px] right-0 flex items-center z-10 pointer-events-none"
                style={{ top: currentTimeTop }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-error -ml-1.5 flex-shrink-0" />
                <div className="flex-1 h-0.5 bg-error" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
