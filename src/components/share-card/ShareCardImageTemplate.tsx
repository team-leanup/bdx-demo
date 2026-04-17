'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { DESIGN_SCOPE_LABEL, EXPRESSION_LABEL, BODY_PART_LABEL } from '@/lib/labels';
import type { ConsultationType } from '@/types/consultation';

// ── Design scope → mood title mapping ───────────────────────────────────────
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

// ── Design scope → hashtag mapping ──────────────────────────────────────────
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

// ── Nail shape → 한글 라벨 ──────────────────────────────────────────────────
const SHAPE_LABEL: Record<string, string> = {
  round: '라운드',
  oval: '오벌',
  square: '스퀘어',
  squoval: '스퀘발',
  almond: '아몬드',
  stiletto: '스틸레토',
  coffin: '코핀',
};

// ── Off type → 한글 라벨 ────────────────────────────────────────────────────
const OFF_LABEL_SHORT: Record<string, string> = {
  same_shop: '자샵 오프',
  other_shop: '타샵 오프',
};

// ── Extension type → 한글 라벨 ──────────────────────────────────────────────
const EXTENSION_LABEL_SHORT: Record<string, string> = {
  none: '',
  natural: '내추럴 연장',
  short: '쇼트 연장',
  medium: '미디엄 연장',
  long: '롱 연장',
};

// ── Expression → English hashtag ────────────────────────────────────────────
const EXPRESSION_HASHTAG: Record<string, string> = {
  solid: '#Clean',
  gradient: '#Gradient',
  french: '#French',
  magnetic: '#CatEye',
};

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
  '9:16': { width: 1080, height: 1920, photoPercent: 58 },
  '3:4':  { width: 1080, height: 1440, photoPercent: 50 },
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
  shopId?: string;
  createdAt?: string;
}

export function ShareCardImageTemplate({
  imageUrl,
  consultation,
  shopName,
  ratio,
  templateRef,
  shopId,
  createdAt,
}: ShareCardImageTemplateProps): React.ReactElement {
  const config = RATIO_CONFIG[ratio];
  const infoPercent = 100 - config.photoPercent;
  const designLabel = getDesignLabel(consultation.designScope);
  const bodyLabel = BODY_PART_LABEL[consultation.bodyPart] ?? consultation.bodyPart;
  const expressionLabels = (consultation.expressions ?? [])
    .map((e) => EXPRESSION_LABEL[e] ?? e)
    .filter(Boolean);

  const moodTitle = MOOD_TITLE[consultation.designScope] ?? 'Nail Design';
  const hashtag = SCOPE_HASHTAG[consultation.designScope] ?? '#Nail';

  // ── TREATMENT 섹션용 시술 정보 수집 ────────────────────────────────────────
  const shapeLabel = consultation.nailShape ? SHAPE_LABEL[consultation.nailShape] : null;
  const offLabel = OFF_LABEL_SHORT[consultation.offType] ?? null;
  const extensionLabel = consultation.extensionType
    ? EXTENSION_LABEL_SHORT[consultation.extensionType] ?? null
    : null;
  const partsCount = (consultation.partsSelections ?? []).reduce(
    (sum, p) => sum + (p.quantity ?? 0),
    0,
  );
  const extraColorCount = consultation.extraColorCount ?? 0;
  const repairCount = consultation.repairCount ?? 0;

  // 2열 좌/우로 나눠서 밀도 있는 레이아웃 구성
  const treatmentRows: Array<{ label: string; value: string }> = [];
  if (shapeLabel) treatmentRows.push({ label: 'SHAPE', value: shapeLabel });
  if (offLabel) treatmentRows.push({ label: 'OFF', value: offLabel });
  if (extensionLabel) treatmentRows.push({ label: 'EXTENSION', value: extensionLabel });
  if (partsCount > 0) treatmentRows.push({ label: 'PARTS', value: `${partsCount}개` });
  if (extraColorCount > 0) treatmentRows.push({ label: 'COLOR', value: `+${extraColorCount}` });
  if (repairCount > 0) treatmentRows.push({ label: 'REPAIR', value: `${repairCount}개` });

  const dateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('en-CA').replace(/-/g, '.')
    : new Date().toLocaleDateString('en-CA').replace(/-/g, '.');

  // QR code generation
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!shopId) return;
    const url = `https://beauty-decision.com/pre-consult/${shopId}`;
    QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: { dark: '#191F28', light: '#FAF8F500' },
      errorCorrectionLevel: 'M',
    })
      .then(setQrDataUrl)
      .catch(() => { /* QR generation failed — skip */ });
  }, [shopId]);

  // Expression hashtags for overlay (English)
  const exprHashtags = (consultation.expressions ?? [])
    .map((e) => EXPRESSION_HASHTAG[e])
    .filter(Boolean);
  const allHashtags = [hashtag, ...exprHashtags].slice(0, 4);

  return (
    <div
      ref={templateRef}
      style={{
        width: config.width,
        height: config.height,
        position: 'relative',
        overflow: 'hidden',
        background: '#FAF8F5',
        flexShrink: 0,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 상단: 시술 사진 */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${config.photoPercent}%` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

        {/* Gradient overlay at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
          background: 'linear-gradient(to bottom, rgba(250,248,245,0) 0%, rgba(250,248,245,1) 100%)',
        }} />

        {/* Top-left: CURATED VIBES tag */}
        <div style={{
          position: 'absolute', top: 36, left: 36,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <span style={{
            display: 'inline-flex', padding: '10px 20px', borderRadius: 999,
            fontSize: 24, fontWeight: 800, letterSpacing: '0.12em',
            background: 'rgba(0,0,0,0.6)', color: '#FFFFFF',
            textTransform: 'uppercase' as const,
          }}>
            CURATED VIBES
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {allHashtags.map((tag, i) => (
              <span key={i} style={{
                display: 'inline-flex', padding: '6px 14px', borderRadius: 999,
                fontSize: 22, fontWeight: 600,
                background: 'rgba(255,255,255,0.85)', color: '#191F28',
              }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 하단: 정보 패널 */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        height: `${infoPercent}%`, background: '#FAF8F5',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '16px 36px 28px',
      }}>
        {/* Upper section: Design info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* DAILY MOOD label with accent line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 28, height: 2, background: '#F43F5E', borderRadius: 2,
            }} />
            <span style={{
              fontSize: 20, fontWeight: 700, letterSpacing: '0.18em',
              color: '#F43F5E', textTransform: 'uppercase' as const,
            }}>
              DAILY MOOD
            </span>
          </div>

          {/* Mood title (English, display) */}
          <span style={{
            fontSize: 68, fontWeight: 900, color: '#191F28',
            lineHeight: 1.02, letterSpacing: '-0.035em',
          }}>
            {moodTitle}
          </span>

          {/* Design label (Korean subtitle) */}
          <span style={{
            fontSize: 32, fontWeight: 600, color: '#6B7280',
            lineHeight: 1.25, letterSpacing: '-0.015em',
          }}>
            {designLabel}
          </span>

          {/* Body part + expression badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <span style={{
              display: 'inline-flex', padding: '8px 18px', borderRadius: 999,
              fontSize: 24, fontWeight: 700, background: '#FFF1F2', color: '#F43F5E',
              letterSpacing: '-0.01em',
            }}>
              {bodyLabel}
            </span>
            {expressionLabels.map((label, i) => (
              <span key={i} style={{
                display: 'inline-flex', padding: '8px 18px', borderRadius: 999,
                fontSize: 22, fontWeight: 600, background: '#F0EDE8', color: '#6B7280',
                letterSpacing: '-0.01em',
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Middle: TREATMENT DETAILS — 실제 시술 정보 */}
        {treatmentRows.length > 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 14,
            padding: '20px 24px',
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1px solid #EEE8E0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 4, height: 18, borderRadius: 2, background: '#F43F5E',
              }} />
              <span style={{
                fontSize: 20, fontWeight: 700, letterSpacing: '0.18em',
                color: '#6B7280', textTransform: 'uppercase' as const,
              }}>
                TREATMENT
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: 32,
              rowGap: 10,
            }}>
              {treatmentRows.map((row, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                  gap: 12,
                  borderBottom: '1px dashed #EEE8E0',
                  paddingBottom: 8,
                }}>
                  <span style={{
                    fontSize: 18, fontWeight: 700, letterSpacing: '0.12em',
                    color: '#B0A8A0', textTransform: 'uppercase' as const,
                  }}>
                    {row.label}
                  </span>
                  <span style={{
                    fontSize: 26, fontWeight: 700, color: '#191F28',
                    letterSpacing: '-0.01em',
                  }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom: Shop name + Date + QR + BDX logo */}
        <div style={{
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          paddingTop: 18, borderTop: '1px solid #EEE8E0',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Shop name */}
            <span style={{
              fontSize: 44, fontWeight: 900, color: '#191F28',
              letterSpacing: '-0.02em', lineHeight: 1.1,
            }}>
              {shopName}
            </span>
            {/* Date */}
            <span style={{
              fontSize: 20, fontWeight: 600, letterSpacing: '0.1em', color: '#9CA3AF',
              fontVariantNumeric: 'tabular-nums' as const,
            }}>
              {dateStr}
            </span>
            {/* BDX branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <BdxLogo size={32} />
              <span style={{
                fontSize: 16, letterSpacing: '0.08em', color: '#B0A8A0',
                fontWeight: 700, textTransform: 'uppercase' as const,
              }}>
                Beauty Decision eXperience
              </span>
            </div>
          </div>

          {/* QR Code — 링크 안내 */}
          {qrDataUrl && (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              padding: 12, borderRadius: 14, background: '#FFFFFF',
              border: '1px solid #EEE8E0',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="QR" style={{ width: 96, height: 96, display: 'block' }} />
              <span style={{
                fontSize: 13, fontWeight: 700, color: '#191F28',
                letterSpacing: '0.14em', textTransform: 'uppercase' as const,
              }}>
                예약하기
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
