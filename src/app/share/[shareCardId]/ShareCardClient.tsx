'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useT } from '@/lib/i18n';
import type { ShareCardPublicData } from '@/types/share-card';
import { ShareCardCTASection } from '@/components/share-card/ShareCardCTASection';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import {
  ShareCardImageTemplate,
  ShareCardScaledPreview,
} from '@/components/share-card/ShareCardImageTemplate';

interface Props {
  data: ShareCardPublicData;
  shareCardId: string;
}

/** iOS Safari (iPhone/iPad/iPod) 감지 */
function isIOS(): boolean {
  return /iP(ad|hone|od)/.test(navigator.userAgent);
}

export function ShareCardClient({ data, shareCardId }: Props): React.ReactElement {
  const t = useT();
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // 0601: 다운로드 품질용 풀사이즈(1080px) 숨김 인스턴스 캡처 — 미리보기는 동일 템플릿을 축소 렌더.
  const captureRef = useRef<HTMLDivElement | null>(null);

  // 사진 1장만 사용 (이미지 배열 있어도 첫 장만 카드에 노출)
  const mainImage = data.imageUrls[0] ?? '';

  // 다운로드 이미지·미리보기가 공유하는 단일 템플릿 props (SSOT).
  // 공개 페이지는 외국인 고객 대상이라 문구를 현재 선택 언어로 전달.
  const cardProps = {
    imageUrl: mainImage,
    designScope: data.design.designScope,
    designCategory: data.design.designCategory,
    bodyPart: data.design.bodyPart,
    nailShape: data.design.nailShape,
    categoryLabelKo: data.design.categoryLabelKo,
    shopName: data.shopName,
    shopId: data.shopId,
    createdAt: data.createdAt,
    estimatedMinutes: data.estimatedMinutes,
    shopLogoUrl: data.shopLogoUrl,
    feedbackLabel: t('shareCard.feedbackDefault'),
    consultBuiltLine: t('shareCard.consultBuiltLine'),
    reserveCtaLabel: t('shareCard.reserveCta'),
  };

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setSaveError(null);

    try {
      const target = captureRef.current;
      if (!target) return;
      const html2canvas = (await import('html2canvas-pro')).default;
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#F5F0EA',
        width: target.offsetWidth,
        height: target.offsetHeight,
        logging: false,
      });

      const shopSlug = data.shopName.replace(/\s+/g, '_').toLowerCase();
      const fileName = `bdx_${shopSlug}_nail.jpg`;

      if (isIOS()) {
        // iOS Safari: canvas → Blob → navigator.share({files}) 우선
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, 'image/jpeg', 0.95);
        });
        if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/jpeg' })] })) {
          const file = new File([blob], fileName, { type: 'image/jpeg' });
          await navigator.share({ files: [file], title: fileName });
        } else {
          const url = canvas.toDataURL('image/jpeg', 0.95);
          window.open(url, '_blank');
          setSaveError('사진을 꾹 눌러 저장해주세요 / Press & hold to save');
        }
      } else {
        const url = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        link.click();
      }
    } catch (err) {
      console.error('이미지 저장 실패:', err);
      setSaveError('저장에 실패했어요. 다시 시도해주세요. / Save failed, please try again.');
    } finally {
      setIsDownloading(false);
    }
  }, [isDownloading, data.shopName]);

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-start py-8 px-4">
      {/* 언어 선택 — 외국인 고객용 */}
      <div className="w-full max-w-sm mb-5 flex justify-end">
        <LanguageSelector />
      </div>

      {/* 카드 미리보기 — 다운로드 이미지와 완전히 동일한 SSOT 템플릿을 축소 렌더 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="w-full max-w-sm"
      >
        <ShareCardScaledPreview
          ratio="9:16"
          className="relative mx-auto overflow-hidden rounded-2xl"
          {...cardProps}
        />
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
        {saveError ? (
          <p className="text-center text-[12px] text-amber-600 mt-2.5 px-2 leading-snug">
            {saveError}
          </p>
        ) : (
          <p className="text-center text-[11px] text-text-muted mt-2.5">
            {t('shareCard.imageHint')}
          </p>
        )}
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

      {/* 숨김 풀사이즈(1080px) 캡처 타겟 — 다운로드 화질 보존 */}
      {mainImage && (
        <div style={{ position: 'fixed', left: -9999, top: -9999, zIndex: -1, pointerEvents: 'none' }}>
          <ShareCardImageTemplate ratio="9:16" templateRef={captureRef} {...cardProps} />
        </div>
      )}
    </div>
  );
}
