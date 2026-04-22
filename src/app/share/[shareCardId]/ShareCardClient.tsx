'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n';
import { DESIGN_SCOPE_LABEL, BODY_PART_LABEL } from '@/lib/labels';
import type { ShareCardPublicData } from '@/types/share-card';
import { ShareCardCTASection } from '@/components/share-card/ShareCardCTASection';

interface Props {
  data: ShareCardPublicData;
  shareCardId: string;
}

// DesignScope → 한글 라벨
const INSTA_SCOPE_LABEL: Record<string, string> = {
  solid_tone: '원톤 (단색)',
  gradient: '그라데이션',
  french: '프렌치',
  art: '아트 디자인',
  magnet: '자석',
  magnet_art: '자석 아트',
  monthly_art: '월간 아트',
  solid_point: '단색+포인트',
  full_art: '풀아트',
};

// DesignScope → mood title (영문)
const MOOD_TITLE: Record<string, string> = {
  solid_tone: 'Clean Minimal',
  gradient: 'Soft Gradient',
  french: 'Elegant French',
  art: 'Creative Art',
  magnet: 'Magnetic Glow',
  magnet_art: 'Magnetic Art',
  monthly_art: 'Monthly Curated',
  solid_point: 'Subtle Accent',
  full_art: 'Full Art Edition',
};

// DesignScope → hashtag 1개
const SCOPE_HASHTAG: Record<string, string> = {
  solid_tone: '#Minimal',
  gradient: '#Soft',
  french: '#Classic',
  art: '#Creative',
  magnet: '#Trendy',
  magnet_art: '#Magnetic',
  monthly_art: '#Curated',
  solid_point: '#Point',
  full_art: '#FullArt',
};

// Nail shape → 한글
const SHAPE_LABEL: Record<string, string> = {
  round: '라운드',
  oval: '오벌',
  square: '스퀘어',
  squoval: '스퀘발',
  almond: '아몬드',
  stiletto: '스틸레토',
  coffin: '코핀',
};

const DEFAULT_FEEDBACK_LINE = '너무 만족하셨어요';
const CONSULT_BUILT_LINE = '상담을 통해 완성된 디자인입니다';

function getDesignLabel(scope: string): string {
  return INSTA_SCOPE_LABEL[scope] ?? DESIGN_SCOPE_LABEL[scope] ?? scope;
}

export function ShareCardClient({ data, shareCardId }: Props): React.ReactElement {
  const t = useT();
  const [isDownloading, setIsDownloading] = useState(false);

  // 사진 1장만 사용 (이미지 배열 있어도 첫 장만 카드에 노출)
  const mainImage = data.imageUrls[0];

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      // 동적 import로 html2canvas-pro 로드 + 카드 DOM 캡처
      const target = document.getElementById('share-card-capture-target');
      if (!target) return;
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(target, {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#F5F0EA',
        width: target.offsetWidth,
        height: target.offsetHeight,
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
  const moodTitle = MOOD_TITLE[data.design.designScope] ?? 'Nail Design';
  const hashtag = SCOPE_HASHTAG[data.design.designScope] ?? '#Nail';
  const bodyLabel = BODY_PART_LABEL[data.design.bodyPart] ?? data.design.bodyPart;
  const shapeLabel = data.design.nailShape ? SHAPE_LABEL[data.design.nailShape] : null;
  const shapeParts = shapeLabel ? [shapeLabel, bodyLabel] : [bodyLabel];
  const showMinutes = typeof data.estimatedMinutes === 'number' && data.estimatedMinutes > 0;
  const dateStr = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('en-CA').replace(/-/g, '.')
    : new Date().toLocaleDateString('en-CA').replace(/-/g, '.');

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-start py-8 px-4">
      {/* 캡처 대상 카드 (9:16) */}
      <motion.div
        id="share-card-capture-target"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-sm overflow-hidden"
        style={{ aspectRatio: '9 / 16', background: '#F5F0EA' }}
      >
        {/* 상단: 시술 사진 1장 (약 60%) */}
        <div className="absolute inset-x-0 top-0" style={{ height: '60%' }}>
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
          {/* 하단 페이드 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-20"
            style={{ background: 'linear-gradient(to bottom, rgba(245,240,234,0) 0%, rgba(245,240,234,1) 100%)' }}
          />

          {/* 좌상단 해시태그 */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/92 text-[#191F28]">
              {hashtag}
            </span>
          </div>
        </div>

        {/* 하단 정보 패널 (40%) */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-between px-5 pb-5 pt-4" style={{ height: '40%' }}>
          {/* Title + Subtitle + Body */}
          <div className="flex flex-col">
            <span className="text-[32px] font-black text-[#191F28] leading-[1.0] tracking-[-0.035em]">
              {moodTitle}
            </span>
            <span className="text-[13px] font-semibold text-[#4B5563] leading-tight tracking-tight mt-2">
              {designLabel}
            </span>
            <span className="text-[11px] font-medium text-[#6B7280] leading-snug mt-2.5">
              {CONSULT_BUILT_LINE}
            </span>
          </div>

          {/* 3줄 감성 정보 박스 */}
          <div
            className="flex flex-col rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(222, 214, 200, 0.7)' }}
          >
            <FeedbackRow icon="💅" parts={shapeParts} />
            {showMinutes && <FeedbackRow icon="⏱️" number={data.estimatedMinutes} unit="분" />}
            <FeedbackRow icon="💕" parts={[DEFAULT_FEEDBACK_LINE]} isLast />
          </div>

          {/* 하단: 샵/날짜/BDX + CTA/QR */}
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-[14px] font-black text-[#191F28] tracking-tight truncate">
                {data.shopName}
              </span>
              <span className="text-[9px] font-semibold tracking-[0.08em] text-[#9CA3AF]">{dateStr}</span>
              <div className="flex items-center gap-1 mt-0.5">
                <Image
                  src="/bdx-logo/bdx-symbol.svg"
                  alt="BDX"
                  width={14}
                  height={14}
                  className="object-contain"
                  unoptimized
                />
                <span className="text-[7px] tracking-[0.14em] text-[#9A8F84] font-bold uppercase">
                  Beauty Decision <span className="text-[#E11D48]">eXperience</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

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
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t('shareCard.saving')}</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
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
          shareCardId={shareCardId}
          designScope={data.design.designScope}
        />
      </motion.div>
    </div>
  );
}

interface FeedbackRowProps {
  icon: string;
  parts?: string[];
  number?: number;
  unit?: string;
  isLast?: boolean;
}

function FeedbackRow({ icon, parts, number, unit, isLast }: FeedbackRowProps): React.ReactElement {
  return (
    <div
      className="flex items-center gap-2.5 px-3 py-2.5"
      style={{
        borderBottom: isLast ? 'none' : '1px solid rgba(222, 214, 200, 0.65)',
      }}
    >
      <span
        className="text-[15px] leading-none w-5 text-center"
        style={{ fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif' }}
      >
        {icon}
      </span>
      {typeof number === 'number' ? (
        <span className="flex items-baseline gap-0.5">
          <span className="text-[14px] font-extrabold text-[#191F28] tabular-nums tracking-tight">{number}</span>
          {unit && <span className="text-[11px] font-semibold text-[#4B5563] ml-0.5">{unit}</span>}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          {(parts ?? []).map((p, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="w-[3px] h-[3px] rounded-full bg-[#C9BEB0] inline-block" />}
              <span className="text-[12px] font-semibold text-[#1F2937] tracking-tight">{p}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
