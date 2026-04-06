'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas-pro';
import { useT } from '@/lib/i18n';
import { dbCreateShareCard } from '@/lib/db';
import { DESIGN_SCOPE_LABEL } from '@/lib/labels';
import { ShareCardImageTemplate } from '@/components/share-card/ShareCardImageTemplate';
import type { ConsultationType } from '@/types/consultation';

interface ShareCardGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: {
    id: string;
    shopId: string;
    consultation: ConsultationType;
    shareCardId?: string;
  };
  portfolioPhotos: Array<{
    id: string;
    imageDataUrl?: string | null;
    imagePath?: string | null;
  }>;
  shopName: string;
}

const TEMPLATE_SIZE = 1080;

function generateShareCardId(): string {
  return crypto.randomUUID();
}

// Scales the 1080px template to fit a square container of measured width.
function ScaledPreview({
  imageUrl,
  shopName,
  designLabel,
  captureRef,
}: {
  imageUrl: string;
  shopName: string;
  designLabel?: string;
  captureRef: React.RefObject<HTMLDivElement | null>;
}): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setScale(entry.contentRect.width / TEMPLATE_SIZE);
      }
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full aspect-square relative overflow-hidden rounded-2xl border border-border bg-black"
    >
      {scale > 0 && (
        <div
          style={{
            width: TEMPLATE_SIZE,
            height: TEMPLATE_SIZE,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <ShareCardImageTemplate
            imageUrl={imageUrl}
            shopName={shopName}
            designLabel={designLabel}
            templateRef={{ current: null }}
          />
        </div>
      )}

      {/* Hidden off-screen capture target */}
      <div
        style={{
          position: 'fixed',
          left: -9999,
          top: -9999,
          zIndex: -1,
          pointerEvents: 'none',
        }}
      >
        <ShareCardImageTemplate
          imageUrl={imageUrl}
          shopName={shopName}
          designLabel={designLabel}
          templateRef={captureRef}
        />
      </div>
    </div>
  );
}

export function ShareCardGeneratorModal({
  isOpen,
  onClose,
  record,
  portfolioPhotos,
  shopName,
}: ShareCardGeneratorModalProps): React.ReactElement | null {
  const t = useT();

  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(
    portfolioPhotos[0]?.id ?? null,
  );
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareCardId, setShareCardId] = useState<string | undefined>(
    record.shareCardId,
  );
  const [creatingLink, setCreatingLink] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const captureRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const selectedPhoto = portfolioPhotos.find((p) => p.id === selectedPhotoId);
  const resolvedImageUrl =
    selectedPhoto?.imageDataUrl ?? selectedPhoto?.imagePath ?? null;

  const designLabel = record.consultation.designScope
    ? DESIGN_SCOPE_LABEL[record.consultation.designScope]
    : undefined;

  const shareUrl =
    typeof window !== 'undefined' && shareCardId
      ? `${window.location.origin}/share/${shareCardId}`
      : shareCardId
        ? `/share/${shareCardId}`
        : null;

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (!captureRef.current || !resolvedImageUrl) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 1,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `share-card-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  }, [resolvedImageUrl]);

  // ── Copy link ─────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const el = document.createElement('textarea');
        el.value = shareUrl;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.warn('[clipboard] fallback copy failed:', e);
      }
    }
  }, [shareUrl]);

  // ── Create share card ─────────────────────────────────────────────────────
  const handleCreateShareCard = useCallback(async () => {
    if (shareCardId) return;
    setCreateError(null);
    setCreatingLink(true);
    try {
      const newId = generateShareCardId();
      const result = await dbCreateShareCard(record.id, newId, record.shopId);
      if (result.success) {
        setShareCardId(newId);
      } else {
        setCreateError(result.error ?? '링크 생성에 실패했어요');
      }
    } finally {
      setCreatingLink(false);
    }
  }, [record.id, record.shopId, shareCardId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal sheet */}
          <motion.div
            initial={{ opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 48 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-sm sm:mx-4 rounded-t-3xl sm:rounded-3xl bg-background shadow-2xl max-h-[92dvh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border flex-shrink-0">
              <div>
                <h2 id="share-modal-title" className="text-base font-bold text-text">
                  {t('shareCard.createCard')}
                </h2>
                <p className="text-xs text-text-muted mt-0.5">{shopName}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-alt hover:bg-border transition-colors"
                aria-label={t('common.close')}
              >
                <svg
                  className="w-4 h-4 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-4 flex flex-col gap-5">
              {/* ── Photo selector ── */}
              <div>
                <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                  {t('shareCard.selectPhoto')}
                </p>
                {portfolioPhotos.length === 0 ? (
                  <div className="rounded-2xl bg-surface-alt border border-border py-6 flex items-center justify-center">
                    <p className="text-xs text-text-muted">
                      등록된 포트폴리오 사진이 없어요
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {portfolioPhotos.map((photo, index) => {
                      const imgSrc = photo.imageDataUrl ?? photo.imagePath;
                      if (!imgSrc) return null;
                      const isSelected = photo.id === selectedPhotoId;
                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setSelectedPhotoId(photo.id)}
                          aria-label={`포트폴리오 사진 ${index + 1}${isSelected ? ' (선택됨)' : ''}`}
                          className={[
                            'relative aspect-square rounded-xl overflow-hidden border-2 transition-all',
                            isSelected
                              ? 'border-primary shadow-md scale-[1.03]'
                              : 'border-border opacity-70 hover:opacity-100',
                          ].join(' ')}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgSrc}
                            alt={`포트폴리오 사진 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-white drop-shadow"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M4.5 12.75l6 6 9-13.5"
                                />
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Preview ── */}
              {resolvedImageUrl && (
                <div>
                  <p className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wide">
                    {t('shareCard.preview')}
                  </p>
                  <ScaledPreview
                    imageUrl={resolvedImageUrl}
                    shopName={shopName}
                    designLabel={designLabel}
                    captureRef={captureRef}
                  />
                </div>
              )}

              {/* ── Share link ── */}
              <div>
                {shareCardId && shareUrl ? (
                  <div className="rounded-2xl bg-surface border border-border px-4 py-3 flex items-center gap-2">
                    <svg
                      className="w-3.5 h-3.5 text-primary flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                      />
                    </svg>
                    <span className="text-xs text-text-secondary truncate flex-1">
                      {shareUrl}
                    </span>
                  </div>
                ) : (
                  <>
                  <button
                    type="button"
                    onClick={handleCreateShareCard}
                    disabled={creatingLink}
                    className="w-full py-3 rounded-2xl border border-border text-sm font-semibold text-text-secondary bg-surface hover:bg-surface-alt transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {creatingLink ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-text-muted border-t-transparent animate-spin" />
                        {t('shareCard.generating')}
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
                          />
                        </svg>
                        {t('shareCard.createCard')}
                      </>
                    )}
                  </button>
                  {createError && (
                    <p className="text-xs text-error mt-1">{createError}</p>
                  )}
                  </>
                )}
              </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex-shrink-0 flex flex-col gap-2.5 px-5 pb-safe pt-3 border-t border-border">
              {/* Image download */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading || !resolvedImageUrl}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {downloading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/50 border-t-transparent animate-spin" />
                    {t('shareCard.generating')}
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                      />
                    </svg>
                    {t('shareCard.imageDownload')}
                  </>
                )}
              </button>

              {/* Link copy — only shown when a share card ID exists */}
              {shareCardId && shareUrl && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border text-sm font-semibold transition-all active:scale-[0.98]"
                  style={{
                    background: copied
                      ? 'color-mix(in srgb, var(--color-success) 12%, var(--color-surface))'
                      : undefined,
                    color: copied
                      ? 'var(--color-success)'
                      : 'var(--color-text-secondary)',
                  }}
                >
                  {copied ? (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      {t('shareCard.linkCopied')}
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      {t('shareCard.linkCopy')}
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
