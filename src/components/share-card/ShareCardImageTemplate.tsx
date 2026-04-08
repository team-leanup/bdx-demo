'use client';

import { DESIGN_SCOPE_LABEL, EXPRESSION_LABEL, BODY_PART_LABEL } from '@/lib/labels';
import type { ConsultationType } from '@/types/consultation';

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

export type CardRatio = '9:16' | '3:4';

const RATIO_CONFIG: Record<CardRatio, { width: number; height: number; photoPercent: number }> = {
  '9:16': { width: 1080, height: 1920, photoPercent: 70 },
  '3:4':  { width: 1080, height: 1440, photoPercent: 62 },
};

// BDX 심볼 로고 — 인라인 SVG (html2canvas 호환용)
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
}

export function ShareCardImageTemplate({
  imageUrl,
  consultation,
  shopName,
  ratio,
  templateRef,
}: ShareCardImageTemplateProps): React.ReactElement {
  const config = RATIO_CONFIG[ratio];
  const infoPercent = 100 - config.photoPercent;
  const designLabel = getDesignLabel(consultation.designScope);
  const bodyLabel = BODY_PART_LABEL[consultation.bodyPart] ?? consultation.bodyPart;
  const expressionLabels = (consultation.expressions ?? [])
    .map((e) => EXPRESSION_LABEL[e] ?? e)
    .filter(Boolean);

  return (
    <div
      ref={templateRef}
      style={{
        width: config.width,
        height: config.height,
        position: 'relative',
        overflow: 'hidden',
        background: '#FFFFFF',
        flexShrink: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 상단: 시술 사진 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${config.photoPercent}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
        }} />
      </div>

      {/* 하단: 정보 패널 */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: `${infoPercent}%`, background: '#FFFFFF',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '20px 36px 28px',
      }}>
        {/* 시술 정보 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 72, fontWeight: 900, color: '#191F28', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            {designLabel}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', padding: '8px 18px', borderRadius: 999,
              fontSize: 32, fontWeight: 700, background: '#FFF1F2', color: '#F43F5E',
            }}>
              {bodyLabel}
            </span>
            {expressionLabels.map((label, i) => (
              <span key={i} style={{
                display: 'inline-flex', padding: '8px 18px', borderRadius: 999,
                fontSize: 30, fontWeight: 600, background: '#F3F4F6', color: '#6B7280',
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* 샵 이름 */}
        <span style={{ fontSize: 48, fontWeight: 900, color: '#191F28', letterSpacing: '-0.01em' }}>
          {shopName}
        </span>

        {/* BDX 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <BdxLogo size={48} />
          <span style={{ fontSize: 24, letterSpacing: '0.06em', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const }}>
            Beauty Decision eXperience
          </span>
        </div>
      </div>
    </div>
  );
}
