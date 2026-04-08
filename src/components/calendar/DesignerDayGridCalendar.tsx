'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { CustomerTagChip } from '@/components/customer/CustomerTagChip';
import { ReservationReadinessBadge } from '@/components/reservations/ReservationReadinessBadge';
import { DragConfirmModal } from '@/components/calendar/DragConfirmModal';
import { useLongPress } from '@/lib/hooks/useLongPress';
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
  onSlotLongPress?: (time: string, designerId: string) => void;
  onAddReservation?: () => void;
  role: UserRole;
  activeDesignerId: string | null;
}

interface PendingMove {
  eventId: string;
  eventTitle: string;
  fromTime: string;
  toTime: string;
  fromDesigner: string | undefined;
  toDesigner: string | undefined;
}

const DESIGNER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'designer-001': { bg: 'bg-rose-100', border: 'border-rose-500', text: 'text-rose-800' },
  'designer-002': { bg: 'bg-emerald-100', border: 'border-emerald-500', text: 'text-emerald-800' },
  'designer-003': { bg: 'bg-sky-100', border: 'border-sky-500', text: 'text-sky-800' },
};

const DEFAULT_COLOR = { bg: 'bg-primary/10', border: 'border-primary', text: 'text-primary' };

const CHANNEL_EMOJI: Record<string, string> = {
  kakao: '💬',
  naver: 'N',
  phone: '📞',
  walk_in: '🚶',
};

const LANGUAGE_FLAG: Record<string, string> = {
  en: '🇺🇸',
  zh: '🇨🇳',
  ja: '🇯🇵',
};

function timeToMinutes(time: string): number {
  if (!time || !time.includes(':')) return 0;
  const [h, m] = time.split(':').map(Number);
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
}

function getEventColor(designerId?: string): { bg: string; border: string; text: string } {
  if (designerId && DESIGNER_COLORS[designerId]) {
    return DESIGNER_COLORS[designerId];
  }
  return DEFAULT_COLOR;
}

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = (): void => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

interface DraggableEventProps {
  ev: TimeGridEvent;
  top: number;
  height: number;
  color: { bg: string; border: string; text: string };
  customerTags: CustomerTag[];
  gridRef: React.RefObject<HTMLDivElement | null>;
  columns: { id: string; name: string }[];
  events: TimeGridEvent[];
  startHour: number;
  endHour: number;
  role: UserRole;
  activeDesignerId: string | null;
  hourHeight: number;
  axisWidth: number;
  onEventClick?: (event: TimeGridEvent) => void;
  onEventMove?: (reservationId: string, updates: { reservationTime: string; designerId?: string }) => void;
  onRequestMove?: (pending: PendingMove) => void;
}

function DraggableEvent({
  ev,
  top,
  height,
  color,
  customerTags,
  gridRef,
  columns,
  events,
  startHour,
  endHour,
  role,
  activeDesignerId,
  hourHeight,
  axisWidth,
  onEventClick,
  onEventMove,
  onRequestMove,
}: DraggableEventProps): React.ReactElement {
  const controls = useAnimationControls();
  const [isDragging, setIsDragging] = useState(false);

  const displayTags = customerTags.slice(0, 2);
  const extraTagCount = customerTags.length - 2;
  const showMetaRow = height >= 48;
  const showTags = height >= 60 && displayTags.length > 0;

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
    const dropXCols = dropX - axisWidth;
    const colWidth = (rect.width - axisWidth) / columnCount;
    const colIndex = Math.max(0, Math.min(Math.floor(dropXCols / colWidth), columnCount - 1));

    const targetDesignerId = colIndex === 0 ? undefined : columns[colIndex].id;

    const minuteFromTop = (dropY / hourHeight) * 60 + startHour * 60;
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

    // 동일 위치 드래그는 무시
    if (timeStr === ev.startTime && targetDesignerId === ev.designerId) {
      void controls.start({ x: 0, y: 0 });
      return;
    }

    // 확인 모달을 띄울 경우
    if (onRequestMove) {
      const fromDesignerName = columns.find((c) => c.id === (ev.designerId ?? '__unassigned__'))?.name;
      const toDesignerName = columns.find((c) => c.id === (targetDesignerId ?? '__unassigned__'))?.name;
      onRequestMove({
        eventId: ev.originalId,
        eventTitle: ev.title,
        fromTime: ev.startTime,
        toTime: timeStr,
        fromDesigner: fromDesignerName,
        toDesigner: toDesignerName,
      });
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
        'absolute left-0.5 right-0.5 rounded-lg px-2 py-1.5 text-left transition-opacity hover:opacity-80',
        canDrag ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        color.bg,
        'border-l-3',
        color.border,
        color.text,
      )}
      style={{ top, height, overflow: 'hidden' }}
    >
      <div className="text-[11px] font-semibold opacity-70 leading-none">
        {ev.startTime}–{ev.endTime}
      </div>
      <div className="text-sm font-semibold leading-snug mt-1">{ev.title}</div>
      {showMetaRow && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {ev.serviceLabel && (
            <span className="inline-flex items-center rounded-full bg-white/55 px-2 py-0.5 text-[11px] font-semibold text-text">
              {ev.serviceLabel}
            </span>
          )}
          {ev.type === 'reservation' && (
            <ReservationReadinessBadge
              booking={{ preConsultationCompletedAt: ev.preConsultationCompletedAt, consultationLinkSentAt: ev.consultationLinkSentAt, channel: (ev.channel ?? 'walk_in') as 'kakao' | 'naver' | 'phone' | 'walk_in' }}
              size="xs"
              compact
            />
          )}
          {ev.channel && CHANNEL_EMOJI[ev.channel] && (
            <span className="text-[11px]">{CHANNEL_EMOJI[ev.channel]}</span>
          )}
          {ev.language && ev.language !== 'ko' && LANGUAGE_FLAG[ev.language] && (
            <span className="text-[11px]">{LANGUAGE_FLAG[ev.language]}</span>
          )}
        </div>
      )}
      {showTags && (
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {displayTags.map((tag) => (
            <CustomerTagChip key={tag.id} tag={tag} size="xs" />
          ))}
          {extraTagCount > 0 && (
            <span className="text-[10px] text-text-muted">+{extraTagCount}</span>
          )}
        </div>
      )}
    </motion.button>
  );
}

interface SlotColumnProps {
  col: { id: string; name: string };
  events: TimeGridEvent[];
  gridHeight: number;
  startHour: number;
  endHour: number;
  gridRef: React.RefObject<HTMLDivElement | null>;
  columns: { id: string; name: string }[];
  allEvents: TimeGridEvent[];
  role: UserRole;
  activeDesignerId: string | null;
  hourHeight: number;
  axisWidth: number;
  getPrimaryTags: (customerId: string) => CustomerTag[];
  onEventClick?: (event: TimeGridEvent) => void;
  onEventMove?: (reservationId: string, updates: { reservationTime: string; designerId?: string }) => void;
  onRequestMove: (pending: PendingMove) => void;
  onSlotLongPress?: (time: string, designerId: string) => void;
}

function SlotColumn({
  col,
  events,
  gridHeight,
  startHour,
  endHour,
  gridRef,
  columns,
  allEvents,
  role,
  activeDesignerId,
  hourHeight,
  axisWidth,
  getPrimaryTags,
  onEventClick,
  onEventMove,
  onRequestMove,
  onSlotLongPress,
}: SlotColumnProps): React.ReactElement {
  const [isHolding, setIsHolding] = useState(false);
  const longPressTimeRef = useRef('');

  const handleLongPress = useCallback(() => {
    setIsHolding(false);
    if (onSlotLongPress && col.id !== '__unassigned__') {
      onSlotLongPress(longPressTimeRef.current, col.id);
    }
  }, [col.id, onSlotLongPress]);

  const longPressHandlers = useLongPress({ onLongPress: handleLongPress, delay: 600 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const minuteFromTop = (y / hourHeight) * 60 + startHour * 60;
    const snapped = snapToInterval(minuteFromTop, 30);
    longPressTimeRef.current = minutesToTimeStr(
      clampStartMinutes({ startMinutes: snapped, startHour, endHour, durationMinutes: 30 }),
    );
    setIsHolding(true);
    longPressHandlers.onMouseDown(e);
  };

  const handleMouseUp = () => {
    setIsHolding(false);
    longPressHandlers.onMouseUp();
  };

  const handleMouseLeave = () => {
    setIsHolding(false);
    longPressHandlers.onMouseLeave();
  };

  return (
    <div
      className={cn('relative border-l border-border overflow-visible transition-colors select-none', isHolding && 'bg-primary/10 animate-pulse')}
      style={{ WebkitUserSelect: 'none', touchAction: 'pan-y' }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const touch = e.touches[0];
        const y = touch.clientY - rect.top;
        const minuteFromTop = (y / hourHeight) * 60 + startHour * 60;
        const snapped = snapToInterval(minuteFromTop, 30);
        longPressTimeRef.current = minutesToTimeStr(
          clampStartMinutes({ startMinutes: snapped, startHour, endHour, durationMinutes: 30 }),
        );
        setIsHolding(true);
        longPressHandlers.onTouchStart(e);
      }}
      onTouchEnd={() => { setIsHolding(false); longPressHandlers.onTouchEnd(); }}
      onTouchMove={(e) => { setIsHolding(false); longPressHandlers.onTouchMove(e); }}
    >
      {events.map((ev) => {
        const startMin = timeToMinutes(ev.startTime);
        const endMin = timeToMinutes(ev.endTime);
        const rawTop = ((startMin - startHour * 60) / 60) * hourHeight;
        const rawHeight = Math.max(((endMin - startMin) / 60) * hourHeight, 40);
        const evTop = Math.max(0, Math.min(rawTop, gridHeight - rawHeight));
        const evHeight = rawHeight;
        const color = getEventColor(ev.designerId);
        const customerTags = ev.customerId ? getPrimaryTags(ev.customerId) : [];

        return (
          <DraggableEvent
            key={ev.id}
            ev={ev}
            top={evTop}
            height={evHeight}
            color={color}
            customerTags={customerTags}
            gridRef={gridRef}
            columns={columns}
            events={allEvents}
            startHour={startHour}
            endHour={endHour}
            role={role}
            activeDesignerId={activeDesignerId}
            hourHeight={hourHeight}
            axisWidth={axisWidth}
            onEventClick={onEventClick}
            onEventMove={onEventMove}
            onRequestMove={onRequestMove}
          />
        );
      })}
    </div>
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
  onSlotLongPress,
  onAddReservation,
}: DesignerDayGridCalendarProps) {
  const [currentTime, setCurrentTime] = useState(getCurrentTimeInKorea());
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const getPrimaryTags = useCustomerStore((s) => s.getPrimaryTags);
  const gridRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const hourHeight = 120;
  const axisWidth = isMobile ? 40 : 60;
  const HEADER_H = isMobile ? 28 : 36;

  const START_HOUR = propStartHour ?? 10;
  const END_HOUR = propEndHour ?? 20;
  const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  const gridHeight = HOURS.length * hourHeight;

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
    return ((h * 60 + m) - START_HOUR * 60) / 60 * hourHeight;
  }, [currentTime, START_HOUR, END_HOUR, isToday, hourHeight]);

  // 디자이너 1명 + 미지정 이벤트 없으면 __unassigned__ 컬럼 숨김
  const hasUnassignedEvents = useMemo(
    () => events.some((ev) => ev.date === date && !ev.designerId),
    [events, date],
  );

  const columns = useMemo(() => {
    const cols = [...designers];
    if (designers.length !== 1 || hasUnassignedEvents) {
      cols.push({ id: '__unassigned__', name: '미지정' });
    }
    return cols;
  }, [designers, hasUnassignedEvents]);

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
      } else if (map['__unassigned__']) {
        map['__unassigned__'].push(ev);
      }
    }
    return map;
  }, [events, date, columns]);

  const colCount = columns.length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-text">{formatDayLabelKo(date)}</div>
        {onAddReservation && (
          <button
            type="button"
            onClick={onAddReservation}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-primary-dark active:scale-95 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            예약 추가
          </button>
        )}
      </div>

      {/* 시간축(왼쪽) + 그리드(오른쪽) 분리 레이아웃 */}
      <div className="flex">
        {/* 시간축 — border 바깥이라 overflow 문제 없음 */}
        <div className="flex-shrink-0 relative" style={{ width: axisWidth }}>
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute w-full text-right pr-1 sm:pr-2 -translate-y-1/2 text-[9px] sm:text-[10px] text-text-muted"
              style={{ top: HEADER_H + (hour - START_HOUR) * hourHeight }}
            >
              {`${String(hour).padStart(2, '0')}:00`}
            </div>
          ))}
        </div>

        {/* 메인 그리드 */}
        <div className="flex-1 rounded-xl border border-border bg-surface overflow-hidden">
          {/* 헤더: 디자이너 이름 */}
          <div
            className="grid border-b border-border bg-surface"
            style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)`, height: HEADER_H }}
          >
            {columns.map((col, ci) => (
              <div
                key={col.id}
                className={cn('flex items-center justify-center px-1', ci > 0 && 'border-l border-border')}
              >
                <div className="text-[10px] sm:text-xs font-semibold text-text truncate">{col.name}</div>
              </div>
            ))}
          </div>

          {/* 그리드 셀 + 이벤트 */}
          <div className="relative bg-surface" style={{ height: gridHeight }}>
            {/* 가로 격자선 */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute w-full grid"
                style={{
                  top: (hour - START_HOUR) * hourHeight,
                  gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                }}
              >
                {columns.map((col, ci) => (
                  <div
                    key={col.id}
                    className={cn(ci > 0 && 'border-l border-border', hour > START_HOUR && 'border-t border-border')}
                    style={{ height: hourHeight }}
                  />
                ))}
              </div>
            ))}

            {/* 이벤트 오버레이 */}
            <div
              ref={gridRef}
              className="absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
            >
              {columns.map((col) => (
                <SlotColumn
                  key={col.id}
                  col={col}
                  events={eventsByColumn[col.id] || []}
                  gridHeight={gridHeight}
                  startHour={START_HOUR}
                  endHour={END_HOUR}
                  gridRef={gridRef}
                  columns={columns}
                  allEvents={events}
                  role={role}
                  activeDesignerId={activeDesignerId}
                  hourHeight={hourHeight}
                  axisWidth={0}
                  getPrimaryTags={getPrimaryTags}
                  onEventClick={onEventClick}
                  onEventMove={onEventMove}
                  onRequestMove={setPendingMove}
                  onSlotLongPress={onSlotLongPress}
                />
              ))}
            </div>

            {/* 현재 시간 표시선 */}
            {isToday && currentTimeTop !== null && (
              <div
                className="absolute flex items-center z-10 pointer-events-none"
                style={{ top: currentTimeTop, left: 0, right: 0 }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-error -ml-1.5 flex-shrink-0" />
                <div className="flex-1 h-0.5 bg-error" />
              </div>
            )}
          </div>
        </div>
      </div>

      <DragConfirmModal
        open={pendingMove !== null}
        eventTitle={pendingMove?.eventTitle ?? ''}
        fromTime={pendingMove?.fromTime ?? ''}
        toTime={pendingMove?.toTime ?? ''}
        fromDesigner={pendingMove?.fromDesigner}
        toDesigner={pendingMove?.toDesigner}
        onConfirm={() => {
          if (pendingMove) {
            onEventMove?.(pendingMove.eventId, {
              reservationTime: pendingMove.toTime,
              designerId: columns.find((c) => c.name === pendingMove.toDesigner)?.id,
            });
          }
          setPendingMove(null);
        }}
        onCancel={() => setPendingMove(null)}
      />
    </div>
  );
}
