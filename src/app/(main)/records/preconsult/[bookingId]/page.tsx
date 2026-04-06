'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useReservationStore } from '@/store/reservation-store';
import { useConsultationStore } from '@/store/consultation-store';
import { useLocaleStore } from '@/store/locale-store';
import { ConsultationStep } from '@/types/consultation';
import { DESIGN_SCOPE_LABEL, EXPRESSION_LABEL } from '@/lib/labels';
import { toKoreanDateString, toKoreanTimeString } from '@/lib/format';

// ───────── 레이블 매핑 ─────────
const BODY_PART_LABEL: Record<string, string> = { hand: '핸드', foot: '풋' };
const OFF_TYPE_LABEL: Record<string, string> = {
  none: '없음',
  same_shop: '당샵 오프',
  other_shop: '타샵 오프',
};
const EXTENSION_LABEL: Record<string, string> = {
  none: '없음',
  repair: '리페어',
  extension: '연장',
};
const SHAPE_LABEL: Record<string, string> = {
  round: '라운드',
  oval: '오벌',
  square: '스퀘어',
  squoval: '스퀘오벌',
  almond: '아몬드',
  stiletto: '스틸레토',
  coffin: '코핀',
};
const CHANNEL_LABEL: Record<string, string> = {
  kakao: '카카오',
  naver: '네이버',
  phone: '전화',
  walk_in: '워크인',
  pre_consult: '사전상담',
};

// ───────── 서브 컴포넌트 ─────────

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-medium text-text">{value}</span>
    </div>
  );
}

interface SectionCardProps {
  icon: string;
  title: string;
  children: React.ReactNode;
}

function SectionCard({ icon, title, children }: SectionCardProps): React.ReactElement {
  return (
    <div className="rounded-2xl bg-surface border border-border p-4 space-y-1">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-bold text-text">{title}</h3>
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </div>
  );
}

// ───────── 메인 페이지 ─────────

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default function PreConsultDetailPage({ params }: Props): React.ReactElement {
  const { bookingId } = use(params);
  const router = useRouter();

  const reservations = useReservationStore((s) => s.reservations);
  const booking = reservations.find((r) => r.id === bookingId);

  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const setConsultationLocale = useLocaleStore((s) => s.setConsultationLocale);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // booking 없으면 records로 리다이렉트
  if (!booking) {
    router.replace('/records');
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-text-muted text-sm">예약을 찾을 수 없습니다</p>
      </div>
    );
  }

  const data = booking.preConsultationData;
  const images: string[] = data?.referenceImages ?? booking.referenceImageUrls ?? [];

  const handleStartConsultation = (): void => {
    if (booking.language && ['ko', 'en', 'zh', 'ja'].includes(booking.language)) {
      setConsultationLocale(booking.language as 'ko' | 'en' | 'zh' | 'ja');
    }
    hydrateConsultation({
      ...data,
      bookingId: booking.id,
      customerName: booking.customerName,
      customerPhone: booking.phone,
      customerId: booking.customerId ?? data?.customerId,
      referenceImages: images,
      entryPoint: 'staff',
      currentStep: ConsultationStep.START,
    });
    router.push('/field-mode');
  };

  const dateLabel = booking.reservationDate
    ? `${booking.reservationDate.replace(/-/g, '.')} ${booking.reservationTime}`
    : '';

  const channelLabel = CHANNEL_LABEL[booking.channel] ?? booking.channel;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── 헤더 ── */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-text-muted hover:bg-surface transition-colors"
            aria-label="뒤로가기"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-base font-bold text-text flex-1">사전 상담 내용</h1>
          {booking.preConsultationCompletedAt && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
              응답 완료
            </span>
          )}
        </div>
      </header>

      {/* ── 스크롤 콘텐츠 ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-28">

        {/* 고객 / 예약 기본 정보 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl bg-primary/5 border border-primary/15 p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xl font-black text-text truncate">{booking.customerName}</p>
              <p className="text-sm text-text-muted mt-0.5">
                {dateLabel}
                {dateLabel && channelLabel && <span className="mx-1.5 opacity-40">·</span>}
                {channelLabel}
              </p>
            </div>
            {booking.language && booking.language !== 'ko' && (
              <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {{ en: '영어', zh: '중국어', ja: '일본어' }[booking.language] ?? booking.language}
              </span>
            )}
          </div>
          {booking.phone && (
            <a
              href={`tel:${booking.phone}`}
              className="mt-3 flex items-center gap-2 text-sm font-medium text-primary"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
              </svg>
              {booking.phone}
            </a>
          )}
        </motion.div>

        {/* 참고 이미지 */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionCard icon="📷" title="참고 이미지">
              <div className="overflow-x-auto -mx-1 pt-1">
                <div className="flex gap-2.5 px-1 pb-1" style={{ width: 'max-content' }}>
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setLightboxUrl(url)}
                      className="relative shrink-0 w-36 h-36 rounded-xl overflow-hidden border border-border bg-surface shadow-sm hover:opacity-90 transition-opacity"
                    >
                      <Image
                        src={url}
                        alt={`참고 이미지 ${i + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* 디자인 선택 */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionCard icon="💅" title="디자인 선택">
              <InfoRow label="시술 부위" value={BODY_PART_LABEL[data.bodyPart] ?? data.bodyPart} />
              <InfoRow label="디자인 범위" value={DESIGN_SCOPE_LABEL[data.designScope] ?? data.designScope} />
              <InfoRow label="네일 쉐입" value={SHAPE_LABEL[data.nailShape] ?? data.nailShape} />
              {data.expressions.length > 0 && (
                <InfoRow
                  label="표현 기법"
                  value={data.expressions.map((e) => EXPRESSION_LABEL[e] ?? e).join(', ')}
                />
              )}
            </SectionCard>
          </motion.div>
        )}

        {/* 시술 조건 */}
        {data && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionCard icon="⚙️" title="시술 조건">
              <InfoRow label="오프" value={OFF_TYPE_LABEL[data.offType] ?? data.offType} />
              <InfoRow label="연장 / 리페어" value={EXTENSION_LABEL[data.extensionType] ?? data.extensionType} />
              {data.extensionType === 'repair' && data.repairCount != null && (
                <InfoRow label="리페어 개수" value={`${data.repairCount}개`} />
              )}
            </SectionCard>
          </motion.div>
        )}

        {/* 추가 옵션 (hasParts 또는 extraColorCount > 0 일 때만) */}
        {data && (data.hasParts || data.extraColorCount > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionCard icon="✨" title="추가 옵션">
              <InfoRow label="파츠" value={data.hasParts ? `${data.partsSelections.length}종` : '없음'} />
              <InfoRow label="추가 컬러" value={data.extraColorCount > 0 ? `${data.extraColorCount}개` : '없음'} />
            </SectionCard>
          </motion.div>
        )}

        {/* 무드 태그 */}
        {data?.moodTags && data.moodTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <SectionCard icon="🎨" title="무드 태그">
              <div className="flex flex-wrap gap-2 pt-1">
                {data.moodTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </SectionCard>
          </motion.div>
        )}

        {/* 요청 메모 */}
        {booking.requestNote && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="rounded-2xl bg-surface border border-border p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-base">📝</span>
                <h3 className="text-sm font-bold text-text">요청 메모</h3>
              </div>
              <p className="text-sm text-text leading-relaxed whitespace-pre-wrap bg-background rounded-xl p-3 border border-border/60">
                &ldquo;{booking.requestNote}&rdquo;
              </p>
            </div>
          </motion.div>
        )}

        {/* 사전상담 데이터 없는 경우 안내 */}
        {!data && images.length === 0 && !booking.requestNote && (
          <div className="rounded-2xl bg-surface border border-border p-8 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm font-medium text-text">아직 사전상담 내용이 없습니다</p>
            <p className="text-xs text-text-muted mt-1">고객이 링크를 통해 응답하면 여기에 표시됩니다</p>
          </div>
        )}
      </main>

      {/* ── 하단 CTA ── */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 pb-safe flex gap-2.5 z-20">
        {booking.customerId && (
          <button
            onClick={() => router.push(`/customers/${booking.customerId}`)}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-semibold text-text-secondary hover:bg-surface transition-colors"
          >
            고객 상세
          </button>
        )}
        <button
          onClick={handleStartConsultation}
          className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white active:scale-95 transition-transform"
        >
          상담 시작
        </button>
      </div>

      {/* ── 이미지 라이트박스 ── */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={() => setLightboxUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-w-[90vw] max-h-[85vh] rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lightboxUrl}
                alt="참고 이미지 확대"
                className="max-w-[90vw] max-h-[85vh] object-contain"
              />
            </motion.div>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm"
              aria-label="닫기"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
