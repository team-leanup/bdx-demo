'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CustomerTagChip } from '@/components/customer/CustomerTagChip';
import { ReservationReadinessBadge } from '@/components/reservations/ReservationReadinessBadge';
import { Badge } from '@/components/ui';
import { IconCalendar } from '@/components/icons';
import { useConsultationStore } from '@/store/consultation-store';
import { useCustomerStore } from '@/store/customer-store';
import { PretreatmentAlertModal } from '@/components/alerts/PretreatmentAlertModal';
import { LinkCustomerModal } from '@/components/reservations/LinkCustomerModal';
import ConsultationLinkModal from '@/components/reservations/ConsultationLinkModal';
import type { BookingChannel, BookingRequest } from '@/types/consultation';
import type { CustomerTag } from '@/types/customer';

interface ChannelBadgeInfo {
  label: string;
  icon: string;
  variant: 'primary' | 'neutral' | 'success' | 'warning';
}

interface TodayReservationCardProps {
  reservations: BookingRequest[];
  channelBadge: Record<BookingChannel, ChannelBadgeInfo>;
  onViewAll: () => void;
  onStartConsultation: (booking: BookingRequest) => void;
  sectionTitle: string;
  viewAllLabel: string;
  noReservationText: string;
  noReservationSubText: string;
  startConsultationLabel: string;
  itemVariants: {
    hidden: { opacity: number; y: number };
    visible: { opacity: number; y: number; transition: { duration: number; ease: number[] } };
  };
}

export function TodayReservationCard({
  reservations,
  channelBadge,
  onViewAll,
  onStartConsultation,
  sectionTitle,
  viewAllLabel,
  noReservationText,
  noReservationSubText,
  startConsultationLabel,
  itemVariants,
}: TodayReservationCardProps): React.ReactElement {
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);
  const getPrimaryTags = useCustomerStore((s) => s.getPrimaryTags);
  const setEntryPoint = useConsultationStore((s) => s.setEntryPoint);

  const [alertBooking, setAlertBooking] = useState<BookingRequest | null>(null);
  const [alertTags, setAlertTags] = useState<CustomerTag[]>([]);
  const [linkModalBooking, setLinkModalBooking] = useState<BookingRequest | null>(null);
  const [linkGenBooking, setLinkGenBooking] = useState<BookingRequest | null>(null);

  const handleStartClick = (booking: BookingRequest): void => {
    if (booking.customerId) {
      const pinnedTags = getPinnedTags(booking.customerId);
      if (pinnedTags.length > 0) {
        setAlertBooking(booking);
        setAlertTags(pinnedTags);
        return;
      }
    }
    setEntryPoint('staff');
    onStartConsultation(booking);
  };

  const handleAlertConfirm = (): void => {
    if (alertBooking) {
      setEntryPoint('staff');
      onStartConsultation(alertBooking);
    }
    setAlertBooking(null);
    setAlertTags([]);
  };

  const handleAlertClose = (): void => {
    setAlertBooking(null);
    setAlertTags([]);
  };

  return (
    <motion.div variants={itemVariants} className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-text">{sectionTitle}</span>
          {reservations.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1.5 text-[10px] font-bold text-white">
              {reservations.length}
            </span>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-primary active:opacity-60"
        >
          {viewAllLabel}
        </button>
      </div>

      {/* 예약 리스트 or 빈 상태 */}
      {reservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-alt">
            <IconCalendar className="h-6 w-6 text-text-muted" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-text-secondary">{noReservationText}</p>
            <p className="mt-0.5 text-xs text-text-muted">{noReservationSubText}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {reservations.map((booking, idx) => {
            const channelInfo = channelBadge[booking.channel];
            const isCompleted = booking.status === 'completed';
            const primaryTags = booking.customerId ? getPrimaryTags(booking.customerId).slice(0, 3) : [];
            return (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06, duration: 0.3 }}
                onClick={() => !isCompleted && handleStartClick(booking)}
                className={`flex items-center gap-3 px-4 py-3 border-t border-border transition-colors ${isCompleted ? 'opacity-60 cursor-default' : 'cursor-pointer hover:bg-surface-alt active:bg-surface-alt'}`}
              >
                {/* 시간 라벨 */}
                <div className="flex w-11 shrink-0 flex-col items-center">
                  <span className="text-xs font-bold text-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {booking.reservationTime}
                  </span>
                  <div className="mt-1 h-1 w-1 rounded-full bg-primary/40" />
                </div>
                {/* 세로 구분선 */}
                <div className="h-10 w-px shrink-0 bg-border" />
                {/* 고객 정보 */}
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-semibold text-text truncate">
                      {booking.customerName}
                    </span>
                    {booking.serviceLabel && (
                      <span className="px-2 py-0.5 rounded-md bg-primary/15 text-xs text-primary font-bold">
                        {booking.serviceLabel}
                      </span>
                    )}
                    <ReservationReadinessBadge booking={booking} size="sm" compact />
                    <Badge variant={channelInfo.variant} size="sm">
                      {channelInfo.icon} {channelInfo.label}
                    </Badge>
                  </div>
                  {primaryTags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {primaryTags.map((tag) => (
                        <CustomerTagChip key={tag.id} tag={tag} size="sm" />
                      ))}
                    </div>
                  )}
                  {!booking.customerId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLinkModalBooking(booking);
                      }}
                      className="text-[10px] text-warning font-medium hover:underline"
                    >
                      고객 연결 필요
                    </button>
                  )}
                  {booking.requestNote && (
                    <p className="text-xs text-text-muted line-clamp-2 whitespace-pre-line">{booking.requestNote.replace(/\.\s*/g, '.\n')}</p>
                  )}
                </div>
                {isCompleted ? (
                  <span className="shrink-0 rounded-lg bg-surface-alt px-3 py-2 text-xs font-semibold text-text-muted">
                    상담 완료
                  </span>
                ) : (
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLinkGenBooking(booking);
                      }}
                      className="rounded-lg bg-surface-alt border border-border px-2.5 py-2 text-xs font-semibold text-text-secondary hover:bg-border active:scale-95 transition-all"
                      title="상담 링크"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </button>
                    <button className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white active:scale-95 transition-transform">
                      {startConsultationLabel}
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <PretreatmentAlertModal
        isOpen={alertBooking !== null}
        onClose={handleAlertClose}
        onConfirm={handleAlertConfirm}
        customerName={alertBooking?.customerName ?? ''}
        pinnedTags={alertTags}
      />

      <LinkCustomerModal
        isOpen={linkModalBooking !== null}
        onClose={() => setLinkModalBooking(null)}
        reservationId={linkModalBooking?.id ?? ''}
        reservationName={linkModalBooking?.customerName ?? ''}
        reservationPhone={linkModalBooking?.phone}
      />

      <ConsultationLinkModal
        isOpen={linkGenBooking !== null}
        onClose={() => setLinkGenBooking(null)}
        booking={linkGenBooking}
      />
    </motion.div>
  );
}
