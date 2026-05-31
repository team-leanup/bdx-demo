'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CustomerTagChip } from '@/components/customer/CustomerTagChip';
import { ReservationReadinessBadge } from '@/components/reservations/ReservationReadinessBadge';
import { SafetyTag } from '@/components/ui/SafetyTag';
import { FlagIcon } from '@/components/ui/FlagIcon';
import { IconCalendar } from '@/components/icons';
import { ChannelEmojiBadge } from '@/components/home/ChannelEmojiBadge';
import { useRouter } from 'next/navigation';
import { useConsultationStore } from '@/store/consultation-store';
import { useCustomerStore } from '@/store/customer-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useRecordsStore } from '@/store/records-store';
import { useAppStore } from '@/store/app-store';
import { PretreatmentAlertModal } from '@/components/alerts/PretreatmentAlertModal';
import ConsultationLinkModal from '@/components/reservations/ConsultationLinkModal';
import { getSafetyTagMeta } from '@/lib/tag-safety';
import { PreConsultSummaryInline } from '@/components/reservations/PreConsultSummaryInline';
import { getBookingStage } from '@/lib/booking-stage';
import { resolveCategoryLabelKo } from '@/lib/category-resolver';
import { addMinutesToTime, calcGapMinutes } from '@/lib/time-calculator';
import { isRenderableImageSrc } from '@/lib/image-utils';
import { getBookingThumbnailItems } from '@/lib/booking-thumbnail';
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

const LANGUAGE_SHORT_LABEL: Record<'en' | 'zh' | 'ja', string> = {
  en: 'EN',
  zh: '中',
  ja: '日',
};

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
  const getById = useCustomerStore((s) => s.getById);
  const getByCustomerId = usePortfolioStore((s) => s.getByCustomerId);
  const setEntryPoint = useConsultationStore((s) => s.setEntryPoint);
  const allRecords = useRecordsStore((s) => s.records);
  const defaultDurationMinutes = useAppStore((s) => s.shopSettings.timeSettings.baseHand) ?? 60;
  const shopSettings = useAppStore((s) => s.shopSettings);

  const [alertBooking, setAlertBooking] = useState<BookingRequest | null>(null);
  const [alertTags, setAlertTags] = useState<CustomerTag[]>([]);
  const [linkGenBooking, setLinkGenBooking] = useState<BookingRequest | null>(null);
  const [previewBooking, setPreviewBooking] = useState<BookingRequest | null>(null);
  const [zoomImageSrc, setZoomImageSrc] = useState<string | null>(null);

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

  const handleAlertQuickSale = (): void => {
    if (alertBooking) {
      const params = new URLSearchParams();
      params.set('bookingId', alertBooking.id);
      if (alertBooking.customerId) params.set('customerId', alertBooking.customerId);
      params.set('customerName', alertBooking.customerName);
      router.push(`/quick-sale?${params.toString()}`);
    }
    setAlertBooking(null);
    setAlertTags([]);
  };

  return (
    <>
    <motion.div variants={itemVariants} className="rounded-2xl bg-surface border border-border overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text">{sectionTitle}</span>
          {reservations.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1.5 text-[10px] font-medium text-white">
              {reservations.length}
            </span>
          )}
        </div>
        <button
          onClick={onViewAll}
          className="min-h-[44px] px-2 text-xs font-semibold text-primary active:opacity-60"
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
            const isCompleted = booking.status === 'completed' || booking.status === 'cancelled';
            const primaryTags = booking.customerId ? getPrimaryTags(booking.customerId).slice(0, 2) : [];
            const pinnedTags = booking.customerId ? getPinnedTags(booking.customerId) : [];
            const safetyTags = pinnedTags.filter((tag) => {
              const level = getSafetyTagMeta(tag).level;
              return level === 'high' || level === 'medium';
            });
            const customerPhotos = booking.customerId ? getByCustomerId(booking.customerId) : [];
            const recentPhoto = customerPhotos.find((photo) => isRenderableImageSrc(photo.imageDataUrl));
            const thumbnailItems = getBookingThumbnailItems(
              booking,
              customerPhotos.map((photo) => photo.imageDataUrl),
            );
            const isForeign = booking.language && booking.language !== 'ko';

            const isExistingCustomer = Boolean(booking.customerId);

            // H-3: 시술 종료 예상 시간 및 다음 예약까지 여유 시간
            const endTime = addMinutesToTime(booking.reservationTime, defaultDurationMinutes);
            const nextBooking = reservations[idx + 1];
            const gapMinutes = nextBooking && endTime
              ? calcGapMinutes(endTime, nextBooking.reservationTime)
              : null;

            const matchedRecord = allRecords.find((r) => r.consultation?.bookingId === booking.id);
            const stage = getBookingStage(booking, matchedRecord);

            const handleCardClick = (): void => {
              if (stage === 'completed' || stage === 'cancelled') return;
              if (stage === 'just_registered') {
                setLinkGenBooking(booking);
              } else if (stage === 'pre_consult_done') {
                // 0529 버그2: 사전상담 완료 예약은 카드 탭 시 '내용 확인(미리보기)'로 연다.
                // 시술 시작은 전용 버튼으로만 — 카드 탭이 시술시작으로 넘어가던 오작동 방지.
                setPreviewBooking(booking);
              } else {
                handleStartClick(booking);
              }
            };

            const quickSaleHandler = (e: React.MouseEvent): void => {
              e.stopPropagation();
              const params = new URLSearchParams();
              params.set('bookingId', booking.id);
              if (booking.customerId) params.set('customerId', booking.customerId);
              params.set('customerName', booking.customerName);
              router.push(`/quick-sale?${params.toString()}`);
            };

            return (
              <div key={booking.id}>
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06, duration: 0.3 }}
                  onClick={handleCardClick}
                  className={`flex flex-col gap-2 px-4 py-3 border-t border-border transition-colors md:flex-row md:items-center md:gap-3 ${isCompleted ? 'opacity-60 cursor-default' : 'cursor-pointer hover:bg-surface-alt active:bg-surface-alt'}`}
                >
                  <div className="flex min-w-0 items-start gap-3 md:flex-1 md:items-center">
                    {/* 시간 라벨 */}
                    <div className="flex w-11 shrink-0 flex-col items-center">
                      {booking.reservationTime && booking.reservationTime.includes(':') ? (
                        <>
                          <span className="text-xs font-semibold text-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {booking.reservationTime}
                          </span>
                          <div className="mt-1 h-1 w-1 rounded-full bg-primary/40" />
                          {endTime && (
                            <span className="mt-1 text-[10px] text-text-muted leading-tight" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              ~{endTime}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="rounded-full bg-surface-alt px-1.5 py-0.5 text-[9px] text-text-muted leading-tight text-center">
                          시간 미정
                        </span>
                      )}
                      {gapMinutes !== null && gapMinutes > 0 && (
                        <span className="mt-0.5 text-[9px] text-primary/60 leading-tight text-center">
                          {gapMinutes}분 여유
                        </span>
                      )}
                    </div>
                    {/* 세로 구분선 */}
                    <div className="h-10 w-px shrink-0 bg-border" />
                    {/* 고객 정보 */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-text truncate">
                          {booking.customerName}
                        </span>
                        {/* H-2: 국기 아이콘 + 언어 라벨 배지 */}
                        {isForeign && booking.language && booking.language !== 'ko' && (
                          <span className="inline-flex items-center gap-0.5">
                            <FlagIcon language={booking.language} size="sm" />
                            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary leading-none">
                              {LANGUAGE_SHORT_LABEL[booking.language]}
                            </span>
                          </span>
                        )}
                        {booking.serviceLabel && (
                          <span className="max-w-[100px] truncate px-2 py-0.5 rounded-full bg-primary/10 text-[11px] text-primary font-semibold">
                            {resolveCategoryLabelKo(booking.serviceLabel, shopSettings)}
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
                      {booking.requestNote && (
                        <p className="text-xs text-text-muted line-clamp-2 whitespace-pre-line">{booking.requestNote.replace(/\.\s*/g, '.\n')}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pl-14 md:ml-auto md:flex-nowrap md:pl-0">
                    {/* H-2: 썸네일 */}
                    {thumbnailItems.length > 0 && (
                      <div className="flex gap-1.5 overflow-x-auto pb-0.5 max-w-[120px] md:max-w-none">
                        {thumbnailItems.map((item, thumbIdx) => (
                          <button
                            key={`${item.label}-${thumbIdx}-${item.src}`}
                            onClick={(e) => { e.stopPropagation(); setZoomImageSrc(item.src); }}
                            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-alt cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
                          >
                            <Image
                              src={item.src}
                              alt=""
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-1 text-[10px] font-semibold leading-none text-white">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
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
                    ) : null}
                    <div className="ml-auto flex shrink-0 items-center gap-1.5">
                      {booking.customerId && stage !== 'completed' && stage !== 'cancelled' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/customers/${booking.customerId}`); }}
                          className="rounded-lg bg-surface-alt border border-border px-2.5 py-2.5 text-xs font-semibold text-text-secondary hover:bg-border active:scale-95 transition-all"
                        >
                          고객 정보
                        </button>
                      )}
                      {stage === 'cancelled' ? (
                        <span className="rounded-lg bg-surface-alt border border-border px-3 py-2.5 text-xs font-semibold text-text-muted cursor-default">
                          취소됨
                        </span>
                      ) : stage === 'completed' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const records = allRecords;
                            const byBooking = records.find((r) => r.consultation.bookingId === booking.id);
                            if (byBooking) { router.push(`/records/${byBooking.id}`); return; }
                            if (booking.customerId) {
                              const byCustomerDate = records.find((r) =>
                                r.customerId === booking.customerId &&
                                r.createdAt.startsWith(booking.reservationDate),
                              );
                              if (byCustomerDate) { router.push(`/records/${byCustomerDate.id}`); return; }
                            }
                            router.push('/records');
                          }}
                          className="shrink-0 rounded-lg bg-surface-alt px-3 py-2.5 text-xs font-semibold text-text-muted cursor-pointer hover:bg-border active:scale-95 transition-all"
                        >
                          시술 완료
                        </button>
                      ) : stage === 'just_registered' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setLinkGenBooking(booking); }}
                          className="rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white active:scale-95 transition-transform"
                        >
                          상담 링크 보내기
                        </button>
                      ) : stage === 'link_sent' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartClick(booking); }}
                          className="rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white active:scale-95 transition-transform shadow-sm shadow-primary/30 ring-1 ring-primary/20"
                        >
                          시술 시작
                        </button>
                      ) : stage === 'pre_consult_done' ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); router.push(`/records/preconsult/${booking.id}`); }}
                            className="rounded-lg bg-surface-alt border border-border px-2.5 py-2.5 text-xs font-semibold text-text-secondary cursor-pointer hover:bg-border active:scale-95 transition-all"
                          >
                            상담 내용
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartClick(booking); }}
                            className="rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white active:scale-95 transition-transform shadow-sm shadow-primary/30 ring-1 ring-primary/20"
                          >
                            시술 시작
                          </button>
                        </>
                      ) : stage === 'in_treatment' ? (
                        <span className="rounded-lg bg-blue-100 px-2.5 py-2.5 text-[11px] font-semibold text-blue-700">
                          결제 대기
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartClick(booking); }}
                          className="rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white active:scale-95 transition-transform shadow-sm shadow-primary/30 ring-1 ring-primary/20"
                        >
                          시술 시작
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>

              </div>
            );
          })}
        </div>
      )}

      <PretreatmentAlertModal
        isOpen={alertBooking !== null}
        onClose={handleAlertClose}
        onConfirm={handleAlertConfirm}
        onQuickSale={handleAlertQuickSale}
        customerName={alertBooking?.customerName ?? ''}
        pinnedTags={alertTags}
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
            className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-2xl bg-background pt-5 pb-safe md:bottom-auto md:top-1/2 md:left-1/2 md:right-auto md:w-full md:max-h-[85vh] md:max-w-md md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl"
          >
            <div className="mb-4 flex flex-shrink-0 items-center justify-between px-5">
              <div>
                <h3 className="text-base font-semibold text-text">사전 상담 내용</h3>
                <p className="text-xs text-text-muted">{previewBooking.customerName} · {previewBooking.reservationTime}</p>
              </div>
              <button
                onClick={() => setPreviewBooking(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-alt text-text-muted"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-5 pb-8">
              {previewBooking.preConsultationData ? (
                <PreConsultSummaryInline
                  data={previewBooking.preConsultationData}
                  referenceImageUrls={previewBooking.referenceImageUrls}
                />
              ) : (
                <p className="text-sm text-text-muted text-center py-4">사전 상담 내용이 없습니다.</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>

    {/* 이미지 확대 오버레이 */}
    <AnimatePresence>
      {zoomImageSrc && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80"
            onClick={() => setZoomImageSrc(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 z-50 flex items-center justify-center"
            onClick={() => setZoomImageSrc(null)}
          >
            <div className="relative max-h-full max-w-full overflow-hidden rounded-2xl">
              <Image
                src={zoomImageSrc}
                alt=""
                width={600}
                height={600}
                className="max-h-[80dvh] w-auto object-contain"
                unoptimized
              />
            </div>
            <button
              onClick={() => setZoomImageSrc(null)}
              className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
