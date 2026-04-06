'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { uploadPreConsultImage, fetchBookingRequestById } from '@/lib/db';
import { Button } from '@/components/ui/Button';

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

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

  // 예약 시 첨부한 참고 이미지 자동 채우기
  useEffect(() => {
    if (!bookingId || referenceImageUrls.length > 0) return;
    fetchBookingRequestById(bookingId, shopId).then((booking) => {
      if (booking?.referenceImageUrls) {
        for (const url of booking.referenceImageUrls) {
          addReferenceImageUrl(url);
        }
      }
    });
  }, [bookingId, shopId, referenceImageUrls.length, addReferenceImageUrl]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setErrorMsg(null);

    const remaining = MAX_FILES - referenceImageUrls.length;
    const toUpload = files.slice(0, remaining);

    for (const file of toUpload) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setErrorMsg('JPEG, PNG, WEBP 형식만 업로드할 수 있어요.');
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg('5MB 이하의 파일만 업로드할 수 있어요.');
        continue;
      }

      if (!shopId) continue;

      setUploading(true);
      const result = await uploadPreConsultImage(shopId, file);
      setUploading(false);

      if (result.success && result.url) {
        addReferenceImageUrl(result.url);
      } else {
        setErrorMsg(result.error ?? '업로드 중 오류가 발생했어요.');
      }
    }

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
          원하는 디자인 사진이 있다면 여기에 올려주세요
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
          <span className="text-xs">JPEG · PNG · WEBP · 5MB 이하</span>
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
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
                  onClick={() => removeReferenceImageUrl(url)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center text-white text-xs leading-none hover:bg-black/80 transition-colors"
                  aria-label="삭제"
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
    </div>
  );
}
