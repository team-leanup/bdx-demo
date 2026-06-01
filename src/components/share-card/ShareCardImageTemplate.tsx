'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { DESIGN_SCOPE_LABEL, BODY_PART_LABEL, CATEGORY_LABELS } from '@/lib/labels';

// 0601: 공유카드 타이틀은 영문 무드명 대신 '시술 종류명'(한글 카테고리). designScope → 카테고리 매핑.
const SCOPE_TO_CATEGORY: Record<string, string> = {
  solid_tone: 'simple',
  gradient: 'simple',
  solid_point: 'french',
  french: 'french',
  magnet: 'magnet',
  magnet_art: 'magnet',
  art: 'art',
  full_art: 'art',
  monthly_art: 'art',
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

// Design scope 한글 라벨 (인스타 스타일)
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

function getDesignLabel(scope: string): string {
  return INSTA_SCOPE_LABEL[scope] ?? DESIGN_SCOPE_LABEL[scope] ?? scope;
}

const CONSULT_BUILT_LINE = '상담을 통해 완성된 디자인입니다';
const FEEDBACK_DEFAULT = '너무 만족하셨어요';
const RESERVE_CTA_DEFAULT = '이 디자인으로 예약하기';

export type CardRatio = '9:16' | '3:4';

const RATIO_CONFIG: Record<CardRatio, { width: number; height: number; photoPercent: number }> = {
  '9:16': { width: 1080, height: 1920, photoPercent: 62 },
  '3:4':  { width: 1080, height: 1440, photoPercent: 54 },
};

// BDX 심볼 로고 — 인라인 SVG (html2canvas 호환)
function BdxLogo({ size }: { size: number }): React.ReactElement {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width={size} height={size}>
      <defs>
        <linearGradient id="g0" gradientUnits="userSpaceOnUse" x1="50" y1="100" x2="150" y2="100">
          <stop offset="0%" stopColor="#FF0066" /><stop offset="20%" stopColor="#FF1A75" />
          <stop offset="45%" stopColor="#FF4D99" /><stop offset="50%" stopColor="#FF66AA" />
          <stop offset="55%" stopColor="#FF4D99" /><stop offset="80%" stopColor="#FF1A75" />
          <stop offset="100%" stopColor="#FF0066" />
        </linearGradient>
        <linearGradient id="g45" gradientUnits="userSpaceOnUse" x1="50" y1="50" x2="150" y2="150">
          <stop offset="0%" stopColor="#FF0066" /><stop offset="20%" stopColor="#FF1A75" />
          <stop offset="45%" stopColor="#FF4D99" /><stop offset="50%" stopColor="#FF66AA" />
          <stop offset="55%" stopColor="#FF4D99" /><stop offset="80%" stopColor="#FF1A75" />
          <stop offset="100%" stopColor="#FF0066" />
        </linearGradient>
        <linearGradient id="g90" gradientUnits="userSpaceOnUse" x1="100" y1="50" x2="100" y2="150">
          <stop offset="0%" stopColor="#FF0066" /><stop offset="20%" stopColor="#FF1A75" />
          <stop offset="45%" stopColor="#FF4D99" /><stop offset="50%" stopColor="#FF66AA" />
          <stop offset="55%" stopColor="#FF4D99" /><stop offset="80%" stopColor="#FF1A75" />
          <stop offset="100%" stopColor="#FF0066" />
        </linearGradient>
        <linearGradient id="g135" gradientUnits="userSpaceOnUse" x1="150" y1="50" x2="50" y2="150">
          <stop offset="0%" stopColor="#FF0066" /><stop offset="20%" stopColor="#FF1A75" />
          <stop offset="45%" stopColor="#FF4D99" /><stop offset="50%" stopColor="#FF66AA" />
          <stop offset="55%" stopColor="#FF4D99" /><stop offset="80%" stopColor="#FF1A75" />
          <stop offset="100%" stopColor="#FF0066" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="86" fill="none" stroke="#FF69B4" strokeWidth="2.5" strokeOpacity="0.4" />
      <path d="M 100,14 C 136,48 136,152 100,186 C 64,152 64,48 100,14 Z" fill="url(#g0)" fillOpacity="0.2" />
      <path d="M 100,14 C 136,48 136,152 100,186 C 64,152 64,48 100,14 Z" transform="rotate(45, 100, 100)" fill="url(#g45)" fillOpacity="0.2" />
      <path d="M 100,14 C 136,48 136,152 100,186 C 64,152 64,48 100,14 Z" transform="rotate(90, 100, 100)" fill="url(#g90)" fillOpacity="0.2" />
      <path d="M 100,14 C 136,48 136,152 100,186 C 64,152 64,48 100,14 Z" transform="rotate(135, 100, 100)" fill="url(#g135)" fillOpacity="0.2" />
    </svg>
  );
}

/**
 * 공유카드 단일 원천(SSOT).
 * 다운로드 이미지(ShareCardGeneratorModal)와 공개 링크 페이지(ShareCardClient)가
 * 동일한 이 템플릿을 렌더 → 디자인/폰트/정보 완전 일치.
 * 0601: consultation 객체 대신 필요한 필드만 직접 받도록 변경(공개 페이지는 전체 상담 데이터가 없음).
 */
interface ShareCardImageTemplateProps {
  imageUrl: string;
  designScope: string;
  /** 실제 시술 카테고리 ID (simple/french/magnet/art …) — 영문 무드 타이틀·해시태그 우선순위에 사용 */
  designCategory?: string;
  bodyPart: string;
  nailShape?: string | null;
  /** 한국어 카테고리/디자인 라벨 — 영문 타이틀 아래 서브타이틀로 항상 표시 */
  categoryLabelKo?: string;
  shopName: string;
  ratio: CardRatio;
  templateRef: React.RefObject<HTMLDivElement | null>;
  shopId?: string;
  createdAt?: string;
  estimatedMinutes?: number;
  /** 매장 로고 public URL — 제공 시 하단 매장명 옆에 표시 */
  shopLogoUrl?: string;
  /** 💕 만족 피드백 행 문구 (i18n) — 미지정 시 한국어 기본값 */
  feedbackLabel?: string;
  /** 상담 완성 안내 문구 (i18n) — 미지정 시 한국어 기본값 */
  consultBuiltLine?: string;
  /** QR 옆 CTA 문구 (i18n) — 미지정 시 한국어 기본값 */
  reserveCtaLabel?: string;
}

export function ShareCardImageTemplate({
  imageUrl,
  designScope,
  designCategory,
  bodyPart,
  nailShape,
  categoryLabelKo,
  shopName,
  ratio,
  templateRef,
  shopId,
  createdAt,
  estimatedMinutes,
  shopLogoUrl,
  feedbackLabel,
  consultBuiltLine,
  reserveCtaLabel,
}: ShareCardImageTemplateProps): React.ReactElement {
  const config = RATIO_CONFIG[ratio];
  const infoPercent = 100 - config.photoPercent;

  // 0601: 타이틀 = '시술 종류명'(한글 카테고리). categoryLabelKo가 샵 설정 라벨(오버라이드 반영)로
  //   유효하면 우선, 단 'full_art' 같은 원시 scope/key가 넘어온 경우는 무시하고
  //   designCategory → scope→카테고리 순으로 CATEGORY_LABELS에서 한글 라벨 해석. (영문 무드 타이틀·서브 줄 제거)
  const isRawKey = !!categoryLabelKo && /^[a-z_]+$/.test(categoryLabelKo);
  const categoryKey = designCategory ?? SCOPE_TO_CATEGORY[designScope];
  const categoryTitle =
    (categoryLabelKo && !isRawKey ? categoryLabelKo : undefined) ??
    (categoryKey ? CATEGORY_LABELS[categoryKey] : undefined) ??
    getDesignLabel(designScope);
  const bodyLabel = BODY_PART_LABEL[bodyPart] ?? bodyPart;

  const shapeLabel = nailShape ? SHAPE_LABEL[nailShape] : null;
  const shapeBodyParts = shapeLabel ? [shapeLabel, bodyLabel] : [bodyLabel];
  const showMinutes = typeof estimatedMinutes === 'number' && estimatedMinutes > 0;

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('en-CA').replace(/-/g, '.')
    : new Date().toLocaleDateString('en-CA').replace(/-/g, '.');

  // QR code generation — categoryKey 있으면 designCategory 쿼리 추가 (ShareCardCTASection 웹 버튼과 동일 패턴)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!shopId) return;
    const base = `https://beauty-decision.com/pre-consult/${shopId}`;
    const url = categoryKey
      ? `${base}?from=share&designCategory=${encodeURIComponent(categoryKey)}`
      : base;
    QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: { dark: '#191F28', light: '#FFFFFF00' },
      errorCorrectionLevel: 'M',
    })
      .then(setQrDataUrl)
      .catch(() => { /* QR generation failed — skip */ });
  }, [shopId, categoryKey]);

  return (
    <div
      ref={templateRef}
      style={{
        width: config.width,
        height: config.height,
        position: 'relative',
        overflow: 'hidden',
        background: '#F5F0EA',
        flexShrink: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Pretendard", "Noto Sans KR", sans-serif',
      }}
    >
      {/* 상단: 시술 사진 1장 (없으면 src 빈 문자열 경고 방지 — 베이지 영역 유지) */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${config.photoPercent}%` }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : null}

        {/* 하단 페이드 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
          background: 'linear-gradient(to bottom, rgba(245,240,234,0) 0%, rgba(245,240,234,1) 100%)',
        }} />
      </div>

      {/* 하단: 정보 패널 */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: `${infoPercent}%`, background: '#F5F0EA',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '48px 56px 52px',
      }}>
        {/* Upper: 시술 종류명(한글 카테고리) + 상담 메시지 — 영문 무드 타이틀·서브 줄 제거 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Display — 시술 종류명 */}
          <span style={{
            fontSize: 72, fontWeight: 900, color: '#191F28',
            lineHeight: 1.08, letterSpacing: '-0.03em', wordBreak: 'keep-all' as const,
          }}>
            {categoryTitle}
          </span>

          {/* Body — 상담 메시지 */}
          <span style={{
            fontSize: 22, fontWeight: 500, color: '#6B7280',
            lineHeight: 1.45, letterSpacing: '-0.01em',
            marginTop: 20,
          }}>
            {consultBuiltLine ?? CONSULT_BUILT_LINE}
          </span>
        </div>

        {/* Middle: 감성 정보 박스 (💅 형태/부위 · ⏱️ 시술시간 · 💕 만족 피드백) */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: 'rgba(255,255,255,0.62)',
          borderRadius: 20,
          border: '1px solid rgba(222, 214, 200, 0.7)',
          overflow: 'hidden',
        }}>
          <FeedbackRow icon="💅" parts={shapeBodyParts} isLast={false} />
          {showMinutes && (
            <FeedbackRow icon="⏱️" number={estimatedMinutes} unit="분" isLast={false} />
          )}
          <FeedbackRow icon="💕" parts={[feedbackLabel ?? FEEDBACK_DEFAULT]} isLast />
        </div>

        {/* Bottom: Shop + Date + BDX logo | CTA + QR */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 28,
        }}>
          {/* 좌측: 샵 로고 + 샵 정보 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1, minWidth: 0 }}>
            {shopLogoUrl && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shopLogoUrl} alt="" style={{ width: 76, height: 76, borderRadius: 18, objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(222,214,200,0.85)' }} />
              </>
            )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
            <span style={{
              fontSize: 32, fontWeight: 800, color: '#191F28',
              letterSpacing: '-0.025em', lineHeight: 1.15,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {shopName}
            </span>
            <span style={{
              fontSize: 17, fontWeight: 600, letterSpacing: '0.06em', color: '#9CA3AF',
              fontVariantNumeric: 'tabular-nums' as const,
              lineHeight: 1,
            }}>
              {dateStr}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <BdxLogo size={22} />
              <span style={{
                fontSize: 11, letterSpacing: '0.2em', color: '#9A8F84',
                fontWeight: 700, textTransform: 'uppercase' as const,
                lineHeight: 1,
              }}>
                Beauty Decision <span style={{ color: '#E11D48' }}>eXperience</span>
              </span>
            </div>
          </div>
          </div>

          {/* 우측: CTA + QR */}
          {qrDataUrl && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px 14px 20px',
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 20,
              border: '1px solid rgba(222, 214, 200, 0.85)',
            }}>
              <span style={{
                fontSize: 18, fontWeight: 800, color: '#191F28',
                letterSpacing: '-0.012em', lineHeight: 1.3,
                maxWidth: 150, whiteSpace: 'normal' as const,
              }}>
                {reserveCtaLabel ?? RESERVE_CTA_DEFAULT}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR" style={{ width: 108, height: 108, display: 'block', flexShrink: 0 }} />
            </div>
          )}
        </div>
      </div>
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
  const borderBottom = isLast ? 'none' : '1px solid rgba(222, 214, 200, 0.55)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 18,
      padding: '22px 32px',
      borderBottom,
      minHeight: 72,
    }}>
      <span style={{
        fontSize: 30, lineHeight: 1,
        width: 36, textAlign: 'center' as const,
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
      }}>
        {icon}
      </span>
      {typeof number === 'number' ? (
        <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
          <span style={{
            fontSize: 28, fontWeight: 800, color: '#191F28',
            letterSpacing: '-0.02em', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums' as const,
          }}>
            {number}
          </span>
          {unit && (
            <span style={{
              fontSize: 22, fontWeight: 600, color: '#1F2937',
              letterSpacing: '-0.01em', lineHeight: 1,
              marginLeft: 4,
            }}>
              {unit}
            </span>
          )}
        </span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {(parts ?? []).map((p, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {i > 0 && (
                <span style={{
                  width: 4, height: 4, borderRadius: 999,
                  background: '#C9BEB0', display: 'inline-block',
                }} />
              )}
              <span style={{
                fontSize: 24, fontWeight: 600, color: '#1F2937',
                letterSpacing: '-0.015em', lineHeight: 1.15,
              }}>
                {p}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 고정 1080px 템플릿을 부모 너비에 맞춰 축소 렌더하는 미리보기 래퍼.
 * 모달 미리보기·공개 페이지가 동일 컴포넌트를 공유하기 위해 export.
 * 0424: aspectRatio만 쓰면 세로로 너무 길어 하단이 잘려 — 뷰포트 기반 max-height 역산.
 */
type ShareCardScaledPreviewProps = Omit<ShareCardImageTemplateProps, 'templateRef'> & {
  className?: string;
  /** 미리보기 최대 높이(px). 미지정 시 뷰포트의 65%·680px 중 작은 쪽 */
  maxHeightPx?: number;
};

export function ShareCardScaledPreview({
  ratio,
  className,
  maxHeightPx,
  ...templateProps
}: ShareCardScaledPreviewProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);

  const templateW = 1080;
  const templateH = ratio === '9:16' ? 1920 : 1440;
  const cardAspect = templateW / templateH;

  useEffect(() => {
    function calc(): void {
      const parent = containerRef.current?.parentElement;
      if (!parent) return;
      const parentW = parent.clientWidth;
      const maxH = maxHeightPx ?? Math.min(window.innerHeight * 0.65, 680);
      let w = parentW;
      let h = w / cardAspect;
      if (h > maxH) {
        h = maxH;
        w = h * cardAspect;
      }
      setDims({ width: Math.floor(w), height: Math.floor(h) });
    }
    calc();
    const parent = containerRef.current?.parentElement;
    const obs = parent ? new ResizeObserver(calc) : null;
    if (parent && obs) obs.observe(parent);
    window.addEventListener('resize', calc);
    return () => {
      obs?.disconnect();
      window.removeEventListener('resize', calc);
    };
  }, [cardAspect, maxHeightPx]);

  const scale = dims ? dims.width / templateW : 0;

  return (
    <div
      ref={containerRef}
      className={className ?? 'relative mx-auto overflow-hidden rounded-2xl border border-border'}
      style={
        dims
          ? { width: dims.width, height: dims.height }
          : { aspectRatio: `${templateW} / ${templateH}`, width: '100%' }
      }
    >
      {scale > 0 && dims && (
        <div
          style={{
            width: templateW,
            height: templateH,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        >
          <ShareCardImageTemplate ratio={ratio} templateRef={{ current: null }} {...templateProps} />
        </div>
      )}
    </div>
  );
}
