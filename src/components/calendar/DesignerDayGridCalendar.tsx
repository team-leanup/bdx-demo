'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { CustomerTagChip } from '@/components/customer/CustomerTagChip';
import { ReservationReadinessBadge } from '@/components/reservations/ReservationReadinessBadge';
import { cn } from '@/lib/cn';
import { formatDayLabelKo, getCurrentTimeInKorea, getTodayInKorea } from '@/lib/format';
import { useCustomerStore } from '@/store/customer-store';
import {
  canMoveReservation,
  snapToInterval,
  clampStartMinutes,
  overlapsAny,
  minutesToTimeStr,
  timeStrToMinutes,
} from '@/lib/schedule/moveValidation';
import type { TimeGridEvent } from '@/components/calendar/TimeGridCalendar';
import type { UserRole } from '@/types/auth';
import type { CustomerTag } from '@/types/customer';

interface DesignerDayGridCalendarProps {
  date: string;
  events: TimeGridEvent[];
  designers: { id: string; name: string }[];
  startHour?: number;
  endHour?: number;
  onEventClick?: (event: TimeGridEvent) => void;
  onEventMove?: (reservationId: string, updates: { reservationTime: string; designerId?: string }) => void;
  role: UserRole;
  activeDesignerId: string | null;
}

const HOUR_HEIGHT = 64;
const AXIS_WIDTH = 60;

const DESIGNER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'designer-001': { bg: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-800' },
  'designer-002': { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-800' },
  'designer-003': { bg: 'bg-sky-100', border: 'border-sky-500', text: 'text-sky-800' },
};

const DEFAULT_COLOR = { bg: 'bg-primary/10', border: 'border-primary', text: 'text-primary' };

const CHANNEL_EMOJI: Record<string, string> = {
  kakao: '💬',
  naver: '🟢',
  phone: '📞',
  walk_in: '🚶',
};

const LANGUAGE_FLAG: Record<string, string> = {
  en: '🇺🇸',
  zh: '🇨🇳',
  ja: '🇯🇵',
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getEventColor(designerId?: string): { bg: string; border: string; text: string } {
  if (designerId && DESIGNER_COLORS[designerId]) {
    return DESIGNER_COLORS[designerId];
  }
  return DEFAULT_COLOR;
}

interface DraggableEventProps {
  ev: TimeGridEvent;
  top: number;
  height: number;
  color: { bg: string; border: string; text: string };
  pinnedTags: CustomerTag[];
  gridRef: React.RefObject<HTMLDivElement | null>;
  columns: { id: string; name: string }[];
  events: TimeGridEvent[];
  startHour: number;
  endHour: number;
  role: UserRole;
  activeDesignerId: string | null;
  onEventClick?: (event: TimeGridEvent) => void;
  onEventMove?: (reservationId: string, updates: { reservationTime: string; designerId?: string }) => void;
}

function DraggableEvent({
  ev,
  top,
  height,
  color,
  pinnedTags,
  gridRef,
  columns,
  events,
  startHour,
  endHour,
  role,
  activeDesignerId,
  onEventClick,
  onEventMove,
}: DraggableEventProps): React.ReactElement {
  const controls = useAnimationControls();
  const [isDragging, setIsDragging] = useState(false);

  const displayTags = pinnedTags.slice(0, 2);
  const extraTagCount = pinnedTags.length - 2;

  const isCancelledOrCompleted = ev.status === 'cancelled' || ev.status === 'completed';
  const canDrag = role !== null && !isCancelledOrCompleted;

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { point: { x: number; y: number } },
  ): void => {
    setIsDragging(false);

    if (!gridRef.current || !canDrag) {
      void controls.start({ x: 0, y: 0 });
      return;
    }

    const rect = gridRef.current.getBoundingClientRect();
    const dropX = (info.point.x - rect.left) + gridRef.current.scrollLeft;
    const dropY = (info.point.y - rect.top) + gridRef.current.scrollTop;

    const columnCount = columns.length;
    const dropXCols = dropX - AXIS_WIDTH;
    const colWidth = (rect.width - AXIS_WIDTH) / columnCount;
    const colIndex = Math.max(0, Math.min(Math.floor(dropXCols / colWidth), columnCount - 1));

    const targetDesignerId = colIndex === 0 ? undefined : columns[colIndex].id;

    const minuteFromTop = (dropY / HOUR_HEIGHT) * 60 + startHour * 60;
    const snapped = snapToInterval(minuteFromTop, 30);
    const eventDuration = timeStrToMinutes(ev.endTime) - timeStrToMinutes(ev.startTime);
    const clamped = clampStartMinutes({
      startMinutes: snapped,
      startHour,
      endHour,
      durationMinutes: eventDuration,
    });
    const timeStr = minutesToTimeStr(clamped);

    const moveCheck = canMoveReservation({
      role,
      activeDesignerId,
      reservationDesignerId: ev.designerId,
      nextDesignerId: targetDesignerId,
    });

    if (!moveCheck.ok) {
      void controls.start({ x: 0, y: 0 });
      return;
    }

    const reservationsSameDay = events
      .filter((e) => e.date === ev.date)
      .map((e) => ({
        id: e.originalId,
        designerId: e.designerId,
        startMinutes: timeStrToMinutes(e.startTime),
        durationMinutes: timeStrToMinutes(e.endTime) - timeStrToMinutes(e.startTime),
      }));

    const hasOverlap = overlapsAny({
      reservationId: ev.originalId,
      nextDesignerId: targetDesignerId,
      nextStartMinutes: clamped,
      durationMinutes: eventDuration,
      reservationsSameDay,
    });

    if (hasOverlap) {
      void controls.start({ x: 0, y: 0 });
      return;
    }

    onEventMove?.(ev.originalId, { reservationTime: timeStr, designerId: targetDesignerId });
    void controls.start({ x: 0, y: 0 });
  };

  return (
    <motion.button
      key={ev.id}
      drag={canDrag}
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={gridRef}
      animate={controls}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.05, zIndex: 50, boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}
      onClick={() => {
        if (!isDragging) onEventClick?.(ev);
      }}
      className={cn(
        'absolute left-0.5 right-0.5 rounded-lg px-1.5 py-1 text-left overflow-hidden transition-opacity hover:opacity-80',
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        color.bg,
        'border-l-3',
        color.border,
        color.text,
      )}
      style={{ top, height }}
    >
      <div className="text-[10px] opacity-70 truncate">
        {ev.startTime}–{ev.endTime}
      </div>
      <div className="text-[11px] font-bold truncate">{ev.title}</div>
      {ev.serviceLabel && (
        <span className="inline-block text-[9px] bg-white/40 rounded px-1 truncate">
          {ev.serviceLabel}
        </span>
      )}
      {ev.type === 'reservation' && (
        <div className="mt-0.5">
          <ReservationReadinessBadge
            booking={{ preConsultationCompletedAt: ev.preConsultationCompletedAt }}
            size="xs"
            compact
          />
        </div>
      )}
      <div className="flex items-center gap-1 flex-wrap mt-0.5">
        {ev.channel && CHANNEL_EMOJI[ev.channel] && (
          <span className="text-[10px]">{CHANNEL_EMOJI[ev.channel]}</span>
        )}
        {ev.language && ev.language !== 'ko' && LANGUAGE_FLAG[ev.language] && (
          <span className="text-[10px]">{LANGUAGE_FLAG[ev.language]}</span>
        )}
      </div>
        {displayTags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-1">
            {displayTags.map((tag) => (
              <CustomerTagChip key={tag.id} tag={tag} size="xs" />
            ))}
            {extraTagCount > 0 && (
              <span className="text-[9px] text-text-muted">+{extraTagCount}</span>
          )}
        </div>
      )}
    </motion.button>
  );
}

export function DesignerDayGridCalendar({
  date,
  events,
  designers,
  startHour: propStartHour,
  endHour: propEndHour,
  role,
  activeDesignerId,
  onEventClick,
  onEventMove,
}: DesignerDayGridCalendarProps) {
  const [currentTime, setCurrentTime] = useState(getCurrentTimeInKorea());
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);
  const gridRef = useRef<HTMLDivElement>(null);

  const START_HOUR = propStartHour ?? 10;
  const END_HOUR = propEndHour ?? 20;
  const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const gridHeight = HOURS.length * HOUR_HEIGHT;

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(getCurrentTimeInKorea()), 60000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = getTodayInKorea();
  const isToday = date === todayStr;

  const currentTimeTop = useMemo(() => {
    if (!isToday) return null;
    const { hour: h, minute: m } = currentTime;
    if (h < START_HOUR || h > END_HOUR) return null;
    return ((h * 60 + m) - START_HOUR * 60) / 60 * HOUR_HEIGHT;
  }, [currentTime, START_HOUR, END_HOUR, isToday]);

  const columns = useMemo(() => {
    return [{ id: '__unassigned__', name: '미지정' }, ...designers];
  }, [designers]);

  const eventsByColumn = useMemo(() => {
    const map: Record<string, TimeGridEvent[]> = {};
    for (const col of columns) {
      map[col.id] = [];
    }
    for (const ev of events) {
      if (ev.date !== date) continue;
      const colId = ev.designerId ?? '__unassigned__';
      if (map[colId]) {
        map[colId].push(ev);
      } else {
        map['__unassigned__'].push(ev);
      }
    }
    return map;
  }, [events, date, columns]);

  const colCount = columns.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-lg font-bold text-text">{formatDayLabelKo(date)}</div>

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <div className="min-w-[500px]">
          <div
            className="grid border-b border-border bg-surface"
            style={{ gridTemplateColumns: `${AXIS_WIDTH}px repeat(${colCount}, 1fr)` }}
          >
            <div className="p-2" />
            {columns.map((col) => (
              <div
                key={col.id}
                className="p-2 text-center border-l border-border bg-surface"
              >
                <div className="text-xs font-semibold text-text">{col.name}</div>
              </div>
            ))}
          </div>

          <div className="relative bg-surface" style={{ height: gridHeight }}>
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full grid"
                style={{
                  top: (hour - START_HOUR) * HOUR_HEIGHT,
                  gridTemplateColumns: `${AXIS_WIDTH}px repeat(${colCount}, 1fr)`,
                }}
              >
                <div className="text-[10px] text-text-muted text-right pr-2 -translate-y-1/2">
                  {`${String(hour).padStart(2, '0')}:00`}
                </div>
                {columns.map((col) => (
                  <div key={col.id} className="border-l border-t border-border" style={{ height: HOUR_HEIGHT }} />
                ))}
              </div>
            ))}

            <div
              ref={gridRef}
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `${AXIS_WIDTH}px repeat(${colCount}, 1fr)` }}
            >
              <div />
              {columns.map((col) => (
                <div key={col.id} className="relative border-l border-border overflow-visible">
                  {(eventsByColumn[col.id] || []).map((ev) => {
                    const startMin = timeToMinutes(ev.startTime);
                    const endMin = timeToMinutes(ev.endTime);
                    const rawTop = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                    const rawHeight = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 40);
                    const top = Math.max(0, Math.min(rawTop, gridHeight - rawHeight));
                    const height = rawHeight;

                    const color = getEventColor(ev.designerId);
                    const pinnedTags = ev.customerId ? getPinnedTags(ev.customerId) : [];

                    return (
                      <DraggableEvent
                        key={ev.id}
                        ev={ev}
                        top={top}
                        height={height}
                        color={color}
                        pinnedTags={pinnedTags}
                        gridRef={gridRef}
                        columns={columns}
                        events={events}
                        startHour={START_HOUR}
                        endHour={END_HOUR}
                        role={role}
                        activeDesignerId={activeDesignerId}
                        onEventClick={onEventClick}
                        onEventMove={onEventMove}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            {isToday && currentTimeTop !== null && (
              <div
                className="absolute flex items-center z-10 pointer-events-none"
                style={{ top: currentTimeTop, left: AXIS_WIDTH, right: 0 }}
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
