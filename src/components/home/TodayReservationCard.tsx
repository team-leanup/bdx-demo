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
import { formatPrice, formatDateDot } from '@/lib/format';
function ChannelEmojiBadge({ variant, label }: { variant: string; icon: string; label: string }) {
  return (
    <Badge variant={variant as 'primary' | 'neutral' | 'success' | 'warning'} size="sm">
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

import ConsultationLinkModal from '@/components/reservations/ConsultationLinkModal';
import { getSafetyTagMeta } from '@/lib/tag-safety';
import { getBookingStage } from '@/lib/booking-stage';
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

interface BookingThumbnailItem {
  src: string;
  label: '요청' | '이전';
}

function isRenderableImageSrc(src: string | undefined): src is string {
  if (!src) {
    return false;
  }

  return !src.startsWith('blob:');
}

function getBookingThumbnailItems(
  booking: BookingRequest,
  portfolioImageUrls: string[],
): BookingThumbnailItem[] {
  const items: BookingThumbnailItem[] = [];
  const seen = new Set<string>();
  const requestImageUrls = booking.preConsultationData?.referenceImages?.length
    ? booking.preConsultationData.referenceImages
    : (booking.referenceImageUrls ?? []);

  for (const src of requestImageUrls) {
    if (!isRenderableImageSrc(src) || seen.has(src)) continue;
    seen.add(src);
    items.push({ src, label: '요청' });
    if (items.length >= 2) break;
  }

  for (const src of portfolioImageUrls) {
    if (!isRenderableImageSrc(src) || seen.has(src)) continue;
    seen.add(src);
    items.push({ src, label: '이전' });
    if (items.length >= 3) break;
  }

  return items;
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
  const getById = useCustomerStore((s) => s.getById);
  const getByCustomerId = usePortfolioStore((s) => s.getByCustomerId);
  const setEntryPoint = useConsultationStore((s) => s.setEntryPoint);
  const allRecords = useRecordsStore((s) => s.getAllRecords());

  const [alertBooking, setAlertBooking] = useState<BookingRequest | null>(null);
  const [alertTags, setAlertTags] = useState<CustomerTag[]>([]);
  const [linkGenBooking, setLinkGenBooking] = useState<BookingRequest | null>(null);
  const [previewBooking, setPreviewBooking] = useState<BookingRequest | null>(null);
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null);

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
          <span className="text-sm font-bold text-text">{sectionTitle}</span>
          {reservations.length > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-primary px-1.5 text-[10px] font-bold text-white">
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
            const isCompleted = booking.status === 'completed';
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

            const matchedRecord = allRecords.find((r) => r.consultation?.bookingId === booking.id);
            const stage = getBookingStage(booking, matchedRecord);

            const handleCardClick = (): void => {
              if (stage === 'completed') return;
              if (booking.customerId) {
                setExpandedBookingId((prev) => (prev === booking.id ? null : booking.id));
              } else if (stage === 'just_registered') {
                setLinkGenBooking(booking);
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
                      <span className="text-xs font-bold text-text" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {booking.reservationTime}
                      </span>
                      <div className="mt-1 h-1 w-1 rounded-full bg-primary/40" />
                    </div>
                    {/* 세로 구분선 */}
                    <div className="h-10 w-px shrink-0 bg-border" />
                    {/* 고객 정보 */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-text truncate">
                          {booking.customerName}
                        </span>
                        {/* H-4: 국기 아이콘 */}
                        {isForeign && (
                          <FlagIcon language={booking.language!} size="sm" />
                        )}
                        {booking.serviceLabel && (
                          <span className="max-w-[100px] truncate px-2 py-0.5 rounded-full bg-primary/10 text-[11px] text-primary font-semibold">
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
                          <div
                            key={`${item.label}-${thumbIdx}-${item.src}`}
                            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-alt"
                          >
                            <Image
                              src={item.src}
                              alt=""
                              width={48}
                              height={48}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                            <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 py-0.5 text-[8px] font-semibold leading-none text-white">
                              {item.label}
                            </span>
                          </div>
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
                    ) : !booking.customerId ? (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt border border-border">
                        <span className="text-[8px] font-bold text-text-muted">신규</span>
                      </div>
                    ) : null}
                    <div className="ml-auto flex shrink-0 items-center gap-1.5">
                      {booking.customerId && stage !== 'completed' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); router.push(`/customers/${booking.customerId}`); }}
                          className="rounded-lg bg-surface-alt border border-border px-2.5 py-2.5 text-[11px] font-semibold text-text-secondary hover:bg-border active:scale-95 transition-all"
                        >
                          고객 정보
                        </button>
                      )}
                      {stage === 'completed' ? (
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
                          상담 완료
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
                          className="rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white active:scale-95 transition-transform"
                        >
                          상담 시작
                        </button>
                      ) : stage === 'pre_consult_done' ? (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewBooking(booking); }}
                            className="rounded-lg bg-emerald-100 px-2.5 py-2.5 text-[11px] font-semibold text-emerald-700 cursor-pointer hover:bg-emerald-200"
                          >
                            사전상담 완료
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleStartClick(booking); }}
                            className="rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white active:scale-95 transition-transform"
                          >
                            상담 시작
                          </button>
                        </>
                      ) : stage === 'in_treatment' ? (
                        <span className="rounded-lg bg-blue-100 px-2.5 py-2.5 text-[11px] font-semibold text-blue-700">
                          결제 대기
                        </span>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartClick(booking); }}
                          className="rounded-lg bg-primary px-3 py-2.5 text-xs font-semibold text-white active:scale-95 transition-transform"
                        >
                          상담 시작
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* 인라인 고객 미리보기 아코디언 (기존 고객 전용) */}
                <AnimatePresence>
                  {expandedBookingId === booking.id && booking.customerId && (() => {
                    const customer = getById(booking.customerId);
                    if (!customer) return null;
                    const recentTreatment = customer.treatmentHistory?.[0];
                    const latestMemo = customer.smallTalkNotes?.slice(-1)[0];
                    return (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-3 pt-1 ml-14 border-t border-border/50">
                          {/* 세이프티 태그 */}
                          {pinnedTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {pinnedTags.map((tag) => (
                                <SafetyTag key={tag.id} tag={tag} size="xs" />
                              ))}
                            </div>
                          )}
                          {/* 최근 시술 */}
                          {recentTreatment && (
                            <div className="flex items-center gap-2 text-xs text-text-secondary mb-1.5">
                              <span className="font-medium">{formatDateDot(recentTreatment.date)}</span>
                              <span>{recentTreatment.designScope}</span>
                              <span className="font-semibold text-text">{formatPrice(recentTreatment.price)}원</span>
                            </div>
                          )}
                          {/* 최근 스몰토크 메모 */}
                          {latestMemo && (
                            <p className="text-xs text-text-muted line-clamp-1 mb-2">💬 {latestMemo.noteText}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
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
                <h3 className="text-base font-bold text-text">사전 상담 내용</h3>
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
