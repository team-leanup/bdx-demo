'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { DESIGN_SCOPE_LABEL, BODY_PART_LABEL } from '@/lib/labels';
import type { ConsultationType } from '@/types/consultation';

// Design scope → mood title (영문)
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

// Design scope → hashtag
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

const DEFAULT_FEEDBACK_LINE = '너무 만족하셨어요';
const CONSULT_BUILT_LINE = '상담을 통해 완성된 디자인입니다';

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

interface ShareCardImageTemplateProps {
  imageUrl: string;
  consultation: ConsultationType;
  shopName: string;
  ratio: CardRatio;
  templateRef: React.RefObject<HTMLDivElement | null>;
  shopId?: string;
  createdAt?: string;
  estimatedMinutes?: number;
}

export function ShareCardImageTemplate({
  imageUrl,
  consultation,
  shopName,
  ratio,
  templateRef,
  shopId,
  createdAt,
  estimatedMinutes,
}: ShareCardImageTemplateProps): React.ReactElement {
  const config = RATIO_CONFIG[ratio];
  const infoPercent = 100 - config.photoPercent;
  const designLabel = getDesignLabel(consultation.designScope);
  const bodyLabel = BODY_PART_LABEL[consultation.bodyPart] ?? consultation.bodyPart;

  const moodTitle = MOOD_TITLE[consultation.designScope] ?? 'Nail Design';
  const hashtag = SCOPE_HASHTAG[consultation.designScope] ?? '#Nail';

  const shapeLabel = consultation.nailShape ? SHAPE_LABEL[consultation.nailShape] : null;
  const shapeBodyParts = shapeLabel ? [shapeLabel, bodyLabel] : [bodyLabel];
  const showMinutes = typeof estimatedMinutes === 'number' && estimatedMinutes > 0;

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('en-CA').replace(/-/g, '.')
    : new Date().toLocaleDateString('en-CA').replace(/-/g, '.');

  // QR code generation
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!shopId) return;
    const url = `https://beauty-decision.com/pre-consult/${shopId}`;
    QRCode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: { dark: '#191F28', light: '#FFFFFF00' },
      errorCorrectionLevel: 'M',
    })
      .then(setQrDataUrl)
      .catch(() => { /* QR generation failed — skip */ });
  }, [shopId]);

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
      {/* 상단: 시술 사진 1장 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${config.photoPercent}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

        {/* 하단 페이드 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 180,
          background: 'linear-gradient(to bottom, rgba(245,240,234,0) 0%, rgba(245,240,234,1) 100%)',
        }} />

        {/* 좌상단: 단일 해시태그 pill (광고 느낌 제거, 기록 카드 톤) */}
        <div style={{
          position: 'absolute', top: 40, left: 40,
        }}>
          <span style={{
            display: 'inline-flex', padding: '12px 22px', borderRadius: 999,
            fontSize: 22, fontWeight: 700, letterSpacing: '-0.005em',
            background: 'rgba(255,255,255,0.92)', color: '#191F28',
          }}>
            {hashtag}
          </span>
        </div>
      </div>

      {/* 하단: 정보 패널 */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: `${infoPercent}%`, background: '#F5F0EA',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 56px 48px',
      }}>
        {/* Upper: 타이틀 + 서브 + 본문 */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Display — 영문 무드 타이틀 */}
          <span style={{
            fontSize: 88, fontWeight: 900, color: '#191F28',
            lineHeight: 0.98, letterSpacing: '-0.04em',
          }}>
            {moodTitle}
          </span>

          {/* Body Large — 한글 서브 */}
          <span style={{
            fontSize: 32, fontWeight: 600, color: '#4B5563',
            lineHeight: 1.2, letterSpacing: '-0.02em',
            marginTop: 14,
          }}>
            {designLabel}
          </span>

          {/* Body — 상담 메시지 */}
          <span style={{
            fontSize: 24, fontWeight: 500, color: '#6B7280',
            lineHeight: 1.4, letterSpacing: '-0.012em',
            marginTop: 22,
          }}>
            {CONSULT_BUILT_LINE}
          </span>
        </div>

        {/* Middle: 3줄 감성 정보 박스 */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: 'rgba(255,255,255,0.62)',
          borderRadius: 20,
          border: '1px solid rgba(222, 214, 200, 0.7)',
          overflow: 'hidden',
        }}>
          <FeedbackRow
            icon="💅"
            parts={shapeBodyParts}
            isLast={false}
          />
          {showMinutes && (
            <FeedbackRow
              icon="⏱️"
              number={estimatedMinutes}
              unit="분"
              isLast={false}
            />
          )}
          <FeedbackRow
            icon="💕"
            parts={[DEFAULT_FEEDBACK_LINE]}
            isLast
          />
        </div>

        {/* Bottom: Shop + Date + BDX logo | CTA + QR */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          gap: 28,
        }}>
          {/* 좌측: 샵 정보 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: 36, fontWeight: 900, color: '#191F28',
              letterSpacing: '-0.03em', lineHeight: 1.1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {shopName}
            </span>
            <span style={{
              fontSize: 18, fontWeight: 600, letterSpacing: '0.08em', color: '#9CA3AF',
              fontVariantNumeric: 'tabular-nums' as const,
            }}>
              {dateStr}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8 }}>
              <BdxLogo size={24} />
              <span style={{
                fontSize: 12, letterSpacing: '0.18em', color: '#9A8F84',
                fontWeight: 700, textTransform: 'uppercase' as const,
              }}>
                Beauty Decision <span style={{ color: '#E11D48' }}>eXperience</span>
              </span>
            </div>
          </div>

          {/* 우측: CTA + QR */}
          {qrDataUrl && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px 14px 20px',
              background: 'rgba(255,255,255,0.95)',
              borderRadius: 22,
              border: '1px solid rgba(222, 214, 200, 0.85)',
            }}>
              <span style={{
                fontSize: 20, fontWeight: 800, color: '#191F28',
                letterSpacing: '-0.015em', lineHeight: 1.25,
                whiteSpace: 'nowrap' as const,
              }}>
                이 디자인으로<br />
                <span style={{ color: '#E11D48' }}>예약하기</span>
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR" style={{ width: 120, height: 120, display: 'block' }} />
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
      display: 'flex', alignItems: 'center', gap: 20,
      padding: '24px 32px',
      borderBottom,
    }}>
      <span style={{
        fontSize: 32, lineHeight: 1,
        width: 40, textAlign: 'center' as const,
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
      }}>
        {icon}
      </span>
      {typeof number === 'number' ? (
        <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
          <span style={{
            fontSize: 30, fontWeight: 800, color: '#191F28',
            letterSpacing: '-0.02em',
            fontVariantNumeric: 'tabular-nums' as const,
          }}>
            {number}
          </span>
          {unit && (
            <span style={{
              fontSize: 24, fontWeight: 600, color: '#1F2937',
              letterSpacing: '-0.01em',
              marginLeft: 4,
            }}>
              {unit}
            </span>
          )}
        </span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {(parts ?? []).map((p, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {i > 0 && (
                <span style={{
                  width: 5, height: 5, borderRadius: 999,
                  background: '#C9BEB0', display: 'inline-block',
                }} />
              )}
              <span style={{
                fontSize: 26, fontWeight: 600, color: '#1F2937',
                letterSpacing: '-0.015em',
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
