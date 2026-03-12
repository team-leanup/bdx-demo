'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomerTagChip } from '@/components/customer/CustomerTagChip';
import { ReservationReadinessBadge } from '@/components/reservations/ReservationReadinessBadge';
import { Badge } from '@/components/ui';
import { SafetyTag } from '@/components/ui/SafetyTag';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { IconCalendar } from '@/components/icons';
import { cn } from '@/lib/cn';

function ChannelEmojiBadge({ variant, icon, label }: { variant: string; icon: string; label: string }) {
  return (
    <Badge variant={variant as 'primary' | 'neutral' | 'success' | 'warning'} size="sm">
      <span className="text-[10px] leading-none">{icon}</span>
      {label}
    </Badge>
  );
}
import { useRouter } from 'next/navigation';
import { useConsultationStore } from '@/store/consultation-store';
import { useCustomerStore } from '@/store/customer-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useRecordsStore } from '@/store/records-store';
import { PretreatmentAlertModal } from '@/components/alerts/PretreatmentAlertModal';
import { LinkCustomerModal } from '@/components/reservations/LinkCustomerModal';
import ConsultationLinkModal from '@/components/reservations/ConsultationLinkModal';
import { getSafetyTagMeta } from '@/lib/tag-safety';
import type { BookingChannel, BookingRequest } from '@/types/consultation';
import type { CustomerTag } from '@/types/customer';

interface ChannelBadgeInfo {
  label: string;
  icon: string;
  variant: 'primary' | 'neutral' | 'success' | 'warning';
}

interface TodayReservationCardProps {
  reservations: BookingRequest[];
  shopName: string;
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
  shopName,
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
  const router = useRouter();
  const getPinnedTags = useCustomerStore((s) => s.getPinnedTags);
  const getPrimaryTags = useCustomerStore((s) => s.getPrimaryTags);
  const getByCustomerId = usePortfolioStore((s) => s.getByCustomerId);
  const setEntryPoint = useConsultationStore((s) => s.setEntryPoint);
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);

  const [alertBooking, setAlertBooking] = useState<BookingRequest | null>(null);
  const [alertTags, setAlertTags] = useState<CustomerTag[]>([]);
  const [linkModalBooking, setLinkModalBooking] = useState<BookingRequest | null>(null);
  const [linkGenBooking, setLinkGenBooking] = useState<BookingRequest | null>(null);
  const [previewBooking, setPreviewBooking] = useState<BookingRequest | null>(null);

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
    <>
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
            const primaryTags = booking.customerId ? getPrimaryTags(booking.customerId).slice(0, 2) : [];
            const pinnedTags = booking.customerId ? getPinnedTags(booking.customerId) : [];
            const safetyTags = pinnedTags.filter((tag) => {
              const level = getSafetyTagMeta(tag).level;
              return level === 'high' || level === 'medium';
            });
            const recentPhoto = booking.customerId ? getByCustomerId(booking.customerId)[0] : undefined;
            const isForeign = booking.language && booking.language !== 'ko';

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
                    {/* H-4: 국기 아이콘 */}
                    {isForeign && (
                      <FlagIcon language={booking.language!} size="sm" />
                    )}
                    {booking.serviceLabel && (
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-[11px] text-primary font-semibold">
                        {booking.serviceLabel}
                      </span>
                    )}
                    {/* H-3: 클릭 가능한 준비도 배지 */}
                    {booking.preConsultationCompletedAt ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewBooking(booking);
                        }}
                        className="cursor-pointer"
                      >
                        <ReservationReadinessBadge booking={booking} size="sm" compact />
                      </button>
                    ) : (
                      <ReservationReadinessBadge booking={booking} size="sm" compact />
                    )}
                    <ChannelEmojiBadge variant={channelInfo.variant} icon={channelInfo.icon} label={channelInfo.label} />
                  </div>
                  {/* H-1: 세이프티 태그 */}
                  {safetyTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {safetyTags.map((tag) => (
                        <SafetyTag key={tag.id} tag={tag} size="xs" />
                      ))}
                    </div>
                  )}
                  {primaryTags.length > 0 && safetyTags.length === 0 && (
                    <div className="mt-0.5 flex flex-wrap gap-1">
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
                      className="self-start text-left text-[10px] text-warning font-medium hover:underline"
                    >
                      고객 연결 필요
                    </button>
                  )}
                  {booking.requestNote && (
                    <p className="text-xs text-text-muted line-clamp-2 whitespace-pre-line">{booking.requestNote.replace(/\.\s*/g, '.\n')}</p>
                  )}
                </div>
                {/* H-2: 썸네일 */}
                <div className="shrink-0">
                  {recentPhoto ? (
                    <div className="h-8 w-8 rounded-full overflow-hidden border-2 border-border">
                      <Image
                        src={recentPhoto.imageDataUrl}
                        alt=""
                        width={32}
                        height={32}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt border border-border">
                      <span className="text-[8px] font-bold text-text-muted">신규</span>
                    </div>
                  )}
                </div>
                {isCompleted ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const records = getAllRecords();
                      // 1) bookingId 정확 매칭
                      const byBooking = records.find((r) => r.consultation.bookingId === booking.id);
                      if (byBooking) { router.push(`/records/${byBooking.id}`); return; }
                      // 2) customerId + 예약 날짜 매칭
                      if (booking.customerId) {
                        const byCustomerDate = records.find((r) =>
                          r.customerId === booking.customerId &&
                          r.createdAt.startsWith(booking.reservationDate),
                        );
                        if (byCustomerDate) { router.push(`/records/${byCustomerDate.id}`); return; }
                      }
                      // 3) fallback: 기록 탭으로 이동
                      router.push('/records');
                    }}
                    className="shrink-0 rounded-lg bg-surface-alt px-3 py-2 text-xs font-semibold text-text-muted cursor-pointer hover:bg-border active:scale-95 transition-all"
                  >
                    상담 완료
                  </button>
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
        shopName={shopName}
      />
    </motion.div>

    {/* H-3: 사전상담 데이터 미리보기 모달 — motion.div 바깥에 렌더링 (fixed 포지셔닝 보장) */}
    <AnimatePresence>
      {previewBooking && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setPreviewBooking(null)}
          />
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background px-5 pb-8 pt-5 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-full md:max-w-md md:rounded-2xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">사전 상담 내용</h3>
                <p className="text-xs text-text-muted">{previewBooking.customerName} · {previewBooking.reservationTime}</p>
              </div>
              <button
                onClick={() => setPreviewBooking(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-text-muted"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {previewBooking.preConsultationData?.referenceImages && previewBooking.preConsultationData.referenceImages.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2">참고 이미지</p>
                  <div className="flex gap-2 flex-wrap">
                    {previewBooking.preConsultationData.referenceImages.map((url, i) => (
                      <div key={i} className="h-20 w-20 rounded-xl overflow-hidden border border-border flex-shrink-0">
                        <Image src={url} alt="" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {previewBooking.referenceImageUrls && previewBooking.referenceImageUrls.length > 0 && !previewBooking.preConsultationData?.referenceImages?.length && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2">참고 이미지</p>
                  <div className="flex gap-2 flex-wrap">
                    {previewBooking.referenceImageUrls.map((url, i) => (
                      <div key={i} className="h-20 w-20 rounded-xl overflow-hidden border border-border flex-shrink-0">
                        <Image src={url} alt="" width={80} height={80} className="h-full w-full object-cover" unoptimized />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {previewBooking.requestNote && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-1">요청 메모</p>
                  <div className="rounded-xl bg-surface-alt p-3">
                    <p className="text-xs text-text-secondary whitespace-pre-line">{previewBooking.requestNote}</p>
                  </div>
                </div>
              )}
              {!previewBooking.requestNote && !previewBooking.referenceImageUrls?.length && !previewBooking.preConsultationData?.referenceImages?.length && (
                <p className="text-sm text-text-muted text-center py-4">사전 상담 내용이 없습니다.</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
