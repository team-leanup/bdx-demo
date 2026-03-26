'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useReservationStore } from '@/store/reservation-store';
import {
  getPreConsultationNotifications,
  getUnreadPreConsultationCount,
  PRECONSULT_NOTIFICATIONS_UPDATED,
} from '@/lib/preconsult-notifications';
import { cn } from '@/lib/cn';

interface NotificationBellButtonProps {
  compact?: boolean;
  className?: string;
}

export function NotificationBellButton({
  compact = false,
  className,
}: NotificationBellButtonProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const reservations = useReservationStore((s) => s.reservations);
  const hydrateFromDB = useReservationStore((s) => s.hydrateFromDB);
  const notifications = useMemo(
    () => getPreConsultationNotifications(reservations),
    [reservations],
  );
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const sync = (): void => {
      setUnreadCount(getUnreadPreConsultationCount(notifications));
    };

    sync();
    window.addEventListener(PRECONSULT_NOTIFICATIONS_UPDATED, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(PRECONSULT_NOTIFICATIONS_UPDATED, sync);
      window.removeEventListener('storage', sync);
    };
  }, [notifications]);

  useEffect(() => {
    // M-6: /home 페이지에서는 home/page.tsx가 이미 폴링 중이므로 중복 방지
    if (pathname === '/home') return;

    const poll = (): void => {
      if (document.visibilityState === 'visible') {
        hydrateFromDB().catch(console.error);
      }
    };

    const interval = setInterval(poll, 30000);
    document.addEventListener('visibilitychange', poll);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', poll);
    };
  }, [hydrateFromDB, pathname]);

  const handleClick = (): void => {
    const params = new URLSearchParams(pathname === '/home' ? searchParams.toString() : '');
    params.set('notifications', 'preconsult');
    router.push(`/home?${params.toString()}`);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        compact
          ? 'relative flex h-6 w-6 items-center justify-center rounded-md text-text-muted/70 hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-colors'
          : 'relative w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-alt transition-colors',
        className,
      )}
      aria-label={unreadCount > 0 ? `알림 ${unreadCount}개` : '알림'}
    >
      <svg
        className={cn(compact ? 'h-3.5 w-3.5' : 'w-5 h-5', 'text-text-secondary')}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={compact ? 1.7 : 2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-white shadow-sm">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
