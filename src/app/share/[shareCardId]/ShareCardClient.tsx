'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { DESIGN_SCOPE_LABEL, EXPRESSION_LABEL, BODY_PART_LABEL } from '@/lib/labels';
import type { ShareCardPublicData } from '@/types/share-card';
import { ShareCardCTASection } from '@/components/share-card/ShareCardCTASection';

interface Props {
  data: ShareCardPublicData;
  shareCardId: string;
}

// DesignScope → 인스타 표시용 한글 레이블 (요구사항 매핑)
const INSTA_SCOPE_LABEL: Record<string, string> = {
  solid_tone: '원톤 (단색)',
  gradient: '그라데이션',
  french: '프렌치',
  art: '아트 디자인',
  magnet: '자석',
  magnet_art: '자석 아트',
  monthly_art: '월간 아트',
  // labels.ts 기존 키도 폴백 처리
  solid_point: '단색+포인트',
  full_art: '풀아트',
};

function getDesignLabel(scope: string): string {
  return INSTA_SCOPE_LABEL[scope] ?? DESIGN_SCOPE_LABEL[scope] ?? scope;
}

export function ShareCardClient({ data, shareCardId }: Props): React.ReactElement {
  const t = useT();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const mainImage = data.imageUrls[activeIndex] ?? data.imageUrls[0];
  const hasMultipleImages = data.imageUrls.length > 1;

  const handleDownload = useCallback(async () => {
    if (!cardRef.current || isDownloading) return;
    setIsDownloading(true);

    try {
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#FFFFFF',
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
        logging: false,
      });

      const url = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      const shopSlug = data.shopName.replace(/\s+/g, '_').toLowerCase();
      link.download = `bdx_${shopSlug}_nail.jpg`;
      link.href = url;
      link.click();
    } catch (err) {
      console.error('이미지 저장 실패:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, data.shopName]);

  const designLabel = getDesignLabel(data.design.designScope);
  const bodyLabel = BODY_PART_LABEL[data.design.bodyPart] ?? data.design.bodyPart;
  const expressionLabels = data.design.expressions
    .map((e) => EXPRESSION_LABEL[e] ?? e)
    .filter(Boolean);

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-start py-10 px-4">

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          캡처 대상 카드 영역 (4:5 비율)
          1080×1350 기준 → 화면에서는 max-w-sm
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-sm bg-white overflow-hidden"
        style={{ aspectRatio: '9 / 16' }}
      >
        {/* ── 9:16 상하 분할: 사진 상단 75% + 정보 하단 25% ── */}
        {/* 상단: 시술 사진 */}
        <div className="absolute inset-0 bottom-[25%]">
          {mainImage ? (
            <Image
              src={mainImage}
              alt="네일 시술 사진"
              fill
              className="object-cover"
              unoptimized
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
              <span className="text-5xl">💅</span>
            </div>
          )}
          {/* 하단으로 자연스러운 화이트 페이드 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-20"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)' }}
          />
        </div>

        {/* 하단 25%: 정보 패널 */}
        <div className="absolute left-0 right-0 bottom-0 h-[25%] bg-white flex flex-col justify-between px-6 pt-3 pb-5">
          {/* 시술 정보 */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[16px] font-black text-[#191F28] leading-snug">
              {designLabel}
            </span>
            {expressionLabels.length > 0 && (
              <span className="text-[12px] text-[#4E5968]">
                {expressionLabels.join(' · ')}
              </span>
            )}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-500">
                {bodyLabel}
              </span>
              {data.design.hasParts && (
                <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-500">
                  <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  파츠
                </span>
              )}
            </div>
          </div>

          {/* 하단: 샵 이름 + BDX 로고 */}
          <div className="flex items-end justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[14px] font-black text-[#191F28] tracking-tight">
                {data.shopName}
              </span>
              {data.shopAddress && (
                <span className="text-[10px] text-[#8B95A1] truncate max-w-[180px]">
                  {data.shopAddress}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Image
                src="/bdx-logo/bdx-symbol.svg"
                alt="BDX"
                width={22}
                height={22}
                className="object-contain"
                unoptimized
              />
              <span className="text-[8px] tracking-[0.12em] text-[#C9CDD2] font-medium uppercase">
                Beauty Decision
              </span>
            </div>
          </div>
        </div>

        {/* 복수 이미지일 때 우상단 썸네일 인디케이터 (캡처에는 포함됨) */}
        {hasMultipleImages && (
          <div className="absolute top-3 right-3 flex gap-1">
            {data.imageUrls.slice(0, 5).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i === activeIndex ? 'bg-white' : 'bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          카드 바깥 — 캡처에 포함 안 됨
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* 복수 이미지 선택 썸네일 */}
      {hasMultipleImages && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex gap-2 mt-4"
        >
          {data.imageUrls.slice(0, 6).map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                i === activeIndex
                  ? 'ring-2 ring-primary ring-offset-1'
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <Image
                src={url}
                alt={`시술 사진 ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </button>
          ))}
        </motion.div>
      )}

      {/* 이미지 저장 버튼 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="w-full max-w-sm mt-5"
      >
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-text text-white text-[15px] font-bold tracking-tight transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span>{t('shareCard.saving')}</span>
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              <span>{t('shareCard.imageDownload')}</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-text-muted mt-2.5">
          인스타그램 업로드용 · JPG 고화질
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="w-full max-w-sm mt-4"
      >
        <ShareCardCTASection
          shopId={data.shopId}
          shopPhone={data.shopPhone}
          kakaoTalkUrl={data.kakaoTalkUrl}
          naverReservationUrl={data.naverReservationUrl}
          shareCardId={shareCardId}
          designScope={data.design.designScope}
        />
      </motion.div>
    </div>
  );
}
