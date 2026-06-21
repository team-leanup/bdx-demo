'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { uploadPreConsultImage, fetchBookingRequestById } from '@/lib/db';
import { Button } from '@/components/ui/Button';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB — 서버(uploadPreConsultImage)와 통일
// 서버가 허용하는 MIME과 동일하게 유지. 아이폰 사진(HEIC/HEIF)·GIF 포함.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'];

interface ReferenceUploadProps {
  onComplete: () => void;
}

export function ReferenceUpload({ onComplete }: ReferenceUploadProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const shopId = usePreConsultStore((s) => s.shopId);
  const bookingId = usePreConsultStore((s) => s.bookingId);
  const referenceImageUrls = usePreConsultStore((s) => s.referenceImageUrls);
  const addReferenceImageUrl = usePreConsultStore((s) => s.addReferenceImageUrl);
  const removeReferenceImageUrl = usePreConsultStore((s) => s.removeReferenceImageUrl);

  const [uploading, setUploading] = useState(false);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);

  // 예약 시 첨부한 참고 이미지 자동 채우기 (1회)
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !bookingId) return;
    prefilled.current = true;
    fetchBookingRequestById(bookingId, shopId).then((booking) => {
      if (booking?.referenceImageUrls) {
        const store = usePreConsultStore.getState();
        if (store.referenceImageUrls.length > 0) return;
        for (const url of booking.referenceImageUrls) {
          usePreConsultStore.getState().addReferenceImageUrl(url);
        }
      }
    });
  }, [bookingId, shopId]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setErrorMsg(null);

    const remaining = MAX_FILES - referenceImageUrls.length;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    for (const file of toUpload) {
      // file.type이 비어있는 경우(iOS Safari 등 일부 환경)는 막지 않고 서버 검증에 맡긴다.
      if (file.type && !ALLOWED_TYPES.includes(file.type)) {
        setErrorMsg(t('preConsult.uploadErrorType'));
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg(t('preConsult.uploadErrorSize'));
        continue;
      }

      if (!shopId) continue;

      const result = await uploadPreConsultImage(shopId, file);

      if (result.success && result.url) {
        addReferenceImageUrl(result.url);
      } else {
        setErrorMsg(result.error ?? t('preConsult.uploadError'));
      }
    }
    setUploading(false);

    // Reset input so same file can be re-selected
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const canUploadMore = referenceImageUrls.length < MAX_FILES;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-bold text-text">
          {t('preConsult.uploadTitle')}
        </h3>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-0.5">
            {tKo('preConsult.uploadTitle')}
          </p>
        )}
        <p className="text-sm text-text-muted mt-1">{t('preConsult.uploadHint')}</p>
        <p className="text-xs text-text-muted mt-1 opacity-70">
          {t('preConsult.uploadSubHint')}
        </p>
      </div>

      {/* Upload area */}
      {canUploadMore && (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-2 text-text-muted hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 disabled:opacity-50"
        >
          <span className="text-3xl">📎</span>
          <span className="text-sm font-medium">{t('preConsult.uploadBtn')}</span>
          <span className="text-xs">{t('preConsult.uploadFormats')}</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Error */}
      {errorMsg && (
        <p className="text-sm text-error">{errorMsg}</p>
      )}

      {/* Preview thumbnails */}
      <AnimatePresence>
        {referenceImageUrls.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2"
          >
            {referenceImageUrls.map((url) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative w-20 h-20 rounded-xl overflow-hidden border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="reference"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setZoomSrc(url)}
                  className="absolute top-1 left-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  aria-label={t('preConsult.zoomImage')}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => removeReferenceImageUrl(url)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white text-xs leading-none hover:bg-black/80 transition-colors"
                  aria-label={t('preConsult.removeImage')}
                >
                  ×
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        {referenceImageUrls.length > 0 && (
          <Button fullWidth onClick={onComplete} loading={uploading}>
            {t('preConsult.next')}
          </Button>
        )}
        <Button variant="ghost" fullWidth onClick={onComplete}>
          {t('preConsult.skip')}
        </Button>
      </div>

      {/* 이미지 확대 오버레이 */}
      <AnimatePresence>
        {zoomSrc && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80" onClick={() => setZoomSrc(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="fixed inset-4 z-50 flex items-center justify-center" onClick={() => setZoomSrc(null)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={zoomSrc} alt="" className="max-h-[80dvh] w-auto rounded-2xl object-contain" />
              <button onClick={() => setZoomSrc(null)} className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
