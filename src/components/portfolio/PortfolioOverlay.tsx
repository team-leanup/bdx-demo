'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useShopStore } from '@/store/shop-store';
import { formatPrice, formatDateDot } from '@/lib/format';
import { cn } from '@/lib/cn';
import { downloadForInstagram } from '@/lib/image-utils';
import { InstagramHashtags } from './InstagramHashtags';
import { ShareCardGeneratorModal } from '@/components/share-card/ShareCardGeneratorModal';
import type { PortfolioPhoto } from '@/types/portfolio';
import type { Customer } from '@/types/customer';
import type { ConsultationRecord } from '@/types/consultation';

interface PortfolioOverlayProps {
  photoIds: string[];
  initialPhotoId: string;
  photos: PortfolioPhoto[];
  customerMap: Map<string, Customer>;
  recordMap: Map<string, ConsultationRecord>;
  onClose: () => void;
}

const DESIGN_SCOPE_LABEL: Record<string, string> = {
  solid_tone: '원컬러',
  solid_point: '단색+포인트',
  full_art: '풀아트',
  monthly_art: '이달의 아트',
};

const NAIL_FALLBACKS = [
  '/images/mock/nail/nail-1.jpg', '/images/mock/nail/nail-2.jpg',
  '/images/mock/nail/nail-3.jpg', '/images/mock/nail/nail-4.jpg',
  '/images/mock/nail/nail-5.jpg', '/images/mock/nail/nail-6.jpg',
  '/images/mock/nail/nail-7.jpg', '/images/mock/nail/nail-8.jpg',
];

export function PortfolioOverlay({
  photoIds,
  initialPhotoId,
  photos,
  customerMap,
  recordMap,
  onClose,
}: PortfolioOverlayProps): React.ReactElement {
  const router = useRouter();
  const toggleMenu = usePortfolioStore((s) => s.toggleMenu);
  const updatePhoto = usePortfolioStore((s) => s.updatePhoto);
  const shopName = useShopStore((s) => s.shop?.name) ?? '네일샵';
  const [currentId, setCurrentId] = useState(initialPhotoId);
  const [downloading, setDownloading] = useState(false);
  const [showHashtags, setShowHashtags] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const [editingPartsMemo, setEditingPartsMemo] = useState(false);
  const [partsMemoInput, setPartsMemoInput] = useState('');

  const currentIndex = photoIds.indexOf(currentId);
  const photo = photos.find((p) => p.id === currentId);
  const customer = photo ? customerMap.get(photo.customerId) : undefined;
  const linkedRecord = photo?.recordId ? recordMap.get(photo.recordId) : undefined;
  const serviceType = photo?.serviceType
    ?? (linkedRecord ? DESIGN_SCOPE_LABEL[linkedRecord.consultation.designScope] ?? linkedRecord.consultation.designScope : undefined);
  const effectivePrice = photo?.price ?? linkedRecord?.finalPrice;
  const effectiveDate = photo ? (photo.takenAt ?? photo.createdAt) : undefined;
  const imgSrc = photo?.imageDataUrl || NAIL_FALLBACKS[currentIndex % NAIL_FALLBACKS.length];

  const goPrev = useCallback(() => {
    if (currentIndex > 0) setCurrentId(photoIds[currentIndex - 1]);
  }, [currentIndex, photoIds]);

  const goNext = useCallback(() => {
    if (currentIndex < photoIds.length - 1) setCurrentId(photoIds[currentIndex + 1]);
  }, [currentIndex, photoIds]);

  const handleDownload = async (ratio: '4:5' | '9:16'): Promise<void> => {
    if (!photo?.imageDataUrl) return;
    setDownloading(true);
    try { await downloadForInstagram(photo.imageDataUrl, ratio); } catch { /* */ } finally { setDownloading(false); }
  };

  if (!photo) return <></>;

  return (
    <AnimatePresence>
      <motion.div
        key="overlay-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80"
        onClick={onClose}
      >
        <motion.div
          key={`overlay-${currentId}`}
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-sm sm:mx-4 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl bg-surface max-h-[90dvh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 사진 */}
          <div className="relative aspect-[4/3] w-full bg-black shrink-0">
            <Image src={imgSrc} alt={customer?.name ?? ''} fill unoptimized className="object-cover" />

            {/* 닫기 */}
            <button onClick={onClose} aria-label="닫기" className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* 좌우 네비 */}
            {currentIndex > 0 && (
              <button onClick={goPrev} aria-label="이전" className="absolute left-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            {currentIndex < photoIds.length - 1 && (
              <button onClick={goNext} aria-label="다음" className="absolute right-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            )}

            {/* 뱃지 */}
            <div className="absolute top-3 left-3 flex gap-1">
              {photo.isFeatured && <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold text-white shadow">메뉴</span>}
              {photo.isStaffPick && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow">추천</span>}
              {photo.isPopular && <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">인기</span>}
            </div>

            {/* 가격 */}
            {effectivePrice != null && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent pt-8 pb-3 px-4">
                <span className="text-xl font-bold text-white">{formatPrice(effectivePrice)}</span>
              </div>
            )}
          </div>

          {/* 스크롤 가능 영역 */}
          <div className="flex-1 overflow-y-auto">
            {/* 정보 */}
            <div className="px-4 pt-3 pb-2">
              <p className="text-base font-bold text-text truncate">{photo.designType ?? customer?.name ?? '미지정'}</p>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-text-secondary">
                {customer?.name && <span>{customer.name}</span>}
                {serviceType && <span className="text-primary font-medium">{serviceType}</span>}
                {effectiveDate && <span>{formatDateDot(effectiveDate)}</span>}
              </div>
              {photo.colorLabels && photo.colorLabels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {photo.colorLabels.map((c, i) => (
                    <span key={i} className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-medium text-text-secondary">{c}</span>
                  ))}
                </div>
              )}
              {/* 파츠 메모 */}
              <div className="mt-2">
                {editingPartsMemo ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={partsMemoInput}
                      onChange={(e) => setPartsMemoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          updatePhoto(photo.id, { partsMemo: partsMemoInput.trim() || undefined });
                          setEditingPartsMemo(false);
                        }
                        if (e.key === 'Escape') setEditingPartsMemo(false);
                      }}
                      placeholder="파츠·컬러 메모 입력"
                      className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
                    />
                    <button
                      onClick={() => { updatePhoto(photo.id, { partsMemo: partsMemoInput.trim() || undefined }); setEditingPartsMemo(false); }}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setEditingPartsMemo(false)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setPartsMemoInput(photo.partsMemo ?? ''); setEditingPartsMemo(true); }}
                    className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-primary transition-colors"
                  >
                    <svg className="w-3 h-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    {photo.partsMemo ? (
                      <span className="text-text">{photo.partsMemo}</span>
                    ) : (
                      <span className="text-text-muted">파츠·컬러 메모 추가</span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* 해시태그 */}
            <div className="border-t border-border">
              <button
                onClick={() => setShowHashtags((v) => !v)}
                className="w-full px-4 py-2 flex items-center justify-between text-xs text-text-secondary"
              >
                <span className="font-medium">#해시태그 {showHashtags ? '접기' : '보기'}</span>
                <svg className={cn('w-3.5 h-3.5 transition-transform', showHashtags && 'rotate-180')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showHashtags && (
                <div className="px-4 pb-3">
                  <InstagramHashtags
                    tags={photo.tags}
                    colorLabels={photo.colorLabels}
                    serviceType={serviceType}
                    designType={photo.designType}
                    price={effectivePrice}
                  />
                </div>
              )}
            </div>

            {/* 공유카드 / 저장 */}
            <div className="border-t border-border px-4 py-3">
              <button
                onClick={() => setShowShareCard(true)}
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white"
              >
                공유카드 만들기
              </button>
            </div>

            {/* 이 디자인으로 상담 시작 */}
            <div className="border-t border-border px-4 py-3">
              <button
                onClick={() => { router.push(`/field-mode?portfolioId=${photo.id}`); onClose(); }}
                className="w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white"
              >
                이 디자인으로 상담
              </button>
            </div>

            {/* 액션 */}
            <div className="border-t border-border px-4 py-3 flex gap-2">
              <button
                onClick={() => toggleMenu(photo.id, photo.price)}
                className={cn('rounded-xl px-4 py-2.5 text-xs font-medium transition-colors',
                  photo.isFeatured ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'border border-border text-text-secondary',
                )}
              >
                {photo.isFeatured ? '메뉴 해제' : '메뉴 등록'}
              </button>
              {photo.recordId && (
                <button
                  onClick={() => { router.push(`/records/${photo.recordId}`); onClose(); }}
                  className="flex-1 rounded-xl border border-border py-2.5 text-xs font-medium text-text-secondary"
                >
                  기록 상세
                </button>
              )}
            </div>
          </div>

          {/* 인디케이터 */}
          {photoIds.length > 1 && (
            <div className="flex justify-center gap-1 py-2 shrink-0 border-t border-border">
              {photoIds.map((pid) => (
                <button
                  key={pid}
                  onClick={() => setCurrentId(pid)}
                  className={cn('h-1.5 rounded-full transition-all', pid === currentId ? 'w-4 bg-primary' : 'w-1.5 bg-border')}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* 공유카드 모달 */}
      {showShareCard && (
        <ShareCardGeneratorModal
          isOpen={showShareCard}
          onClose={() => setShowShareCard(false)}
          record={{
            id: linkedRecord?.id ?? photo.id,
            shopId: photo.shopId,
            consultation: linkedRecord?.consultation ? {
              ...linkedRecord.consultation,
              designScope: (photo.designType ?? linkedRecord.consultation.designScope) as import('@/types/consultation').ConsultationType['designScope'],
            } : {
              customerName: customer?.name ?? '고객',
              bodyPart: 'hand',
              nailShape: 'round',
              designScope: photo.designType ?? photo.serviceType ?? 'full_art',
              expressions: [],
              hasParts: false,
              partsSelections: [],
              extraColorCount: 0,
              offType: 'none',
              extensionType: 'none',
              currentStep: 0,
            } as unknown as import('@/types/consultation').ConsultationType,
            shareCardId: linkedRecord?.shareCardId,
            createdAt: linkedRecord?.createdAt ?? photo.createdAt,
            estimatedMinutes: linkedRecord?.estimatedMinutes,
          }}
          portfolioPhotos={[{ id: photo.id, imageDataUrl: photo.imageDataUrl }]}
          shopName={shopName}
        />
      )}
    </AnimatePresence>
  );
}
