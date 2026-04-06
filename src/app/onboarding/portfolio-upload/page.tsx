'use client';

import { useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useOnboardingPhotoStore } from '@/store/onboarding-photo-store';

const MAX_PHOTOS = 20;
const MIN_PHOTOS = 3;

interface EncouragementInfo {
  text: string;
  color: string;
  icon: string;
  pulse: boolean;
}

function getEncouragement(count: number): EncouragementInfo {
  if (count === 0) return { text: '사진이 많을수록 고객 선택이 빨라져요', color: 'text-text-muted', icon: '', pulse: false };
  if (count <= 2) return { text: '좋은 시작이에요! 조금 더 추가해볼까요?', color: 'text-text-secondary', icon: '👍', pulse: false };
  if (count <= 5) return { text: '조금 더 추가하면 좋아요', color: 'text-primary', icon: '💪', pulse: false };
  if (count <= 9) return { text: '거의 다 왔어요!', color: 'text-primary font-semibold', icon: '🙌', pulse: true };
  return { text: '완벽해요!', color: 'text-success font-bold', icon: '🎉', pulse: true };
}

export default function PortfolioUploadPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { photos, addPhotos, removePhoto } = useOnboardingPhotoStore();

  const readFiles = useCallback((files: FileList) => {
    const remaining = MAX_PHOTOS - photos.length;
    const toProcess = Array.from(files).slice(0, remaining);

    toProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        addPhotos([{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, dataUrl }]);
      };
      reader.readAsDataURL(file);
    });
  }, [photos.length, addPhotos]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      readFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleNext = () => {
    router.push('/onboarding/portfolio-classify');
  };

  const count = photos.length;
  const canProceed = count >= MIN_PHOTOS;
  const progressPercent = Math.min((count / MAX_PHOTOS) * 100, 100);
  const encouragement = getEncouragement(count);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-5 md:px-0 py-4 md:py-6 min-h-[calc(100dvh-112px)]"
    >
      {/* Header */}
      <div className="flex flex-col gap-1 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-text">포트폴리오 업로드</h1>
        <p className="text-sm text-text-secondary">고객이 고를 디자인을 준비해볼게요</p>
      </div>

      {/* Photo guide */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {/* Good photo */}
        <div className="rounded-2xl border border-border bg-surface p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 mb-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill="#00C471" opacity="0.15" />
              <path d="M5 8L7 10L11 6" stroke="#00C471" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-xs font-semibold text-success">좋은 사진</span>
          </div>
          <ul className="text-[11px] text-text-secondary space-y-0.5 leading-relaxed">
            <li>밝은 조명</li>
            <li>손 전체 보이기</li>
            <li>디자인 선명</li>
          </ul>
        </div>

        {/* Bad photo */}
        <div className="rounded-2xl border border-border bg-surface p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 mb-1">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" fill="#F04452" opacity="0.15" />
              <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="#F04452" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-xs font-semibold text-error">피할 사진</span>
          </div>
          <ul className="text-[11px] text-text-secondary space-y-0.5 leading-relaxed">
            <li>어두운 사진</li>
            <li>흐릿한 사진</li>
            <li>잘린 사진</li>
          </ul>
        </div>
      </div>

      {/* Upload area */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {count === 0 ? (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-2xl border-2 border-dashed border-border py-12 flex flex-col items-center gap-3 hover:border-primary/40 transition-colors bg-surface-alt/50 mb-4"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary-light)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <span className="text-sm font-medium text-text-secondary">사진 선택하기</span>
          <span className="text-xs text-text-muted">최대 {MAX_PHOTOS}장</span>
        </button>
      ) : (
        <div className="flex flex-col gap-3 mb-4">
          {/* Photo grid */}
          <div className="grid grid-cols-4 md:grid-cols-5 gap-2">
            <AnimatePresence mode="popLayout">
              {photos.map((photo) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="relative aspect-square rounded-xl overflow-hidden group"
                >
                  <img
                    src={photo.dataUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removePhoto(photo.id); }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center shadow-sm"
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2L8 8M8 2L2 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add more button */}
            {count < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center hover:border-primary/40 transition-colors bg-surface-alt/30"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="10" y1="4" x2="10" y2="16" />
                  <line x1="4" y1="10" x2="16" y2="10" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progress section */}
      <div className="flex flex-col gap-2 mt-auto mb-2">
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${count >= 10 ? 'bg-success' : 'bg-primary'}`}
              initial={false}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs font-medium text-text-muted tabular-nums flex-shrink-0">
            {count} / {MAX_PHOTOS}장
          </span>
        </div>

        {/* Encouragement */}
        <AnimatePresence mode="wait">
          <motion.div
            key={encouragement.text}
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center justify-center gap-1.5"
          >
            {encouragement.icon && (
              <motion.span
                className="text-sm"
                animate={encouragement.pulse ? { scale: [1, 1.2, 1] } : {}}
                transition={encouragement.pulse ? { duration: 0.6, repeat: Infinity, repeatDelay: 1.5 } : {}}
              >
                {encouragement.icon}
              </motion.span>
            )}
            <span className={`text-xs ${encouragement.color} text-center`}>
              {encouragement.text}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="pt-4">
        <Button size="lg" fullWidth onClick={handleNext} disabled={!canProceed}>
          다음
        </Button>
        {!canProceed && count > 0 && (
          <p className="text-xs text-text-muted text-center mt-2">
            최소 {MIN_PHOTOS}장 이상 업로드해주세요
          </p>
        )}
      </div>
    </motion.div>
  );
}
