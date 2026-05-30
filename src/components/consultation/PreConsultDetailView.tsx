'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PreConsultationData } from '@/types/pre-consultation';

// ── 레이블 상수 (사전상담 표시 SSOT — 모든 원장 화면이 이 컴포넌트를 통해 동일하게 표시) ──
// SSOT 정렬: labels.ts CATEGORY_LABELS 와 동일 표기 (자석 / 마그넷, 심플 / 원컬러)
export const PRE_CATEGORY_LABEL: Record<string, string> = {
  simple: '심플 / 원컬러', french: '프렌치',
  magnet: '자석 / 마그넷', art: '아트',
};
export const PRE_NAIL_STATUS_LABEL: Record<string, string> = { none: '맨손', existing: '기존 젤 있음' };
export const PRE_REMOVAL_LABEL: Record<string, string> = { none: '오프 없음', self_shop: '당샵 오프', other_shop: '타샵 오프' };
export const PRE_LENGTH_PREF_LABEL: Record<string, string> = { keep: '현재 유지', shorten: '짧게', extend: '연장' };
export const PRE_EXTENSION_LEN_LABEL: Record<string, string> = { natural: '자연스러운 길이', medium: '중간', long: '길게' };
export const PRE_SHAPE_LABEL: Record<string, string> = {
  round: '라운드', oval: '오벌', square: '스퀘어', squoval: '스퀘오벌',
  almond: '아몬드', stiletto: '스틸레토', coffin: '코핀',
};
export const PRE_WRAPPING_LABEL: Record<string, string> = { yes: '랩핑 원함', no: '랩핑 불필요' };
export const PRE_FEEL_LABEL: Record<string, string> = { natural: '내추럴', french: '프렌치', trendy: '트렌디', fancy: '화려한' };
export const PRE_STYLE_PREF_LABEL: Record<string, string> = { photo_match: '사진과 동일하게', natural_fit: '자연스럽게', clean_subtle: '깔끔하게' };
export const PRE_STYLE_KW_LABEL: Record<string, string> = {
  office_friendly: '오피스 룩', slim_fingers: '손가락 길어보이게',
  tidy_look: '단정한 느낌', subtle_point: '은은한 포인트', more_fancy: '좀 더 화려하게',
};
export const PRE_ADDON_LABEL: Record<string, string> = { stone: '스톤', parts: '파츠', glitter: '글리터', point_art: '포인트 아트', wrapping: '랩핑' };
export const PRE_BODY_PART_LABEL: Record<string, string> = { hand: '손', foot: '발' };

// ── 옵션 ──────────────────────────────────────────────────────────────
export interface PreConsultDetailViewOptions {
  /** SectionCard 카드 배경 강조 여부 — preconsult 전용 페이지는 true, 임베드는 false (기본) */
  elevated?: boolean;
  /** 이미지 라이트박스 활성화 (기본 true) */
  lightbox?: boolean;
  /** 첫 번째 이미지(selectedPhotoUrl)에 '선택' 뱃지 표시 (기본 true) */
  showSelectedBadge?: boolean;
  /** customPartSelections 단가 표시용 (없으면 ×N만 표시) */
  customParts?: Array<{ name: string; pricePerUnit: number }>;
  /** 커스텀 카테고리 이름 resolve (없으면 id 그대로 표시) */
  customCategories?: Array<{ id: string; name: string }>;
  /** builtin 카테고리 사장님 rename override (shopSettings.categoryLabels) */
  categoryLabels?: Record<string, string>;
}

export interface PreConsultDetailViewProps {
  data: PreConsultationData;
  options?: PreConsultDetailViewOptions;
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────
function SectionCard({ title, icon, elevated, children }: {
  title: string; icon?: string; elevated?: boolean; children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className={`rounded-2xl border p-4 flex flex-col gap-2 ${
      elevated ? 'bg-surface border-border' : 'bg-surface-alt border-border/60'
    }`}>
      <h4 className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
        {icon && <span>{icon}</span>}{title}
      </h4>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }): React.ReactElement | null {
  if (!value) return null;
  return (
    <div className="flex justify-between text-xs">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text break-keep">{value}</span>
    </div>
  );
}

function TagChips({ tags, labelMap }: { tags: string[]; labelMap: Record<string, string> }): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span key={tag} className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          {labelMap[tag] ?? tag}
        </span>
      ))}
    </div>
  );
}

/**
 * 사전상담 입력 내용 공용 뷰어 — 손님이 입력한 값만 그대로 표시 (견적/시간 계산 없음).
 * records/preconsult·records/[id]·예약상세 모달·field-mode/treatment 등 모든 원장 화면이 공유.
 */
export function PreConsultDetailView({
  data,
  options = {},
}: PreConsultDetailViewProps): React.ReactElement | null {
  const {
    elevated = false,
    lightbox: enableLightbox = true,
    showSelectedBadge = true,
    customParts,
    customCategories,
    categoryLabels,
  } = options;

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // 이미지 목록 조합: selectedPhotoUrl을 첫 번째로
  const baseImages = data.referenceImageUrls?.length ? data.referenceImageUrls : [];
  const images = data.selectedPhotoUrl && !baseImages.includes(data.selectedPhotoUrl)
    ? [data.selectedPhotoUrl, ...baseImages]
    : [...baseImages];

  const hasAnyData =
    images.length > 0 ||
    data.designCategory ||
    data.nailStatus ||
    data.removalPreference ||
    data.lengthPreference ||
    (data.styleKeyword && data.styleKeyword.length > 0) ||
    ((data.addOns && data.addOns.length > 0) || (data.customPartSelections && Object.keys(data.customPartSelections).length > 0)) ||
    data.additionalRequest;

  if (!hasAnyData) return null;

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* 참고 이미지 */}
        {images.length > 0 && (
          <SectionCard icon="📷" title="참고 이미지" elevated={elevated}>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {images.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => enableLightbox && setLightboxUrl(url)}
                  className="relative h-24 w-24 flex-shrink-0 rounded-xl overflow-hidden border border-border"
                  style={{ cursor: enableLightbox ? 'pointer' : 'default' }}
                >
                  <Image src={url} alt="" fill className="object-cover" unoptimized />
                  {showSelectedBadge && i === 0 && data.selectedPhotoUrl === url && (
                    <span className="absolute bottom-1 left-1 rounded bg-primary/90 px-1.5 py-0.5 text-[8px] font-bold text-white">선택</span>
                  )}
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {/* 디자인 선택 */}
        {(data.bodyPart || data.designCategory || data.designFeel || data.nailShape || data.stylePreference) && (
          <SectionCard icon="💅" title="디자인 선택" elevated={elevated}>
            <InfoRow label="시술 부위" value={data.bodyPart ? (PRE_BODY_PART_LABEL[data.bodyPart] ?? data.bodyPart) : undefined} />
            <InfoRow
              label="시술 종류"
              value={
                data.designCategory
                  ? (categoryLabels?.[data.designCategory] ??
                      customCategories?.find((c) => c.id === data.designCategory)?.name ??
                      PRE_CATEGORY_LABEL[data.designCategory] ??
                      data.designCategory)
                  : undefined
              }
            />
            <InfoRow label="디자인 느낌" value={data.designFeel ? (PRE_FEEL_LABEL[data.designFeel] ?? data.designFeel) : undefined} />
            <InfoRow label="네일 쉐입" value={data.nailShape ? (PRE_SHAPE_LABEL[data.nailShape] ?? data.nailShape) : undefined} />
            <InfoRow label="시술 방향" value={data.stylePreference ? (PRE_STYLE_PREF_LABEL[data.stylePreference] ?? data.stylePreference) : undefined} />
          </SectionCard>
        )}

        {/* 네일 상태 */}
        {(data.nailStatus || (data.removalPreference && data.removalPreference !== 'none') || data.lengthPreference) && (
          <SectionCard icon="✋" title="네일 상태" elevated={elevated}>
            <InfoRow label="현재 상태" value={data.nailStatus ? (PRE_NAIL_STATUS_LABEL[data.nailStatus] ?? data.nailStatus) : undefined} />
            {data.removalPreference && data.removalPreference !== 'none' && (
              <InfoRow label="오프" value={PRE_REMOVAL_LABEL[data.removalPreference] ?? data.removalPreference} />
            )}
            <InfoRow label="길이 선호" value={data.lengthPreference ? (PRE_LENGTH_PREF_LABEL[data.lengthPreference] ?? data.lengthPreference) : undefined} />
            {data.extensionLength && data.lengthPreference === 'extend' && (
              <InfoRow label="연장 길이" value={PRE_EXTENSION_LEN_LABEL[data.extensionLength] ?? data.extensionLength} />
            )}
            <InfoRow label="랩핑" value={data.wrappingPreference ? (PRE_WRAPPING_LABEL[data.wrappingPreference] ?? data.wrappingPreference) : undefined} />
          </SectionCard>
        )}

        {/* 스타일 키워드 */}
        {data.styleKeyword && data.styleKeyword.length > 0 && (
          <SectionCard icon="✨" title="스타일 키워드" elevated={elevated}>
            <TagChips tags={data.styleKeyword} labelMap={PRE_STYLE_KW_LABEL} />
          </SectionCard>
        )}

        {/* 추가 옵션 */}
        {((data.addOns && data.addOns.length > 0) ||
          (data.customPartSelections && Object.keys(data.customPartSelections).length > 0)) && (
          <SectionCard icon="💎" title="추가 옵션" elevated={elevated}>
            {data.addOns && data.addOns.length > 0 && (
              <TagChips tags={data.addOns} labelMap={PRE_ADDON_LABEL} />
            )}
            {data.customPartSelections && Object.keys(data.customPartSelections).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {Object.entries(data.customPartSelections).map(([name, count]) => {
                  const part = customParts?.find((p) => p.name === name);
                  const total = part ? part.pricePerUnit * count : 0;
                  return (
                    <span key={name} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/30 px-2.5 py-1 text-xs font-semibold text-primary">
                      {name} ×{count}
                      {total > 0 && <span className="font-normal text-primary/70">+₩{total.toLocaleString()}</span>}
                    </span>
                  );
                })}
              </div>
            )}
          </SectionCard>
        )}

        {/* 손님 요청사항 */}
        {data.additionalRequest && data.additionalRequest.trim() && (
          <SectionCard icon="💬" title="손님 요청사항" elevated={elevated}>
            <div className="rounded-xl bg-background p-3">
              <p className="text-xs text-text whitespace-pre-line break-keep">{data.additionalRequest}</p>
            </div>
          </SectionCard>
        )}
      </div>

      {/* 라이트박스 */}
      <AnimatePresence>
        {lightboxUrl && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80" onClick={() => setLightboxUrl(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.88 }}
              className="fixed inset-4 z-50 flex items-center justify-center" onClick={() => setLightboxUrl(null)}>
              <Image src={lightboxUrl} alt="" width={600} height={600}
                className="max-h-[80dvh] w-auto rounded-2xl object-contain" unoptimized />
              <button onClick={() => setLightboxUrl(null)}
                className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
