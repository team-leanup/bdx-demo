'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConsultationType } from '@/types/consultation';
import { DESIGN_SCOPE_LABEL, EXPRESSION_LABEL } from '@/lib/labels';

interface PreConsultSummaryInlineProps {
  data: ConsultationType;
  referenceImageUrls?: string[];
}

const BODY_PART_LABEL: Record<string, string> = {
  hand: '핸드',
  foot: '풋',
};

const OFF_TYPE_LABEL: Record<string, string> = {
  none: '없음',
  same_shop: '당샵 오프',
  other_shop: '타샵 오프',
};

const EXTENSION_TYPE_LABEL: Record<string, string> = {
  none: '없음',
  repair: '리페어',
  extension: '연장',
};

const NAIL_SHAPE_LABEL: Record<string, string> = {
  round: '라운드',
  oval: '오벌',
  square: '스퀘어',
  squoval: '스퀘오벌',
  almond: '아몬드',
  stiletto: '스틸레토',
  coffin: '코핀',
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface-alt border border-border p-3">
      <h4 className="text-xs font-semibold text-text-muted mb-2">{title}</h4>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}

export function PreConsultSummaryInline({ data, referenceImageUrls }: PreConsultSummaryInlineProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const images = data.referenceImages?.length
    ? data.referenceImages
    : (referenceImageUrls ?? []);

  const expressionLabel = data.expressions.length > 0
    ? data.expressions.map((e) => EXPRESSION_LABEL[e] ?? e).join(', ')
    : '없음';

  const extraColorLabel = `${data.extraColorCount}개`;

  return (
    <>
      <div className="flex flex-col gap-3 pt-1">
        {/* 참고 이미지 섹션 */}
        {images.length > 0 && (
          <SectionCard title="참고 이미지">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxUrl(url)}
                  className="flex-none relative h-20 w-20 rounded-lg overflow-hidden border border-border focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`참고 이미지 ${idx + 1} 확대`}
                >
                  <Image
                    src={url}
                    alt={`참고 이미지 ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {/* 디자인 선택 요약 */}
        <SectionCard title="디자인 선택">
          <Row label="시술 부위" value={BODY_PART_LABEL[data.bodyPart] ?? data.bodyPart} />
          <Row label="디자인 범위" value={DESIGN_SCOPE_LABEL[data.designScope] ?? data.designScope} />
          <Row label="네일 쉐입" value={NAIL_SHAPE_LABEL[data.nailShape] ?? data.nailShape} />
          <Row label="표현 기법" value={expressionLabel} />
        </SectionCard>

        {/* 시술 조건 */}
        <SectionCard title="시술 조건">
          <Row label="오프" value={OFF_TYPE_LABEL[data.offType] ?? data.offType} />
          <Row label="연장 / 리페어" value={EXTENSION_TYPE_LABEL[data.extensionType] ?? data.extensionType} />
        </SectionCard>

        {/* 추가 옵션 (파츠 또는 추가 컬러가 있을 때만) */}
        {(data.hasParts || data.extraColorCount > 0) && (
          <SectionCard title="추가 옵션">
            {data.hasParts && <Row label="파츠" value="있음" />}
            {data.extraColorCount > 0 && <Row label="추가 컬러" value={extraColorLabel} />}
          </SectionCard>
        )}
      </div>

      {/* 이미지 확대 라이트박스 */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              className="relative w-full max-w-sm aspect-square rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightboxUrl}
                alt="참고 이미지 확대"
                fill
                className="object-contain"
                sizes="(max-width: 384px) 100vw, 384px"
              />
              <button
                onClick={() => setLightboxUrl(null)}
                className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                aria-label="닫기"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
