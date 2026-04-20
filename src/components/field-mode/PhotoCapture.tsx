'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

// SVG/HTML 같은 XSS 벡터 차단용 화이트리스트
const ALLOWED_PHOTO_TYPES = new Set<string>([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
const MAX_PHOTO_SIZE = 15 * 1024 * 1024; // 15MB (모바일 원본 대응)

interface PhotoCaptureProps {
  photos: string[];
  onAdd: (dataUrl: string) => void;
  onRemove: (dataUrl: string) => void;
  maxPhotos?: number;
}

export function PhotoCapture({ photos, onAdd, onRemove, maxPhotos = 3 }: PhotoCaptureProps): React.ReactElement {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg(null);

    // 1) MIME 화이트리스트 검증
    const fileType = (file.type || '').toLowerCase();
    if (!ALLOWED_PHOTO_TYPES.has(fileType)) {
      setErrorMsg('JPEG·PNG·WebP·HEIC 형식만 업로드할 수 있어요.');
      return;
    }
    // 2) 크기 검증
    if (file.size > MAX_PHOTO_SIZE) {
      setErrorMsg('15MB 이하의 사진만 선택해주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onAdd(reader.result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('사진을 불러오지 못했어요. 다시 시도해주세요.');
    };
    reader.readAsDataURL(file);
  };

  const isMaxReached = photos.length >= maxPhotos;

  return (
    <div className="space-y-4">
      <p className="text-text-secondary text-sm">시술 사진을 저장해볼까요?</p>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="md"
          disabled={isMaxReached}
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 min-h-[44px]"
          icon={<span className="text-base">📷</span>}
        >
          촬영하기
        </Button>
        <Button
          variant="secondary"
          size="md"
          disabled={isMaxReached}
          onClick={() => galleryInputRef.current?.click()}
          className="flex-1 min-h-[44px]"
          icon={<span className="text-base">🖼</span>}
        >
          갤러리
        </Button>
      </div>

      {isMaxReached && (
        <p className="text-xs text-text-muted text-center">
          최대 {maxPhotos}장까지 저장할 수 있어요
        </p>
      )}

      {errorMsg && (
        <p className="text-xs font-medium text-red-600 text-center">{errorMsg}</p>
      )}

      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3 overflow-x-auto pb-1"
          >
            {photos.map((dataUrl, index) => (
              <motion.div
                key={dataUrl}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18, delay: index * 0.05 }}
                className="relative flex-shrink-0 w-24 h-24"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt={`시술 사진 ${index + 1}`}
                  className="w-24 h-24 rounded-xl object-cover border border-border"
                />
                <button
                  onClick={() => onRemove(dataUrl)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center text-xs font-bold shadow-md hover:bg-error/90 active:scale-95 transition-transform"
                  aria-label={`사진 ${index + 1} 삭제`}
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}
