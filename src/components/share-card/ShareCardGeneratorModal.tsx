'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/store/app-store';
import { useShopStore } from '@/store/shop-store';
import { ShareCardImageTemplate, ShareCardScaledPreview } from '@/components/share-card/ShareCardImageTemplate';
import type { CardRatio } from '@/components/share-card/ShareCardImageTemplate';
import type { ConsultationType } from '@/types/consultation';
import { dbCreateShareCard, getShopLogoPublicUrl } from '@/lib/db';

interface ShareCardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    id: string;
    shopId: string;
    consultation: ConsultationType;
    shareCardId?: string;
    createdAt?: string;
    estimatedMinutes?: number;
  };
  portfolioPhotos: Array<{
    id: string;
    imageDataUrl?: string | null;
    imagePath?: string | null;
  }>;
  shopName: string;
  onShareCardCreated?: (shareCardId: string) => void;
  /** 실제 시술 카테고리/메뉴 한국어 라벨 — 제공 시 공유카드 타이틀에 표시 */
  categoryLabel?: string;
}

export function ShareCardGeneratorModal({
  isOpen,
  onClose,
  record,
  portfolioPhotos,
  shopName,
  onShareCardCreated,
  categoryLabel,
}: ShareCardGeneratorModalProps): React.ReactElement | null {
  const t = useT();
  const kakaoTalkUrl = useAppStore((s) => s.shopSettings.kakaoTalkUrl);
  const naverReservationUrl = useAppStore((s) => s.shopSettings.naverReservationUrl);
  const storeLogoUrl = useShopStore((s) => s.shop?.logoUrl);
  const shopLogoUrl = storeLogoUrl ? getShopLogoPublicUrl(storeLogoUrl) : undefined;

  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(
    portfolioPhotos[0]?.id ?? null,
  );
  const [downloading, setDownloading] = useState<CardRatio | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [resolvedShareCardId, setResolvedShareCardId] = useState<string | undefined>(record.shareCardId);
  const [shareCardError, setShareCardError] = useState<string | null>(null);
  const shareCardCreating = useRef(false);

  const captureRef916 = useRef<HTMLDivElement | null>(null);
  const captureRef34 = useRef<HTMLDivElement | null>(null);

  // Update selection when photos change
  useEffect(() => {
    if (portfolioPhotos.length > 0 && !portfolioPhotos.find((p) => p.id === selectedPhotoId)) {
      setSelectedPhotoId(portfolioPhotos[0].id);
    }
  }, [portfolioPhotos, selectedPhotoId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (resolvedShareCardId) return;
    if (shareCardCreating.current) return;
    shareCardCreating.current = true;
    setShareCardError(null);
    const newId = crypto.randomUUID();
    dbCreateShareCard(record.id, newId, record.shopId)
      .then((result) => {
        if (result.success) {
          setResolvedShareCardId(newId);
          onShareCardCreated?.(newId);
        } else {
          setShareCardError(result.error ?? '공유카드 생성 실패');
        }
      })
      .catch(() => {
        setShareCardError('공유카드 생성 중 오류가 발생했습니다.');
      })
      .finally(() => {
        shareCardCreating.current = false;
      });
  }, [isOpen, resolvedShareCardId, record.id, record.shopId, onShareCardCreated]);

  const selectedPhoto = portfolioPhotos.find((p) => p.id === selectedPhotoId);
  const resolvedImageUrl = selectedPhoto?.imageDataUrl || selectedPhoto?.imagePath || null;

  // Share card URL
  const shareUrl = resolvedShareCardId
    ? `https://beauty-decision.com/share/${resolvedShareCardId}`
    : null;

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async (ratio: CardRatio) => {
    const ref = ratio === '9:16' ? captureRef916 : captureRef34;
    if (!ref.current || !resolvedImageUrl) return;
    setDownloading(ratio);
    setDownloadError(null);
    try {
      await new Promise((r) => setTimeout(r, 200));
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FAF8F5',
        logging: false,
      });
      const url = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      const shopSlug = shopName.replace(/\s+/g, '_').toLowerCase();
      link.download = `bdx_${shopSlug}_${ratio.replace(':', 'x')}.jpg`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error('[share-card] download failed:', err);
      setDownloadError('이미지 저장에 실패했어요. 다시 시도해주세요.');
    } finally {
      setDownloading(null);
    }
  }, [resolvedImageUrl, shopName]);

  // ── Copy URL ──────────────────────────────────────────────────────────────
  const handleCopyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  }, []);

  // ── Copy Share Link ───────────────────────────────────────────────────────
  const handleCopyShareLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2500);
  }, [shareUrl]);

  const hasBookingUrls = !!(kakaoTalkUrl || naverReservationUrl);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm sm:mx-4 rounded-t-3xl sm:rounded-3xl bg-background shadow-2xl max-h-[92dvh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-card-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
              <h2 id="share-card-modal-title" className="text-base font-bold text-text">{t('shareCard.createCard')}</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-alt hover:bg-border transition-colors"
                aria-label={t('common.close')}
              >
                <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4 flex flex-col gap-4">

              {/* ── Photo selector — 0424: 사진 2장 이상일 때만 노출 (1장은 선택의 여지 없음) ── */}
              {portfolioPhotos.length === 0 && (
                <div className="rounded-2xl bg-surface-alt border border-border py-8 flex items-center justify-center">
                  <p className="text-xs text-text-muted">시술 사진이 없어요</p>
                </div>
              )}
              {portfolioPhotos.length >= 2 && (
                <div>
                  <p className="text-[11px] font-medium text-text-muted mb-1.5">사진 선택</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {portfolioPhotos.map((photo, index) => {
                      const imgSrc = photo.imageDataUrl || photo.imagePath;
                      if (!imgSrc) return null;
                      const isSelected = photo.id === selectedPhotoId;
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setSelectedPhotoId(photo.id)}
                          className={[
                            'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                            isSelected ? 'border-primary shadow-md' : 'border-transparent opacity-55 hover:opacity-100',
                          ].join(' ')}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgSrc} alt={`사진 ${index + 1}`} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Preview (ShareCardScaledPreview — 미리보기·다운로드·공개링크 동일 템플릿) ── */}
              {resolvedImageUrl && (
                <ShareCardScaledPreview
                  imageUrl={resolvedImageUrl}
                  designScope={record.consultation.designScope}
                  designCategory={record.consultation.designCategory}
                  bodyPart={record.consultation.bodyPart}
                  nailShape={record.consultation.nailShape}
                  categoryLabelKo={categoryLabel}
                  shopName={shopName}
                  ratio="9:16"
                  shopId={record.shopId}
                  createdAt={record.createdAt}
                  estimatedMinutes={record.estimatedMinutes}
                  shopLogoUrl={shopLogoUrl}
                  feedbackLabel={t('shareCard.feedbackDefault')}
                  consultBuiltLine={t('shareCard.consultBuiltLine')}
                  reserveCtaLabel={t('shareCard.reserveCta')}
                />
              )}
            </div>

            {/* ── Action buttons ── */}
            <div className="flex-shrink-0 flex flex-col gap-2 px-5 pb-safe pt-3 border-t border-border">
              {shareCardError && (
                <p className="text-xs text-error text-center py-1">{shareCardError}</p>
              )}
              {downloadError && (
                <p className="text-xs text-amber-600 text-center py-1">{downloadError}</p>
              )}
              {/* 이미지 다운로드 + 링크 복사 */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { void handleDownload('9:16'); }}
                  disabled={downloading !== null || !resolvedImageUrl}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#191F28] text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {downloading === '9:16' ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  )}
                  9:16 스토리
                </button>
                <button
                  type="button"
                  onClick={() => { void handleDownload('3:4'); }}
                  disabled={downloading !== null || !resolvedImageUrl}
                  className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#191F28] text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-40"
                >
                  {downloading === '3:4' ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  )}
                  3:4 포스트
                </button>
              </div>

              {/* 공유 링크 복사 */}
              {shareUrl && (
                <button
                  type="button"
                  onClick={() => { void handleCopyShareLink(); }}
                  className={[
                    'flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]',
                    shareLinkCopied
                      ? 'bg-primary text-white'
                      : 'bg-primary/10 text-primary border border-primary/20',
                  ].join(' ')}
                >
                  {shareLinkCopied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      {t('shareCard.shareLinkCopied')}
                    </>
                  ) : (
                    <>
                      {/* 0424: 깨진 path 교체 — Heroicons 정규 link 아이콘 */}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                      </svg>
                      {t('shareCard.shareLinkCopy')}
                    </>
                  )}
                </button>
              )}

              {/* 예약 URL 복사 (설정에서 입력한 네이버/카카오) */}
              {hasBookingUrls && (
                <div className="flex gap-2">
                  {kakaoTalkUrl && (
                    <button
                      type="button"
                      onClick={() => { void handleCopyUrl(kakaoTalkUrl); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-sm font-semibold transition-all active:scale-[0.98]"
                      style={{
                        background: copiedUrl === kakaoTalkUrl ? '#FEE500' : undefined,
                        color: copiedUrl === kakaoTalkUrl ? '#191F28' : 'var(--color-text-secondary)',
                      }}
                    >
                      {copiedUrl === kakaoTalkUrl ? '✓ 복사됨' : '카카오톡 복사'}
                    </button>
                  )}
                  {naverReservationUrl && (
                    <button
                      type="button"
                      onClick={() => { void handleCopyUrl(naverReservationUrl); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-sm font-semibold transition-all active:scale-[0.98]"
                      style={{
                        background: copiedUrl === naverReservationUrl ? '#03C75A' : undefined,
                        color: copiedUrl === naverReservationUrl ? '#FFFFFF' : 'var(--color-text-secondary)',
                      }}
                    >
                      {copiedUrl === naverReservationUrl ? '✓ 복사됨' : '네이버 예약 복사'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Hidden capture targets (off-screen, 동일 템플릿 사용) ── */}
          {resolvedImageUrl && (
            <div style={{ position: 'fixed', left: -9999, top: -9999, zIndex: -1, pointerEvents: 'none' }}>
              <ShareCardImageTemplate
                imageUrl={resolvedImageUrl}
                designScope={record.consultation.designScope}
                designCategory={record.consultation.designCategory}
                bodyPart={record.consultation.bodyPart}
                nailShape={record.consultation.nailShape}
                categoryLabelKo={categoryLabel}
                shopName={shopName}
                ratio="9:16"
                templateRef={captureRef916}
                shopId={record.shopId}
                createdAt={record.createdAt}
                estimatedMinutes={record.estimatedMinutes}
                shopLogoUrl={shopLogoUrl}
                feedbackLabel={t('shareCard.feedbackDefault')}
                consultBuiltLine={t('shareCard.consultBuiltLine')}
                reserveCtaLabel={t('shareCard.reserveCta')}
              />
              <ShareCardImageTemplate
                imageUrl={resolvedImageUrl}
                designScope={record.consultation.designScope}
                designCategory={record.consultation.designCategory}
                bodyPart={record.consultation.bodyPart}
                nailShape={record.consultation.nailShape}
                categoryLabelKo={categoryLabel}
                shopName={shopName}
                ratio="3:4"
                templateRef={captureRef34}
                shopId={record.shopId}
                createdAt={record.createdAt}
                estimatedMinutes={record.estimatedMinutes}
                shopLogoUrl={shopLogoUrl}
                feedbackLabel={t('shareCard.feedbackDefault')}
                consultBuiltLine={t('shareCard.consultBuiltLine')}
                reserveCtaLabel={t('shareCard.reserveCta')}
              />
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
