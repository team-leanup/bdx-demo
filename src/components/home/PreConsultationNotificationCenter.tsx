'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { Modal } from '@/components/ui';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { formatDateDot, formatDateDotWithTime, formatTime } from '@/lib/format';
import { DESIGN_SCOPE_LABEL, BODY_PART_LABEL } from '@/lib/labels';
import {
  getPreConsultationNotifications,
  getUnreadPreConsultationCount,
  isPreConsultationNotificationRead,
  markPreConsultationNotificationRead,
  PRECONSULT_NOTIFICATIONS_UPDATED,
  type PreConsultationNotification,
} from '@/lib/preconsult-notifications';
import type { BookingRequest } from '@/types/consultation';

interface PreConsultationNotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  reservations: BookingRequest[];
  onSelectNotification: (notification: PreConsultationNotification) => void;
}

export function PreConsultationNotificationCenter({
  isOpen,
  onClose,
  reservations,
  onSelectNotification,
}: PreConsultationNotificationCenterProps): React.ReactElement {
  const notifications = useMemo(
    () => getPreConsultationNotifications(reservations),
    [reservations],
  );
  const [readVersion, setReadVersion] = useState(0);

  useEffect(() => {
    const sync = (): void => {
      setReadVersion((current) => current + 1);
    };

    window.addEventListener(PRECONSULT_NOTIFICATIONS_UPDATED, sync);
    window.addEventListener('storage', sync);

    return () => {
      window.removeEventListener(PRECONSULT_NOTIFICATIONS_UPDATED, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const unreadCount =
    readVersion < 0 ? 0 : getUnreadPreConsultationCount(notifications);

  const handleSelect = (notification: PreConsultationNotification): void => {
    markPreConsultationNotificationRead(notification);
    onSelectNotification(notification);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="사전상담 알림 센터">
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="rounded-2xl border border-border bg-surface-alt px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-text">새로 확인할 사전상담</p>
              <p className="mt-1 text-xs text-text-muted">
                고객이 미리 보낸 디자인 요청과 참고 이미지를 바로 확인할 수 있어요.
              </p>
            </div>
            <div className="rounded-xl bg-primary/10 px-3 py-2 text-right">
              <p className="text-[10px] font-semibold text-primary/80">미확인</p>
              <p className="text-lg font-black text-primary">{unreadCount}</p>
            </div>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-alt px-5 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface text-text-muted">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-semibold text-text">새로운 사전상담 알림이 없어요</p>
            <p className="mt-1 text-xs text-text-muted">고객이 상담 링크를 제출하면 여기에 쌓입니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-2">
            {notifications.map((notification) => {
              const isRead = isPreConsultationNotificationRead(notification);
              const isForeign = notification.language && notification.language !== 'ko';

              return (
                <button
                  key={notification.key}
                  type="button"
                  onClick={() => handleSelect(notification)}
                  className="w-full rounded-2xl border border-border bg-surface p-4 text-left transition-colors hover:bg-surface-alt"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {!isRead && <span className="mt-0.5 h-2.5 w-2.5 rounded-full bg-primary" />}
                        <span className="truncate text-sm font-bold text-text">{notification.customerName}</span>
                        {isForeign && <FlagIcon language={notification.language!} size="sm" />}
                        {notification.serviceLabel && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            {notification.serviceLabel}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-text-secondary">
                        {formatDateDot(notification.reservationDate)} · {formatTime(notification.reservationTime)} 예약
                      </p>
                      <p className="mt-2 text-xs text-text-muted">
                        제출 시각 {formatDateDotWithTime(notification.completedAt)}
                      </p>

                      {/* 디자인 요약 */}
                      {notification.preConsultationData && (
                        <p className="mt-1.5 text-xs text-text-secondary">
                          {[
                            BODY_PART_LABEL[notification.preConsultationData.bodyPart],
                            DESIGN_SCOPE_LABEL[notification.preConsultationData.designScope],
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}

                      {/* 참고 이미지 썸네일 */}
                      {notification.referenceImageUrls && notification.referenceImageUrls.length > 0 && (
                        <div className="flex gap-1.5 mt-2">
                          {notification.referenceImageUrls.slice(0, 3).map((url, i) => (
                            <div key={i} className="h-12 w-12 rounded-lg overflow-hidden border border-border flex-shrink-0">
                              <Image src={url} alt="" width={48} height={48} className="h-full w-full object-cover" unoptimized />
                            </div>
                          ))}
                          {notification.referenceImageUrls.length > 3 && (
                            <div className="h-12 w-12 rounded-lg bg-surface-alt border border-border flex items-center justify-center text-xs text-text-muted">
                              +{notification.referenceImageUrls.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 rounded-xl bg-surface-alt px-3 py-2 text-right">
                      <p className="text-[10px] font-semibold text-text-muted">
                        {isRead ? '확인 완료' : '새 알림'}
                      </p>
                      <p className="mt-0.5 text-xs font-bold text-text">예약 상세 보기</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
