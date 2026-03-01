'use client';

import { use, useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatPrice, formatRelativeDate, formatDateDot } from '@/lib/format';
import { BODY_PART_LABEL } from '@/lib/labels';
import { getMockCustomerById, MOCK_CUSTOMERS } from '@/data/mock-customers';
import { TAG_PRESETS } from '@/data/tag-presets';
import type { TagCategory } from '@/types/customer';
import { PreferenceEditor } from '@/components/customer/PreferenceEditor';
import {
  IconShape,
  IconRuler,
  IconLayers,
  IconHands,
  IconHealth,
  IconNote,
  IconCamera,
  IconStar,
  IconCalendar,
  IconWon,
} from '@/components/icons';

const CUTILE_LABEL: Record<string, string> = {
  normal: '보통',
  sensitive: '민감',
};


const TAG_CATEGORY_BADGE: Record<TagCategory, 'primary' | 'neutral' | 'success' | 'warning'> = {
  design: 'primary',
  shape: 'neutral',
  length: 'neutral',
  expression: 'neutral',
  parts: 'success',
  color: 'warning',
  etc: 'neutral',
};

// Design type icon mapping for timeline
const DESIGN_SCOPE_ICON: Record<string, string> = {
  원컬러: '●',
  풀아트: '★',
  그라데이션: '◑',
  프렌치: '◻',
  포인트: '◆',
};

interface UploadedImage {
  url: string;
  name: string;
  addedAt: string;
}

function CustomerDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromChecklist = searchParams.get('fromChecklist') === 'true';
  const customer = getMockCustomerById(id);
  const [isVip, setIsVip] = useState(() => getMockCustomerById(id)?.isRegular ?? false);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [galleryTab, setGalleryTab] = useState<'consult' | 'treatment'>('treatment');
  const [treatmentUploads, setTreatmentUploads] = useState<UploadedImage[]>([]);
  const [consultUploads, setConsultUploads] = useState<UploadedImage[]>([]);
  const treatmentFileRef = useRef<HTMLInputElement>(null);
  const consultFileRef = useRef<HTMLInputElement>(null);
  const [prefData, setPrefData] = useState(() => {
    const p = getMockCustomerById(id)?.preference;
    return {
      shape: p?.preferredShape ?? '',
      length: p?.preferredLength ?? '',
      thickness: p?.preferredThickness ?? '',
      cuticle: p?.cuticleSensitivity ?? '',
      nailCondition: p?.nailCondition ?? '',
      memo: p?.memo ?? '',
    };
  });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, tab: 'treatment' | 'consult') => {
      const files = e.target.files;
      if (!files) return;
      const today = new Date().toISOString().slice(0, 10);
      Array.from(files).forEach((file) => {
        const url = URL.createObjectURL(file);
        const img: UploadedImage = { url, name: file.name, addedAt: today };
        if (tab === 'treatment') {
          setTreatmentUploads((prev) => [img, ...prev]);
        } else {
          setConsultUploads((prev) => [img, ...prev]);
        }
      });
      e.target.value = '';
    },
    [],
  );

  const removeUpload = useCallback((url: string, tab: 'treatment' | 'consult') => {
    URL.revokeObjectURL(url);
    if (tab === 'treatment') {
      setTreatmentUploads((prev) => prev.filter((img) => img.url !== url));
    } else {
      setConsultUploads((prev) => prev.filter((img) => img.url !== url));
    }
  }, []);

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <p className="text-lg font-semibold text-text">고객을 찾을 수 없습니다</p>
        <Button className="mt-4" onClick={() => router.back()}>
          뒤로 가기
        </Button>
      </div>
    );
  }

  const pref = customer.preference;

  // 태그를 카테고리별로 분류
  const tagsByCategory: Partial<Record<TagCategory, string[]>> = {};
  for (const tag of customer.tags) {
    if (!tagsByCategory[tag.category]) tagsByCategory[tag.category] = [];
    tagsByCategory[tag.category]!.push(tag.value);
  }

  const registeredPresets = TAG_PRESETS.filter(
    (preset) => (tagsByCategory[preset.category] ?? []).length > 0,
  );


  return (
    <div className="flex flex-col gap-6 pb-8 overflow-y-auto md:px-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-text-secondary"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text">고객 상세</h1>
      </div>

      {/* ─────────────────────────────── */}
      {/* 1. 기본 정보 카드 */}
      {/* ─────────────────────────────── */}
      <Card className="mx-4 shadow-md rounded-2xl">
        {/* 프로필 상단 */}
        <div className="flex items-start gap-4">
          {/* 큰 아바타 */}
          <div
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
          >
            {customer.name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-text">{customer.name}</h2>
                  {/* VIP 토글 버튼 */}
                  <button
                    onClick={() => {
                      const newVal = !isVip;
                      setIsVip(newVal);
                      const idx = MOCK_CUSTOMERS.findIndex((c) => c.id === id);
                      if (idx !== -1) {
                        MOCK_CUSTOMERS[idx] = { ...MOCK_CUSTOMERS[idx], isRegular: newVal };
                      }
                    }}
                    className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold transition-all active:scale-95"
                    style={
                      isVip
                        ? { background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }
                        : { background: 'var(--color-surface-alt)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }
                    }
                  >
                    <IconStar className="h-3 w-3" />
                    {isVip ? '단골' : '단골 아님'}
                  </button>
                </div>
                <p className="text-sm text-text-secondary">{customer.phone}</p>
              </div>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              담당: {customer.assignedDesignerName}
            </p>
          </div>
        </div>

        {/* 구분선 */}
        <div className="my-4 h-px" style={{ background: 'var(--color-border)' }} />

        {/* 시각적 스탯 카드 */}
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {/* 방문 횟수 */}
          <div
            className="flex flex-col items-center gap-1 rounded-2xl p-3 border"
            style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-border)' }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'var(--color-primary)' }}
            >
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <p className="text-base font-bold mt-0.5" style={{ color: 'var(--color-text)' }}>
              {customer.visitCount}<span className="text-xs font-normal text-text-muted">회</span>
            </p>
            <p className="text-xs text-text-muted">총 방문</p>
          </div>

          {/* 평균 금액 */}
          <div
            className="flex flex-col items-center gap-1 rounded-2xl p-3 border"
            style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-border)' }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'var(--color-primary)' }}
            >
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <p className="text-sm font-bold text-text mt-0.5">{formatPrice(customer.averageSpend)}</p>
            <p className="text-xs text-text-muted">평균 단가</p>
          </div>

          {/* 최근 방문 */}
          <div
            className="flex flex-col items-center gap-1 rounded-2xl p-3 border"
            style={{ background: 'var(--color-primary-light)', borderColor: 'var(--color-border)' }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: 'var(--color-primary)' }}
            >
              <IconCalendar className="h-4 w-4 text-white" />
            </div>
            <p className="text-xs font-bold text-text mt-0.5 text-center leading-tight">{formatRelativeDate(customer.lastVisitDate)}</p>
            <p className="text-xs text-text-muted">최근 방문</p>
          </div>
        </div>

        {/* 총 이용금액 배너 */}
        <div
          className="mt-3 flex items-center justify-between rounded-2xl px-4 py-3"
          style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-white opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <span className="text-xs font-medium text-white opacity-80">총 이용금액</span>
          </div>
          <span className="text-base font-bold text-white">{formatPrice(customer.totalSpend)}</span>
        </div>
      </Card>

      {/* ─────────────────────────────── */}
      {/* 2. 선호도 프로필 */}
      {/* ─────────────────────────────── */}
      <div className="mx-4 shadow-md rounded-2xl">
        <PreferenceEditor
          customerId={id}
          preference={prefData}
          initialEditing={fromChecklist}
          onSave={(updated) => {
            setPrefData(updated);
            // in-memory mock 업데이트
            const idx = MOCK_CUSTOMERS.findIndex((c) => c.id === id);
            if (idx !== -1 && MOCK_CUSTOMERS[idx].preference) {
              MOCK_CUSTOMERS[idx] = {
                ...MOCK_CUSTOMERS[idx],
                preference: {
                  ...MOCK_CUSTOMERS[idx].preference!,
                  preferredShape: updated.shape,
                  preferredLength: updated.length,
                  preferredThickness: updated.thickness,
                  cuticleSensitivity: (updated.cuticle as 'normal' | 'sensitive') || undefined,
                  nailCondition: updated.nailCondition,
                  memo: updated.memo,
                  updatedAt: new Date().toISOString(),
                },
              };
            }
          }}
        />
      </div>

      {/* ─────────────────────────────── */}
      {/* 3. 이미지 갤러리 (real upload) */}
      {/* ─────────────────────────────── */}
      <Card className="mx-4 shadow-md rounded-2xl">
        {/* 섹션 헤더 + 업로드 버튼 */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary">이미지 갤러리</h2>
          <button
            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
            style={{ borderStyle: 'dashed', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            onClick={() => {
              if (galleryTab === 'treatment') treatmentFileRef.current?.click();
              else consultFileRef.current?.click();
            }}
          >
            <IconCamera className="h-3.5 w-3.5" />
            <span>사진 추가</span>
          </button>
          {/* hidden file inputs */}
          <input
            ref={treatmentFileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e, 'treatment')}
          />
          <input
            ref={consultFileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileChange(e, 'consult')}
          />
        </div>

        {/* 탭 */}
        <div className="mb-4 flex gap-1 rounded-xl bg-surface-alt p-1">
          <button
            onClick={() => setGalleryTab('treatment')}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all',
              galleryTab === 'treatment'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted',
            )}
          >
            시술 기록
          </button>
          <button
            onClick={() => setGalleryTab('consult')}
            className={cn(
              'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all',
              galleryTab === 'consult'
                ? 'bg-surface text-text shadow-sm'
                : 'text-text-muted',
            )}
          >
            상담 기록
          </button>
        </div>

        {/* ── 시술 기록 탭 ── */}
        {galleryTab === 'treatment' && (
          <div className="flex flex-col gap-5">
            {treatmentUploads.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-xs font-medium text-text-muted">오늘</p>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
                  >
                    내가 추가한 사진
                  </span>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {treatmentUploads.map((img) => (
                    <div key={img.url} className="relative aspect-square group">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="h-full w-full rounded-xl object-cover shadow-sm"
                      />
                      <button
                        onClick={() => removeUpload(img.url, 'treatment')}
                        className="absolute -top-1 -right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-error text-white text-xs shadow-md"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => treatmentFileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-primary hover:bg-primary/5"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <IconCamera className="h-4 w-4 text-text-muted" />
                    <span className="text-[9px] text-text-muted leading-tight">추가</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => treatmentFileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 transition-colors hover:border-primary hover:bg-primary/5"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span className="text-3xl">📷</span>
                <p className="text-sm font-medium text-text-muted">사진을 추가해보세요</p>
              </button>
            )}
          </div>
        )}

        {/* ── 상담 기록 탭 ── */}
        {galleryTab === 'consult' && (
          <div className="flex flex-col gap-5">
            {consultUploads.length > 0 ? (
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-xs font-medium text-text-muted">오늘</p>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, var(--color-surface))', color: 'var(--color-accent)' }}
                  >
                    내가 추가한 사진
                  </span>
                </div>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {consultUploads.map((img) => (
                    <div key={img.url} className="relative aspect-square group">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="h-full w-full rounded-xl object-cover shadow-sm"
                      />
                      <button
                        onClick={() => removeUpload(img.url, 'consult')}
                        className="absolute -top-1 -right-1 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-error text-white text-xs shadow-md"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => consultFileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-accent hover:bg-accent/5"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <IconCamera className="h-4 w-4 text-text-muted" />
                    <span className="text-[9px] text-text-muted leading-tight">추가</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => consultFileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 transition-colors hover:border-accent hover:bg-accent/5"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <span className="text-3xl">📷</span>
                <p className="text-sm font-medium text-text-muted">사진을 추가해보세요</p>
              </button>
            )}
          </div>
        )}
      </Card>

      {/* ─────────────────────────────── */}
      {/* 4. 시술 이력 타임라인 */}
      {/* ─────────────────────────────── */}
      <Card className="mx-4 shadow-md rounded-2xl">
        <h2 className="mb-4 text-sm font-semibold text-text-secondary">시술 이력</h2>
        <div className="relative flex flex-col gap-0">
          {customer.treatmentHistory.map((hist, idx) => {
            const scopeIcon = DESIGN_SCOPE_ICON[hist.designScope] ?? '●';
            return (
              <div key={hist.recordId} className="relative flex gap-3 pb-5 last:pb-0">
                {/* 타임라인 라인 */}
                {idx < customer.treatmentHistory.length - 1 && (
                  <div
                    className="absolute left-3 top-6 h-full w-0.5"
                    style={{ background: 'var(--color-border)' }}
                  />
                )}

                {/* 도트 — design type icon */}
                <div
                  className="relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold border-2"
                  style={{
                    borderColor: 'var(--color-primary)',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary-dark)',
                  }}
                >
                  {scopeIcon}
                </div>

                {/* 내용 */}
                <div
                  className="flex-1 min-w-0 rounded-2xl border p-3"
                  style={{
                    background: 'var(--color-surface-alt)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-text-muted">
                      {formatDateDot(hist.date)}
                    </p>
                    <span
                      className="text-base font-bold"
                      style={{ color: 'var(--color-primary-dark)' }}
                    >
                      {formatPrice(hist.price)}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="neutral" size="sm">{BODY_PART_LABEL[hist.bodyPart] ?? hist.bodyPart}</Badge>
                    <Badge variant="primary" size="sm">{hist.designScope}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-text-secondary">담당: {hist.designerName}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─────────────────────────────── */}
      {/* 5. 시술 성향 태그 */}
      {/* ─────────────────────────────── */}
      {registeredPresets.length > 0 && (
        <Card className="mx-4 shadow-md rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-secondary">시술 성향 태그</h2>
            <button className="text-xs text-primary">편집</button>
          </div>
          {/* 카테고리별 그룹 표시 */}
          <div className="flex flex-col gap-3">
            {registeredPresets.map((preset) => {
              const tagsForCategory = tagsByCategory[preset.category] ?? [];
              if (tagsForCategory.length === 0) return null;
              return (
                <div key={preset.category}>
                  <p
                    className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {preset.categoryLabel}
                  </p>
                  <div
                    className={cn(
                      'flex flex-wrap gap-1.5 overflow-hidden transition-all duration-300',
                      tagsExpanded ? 'max-h-none' : 'max-h-20',
                    )}
                  >
                    {tagsForCategory.map((val) => (
                      <Badge
                        key={`${preset.category}-${val}`}
                        variant={TAG_CATEGORY_BADGE[preset.category]}
                        size="sm"
                        className="px-3 py-1 text-xs"
                      >
                        {val}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {registeredPresets.length > 2 && (
            <button
              onClick={() => setTagsExpanded((prev) => !prev)}
              className="mt-3 text-xs font-medium text-primary"
            >
              {tagsExpanded ? '접기' : '더보기'}
            </button>
          )}
        </Card>
      )}

      {/* ─────────────────────────────── */}
      {/* 6. 스몰토크 기록 */}
      {/* ─────────────────────────────── */}
      <Card className="mx-4 shadow-md rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary">스몰토크 기록</h2>
          <button
            className="rounded-xl border px-3 py-1 text-xs font-medium transition-colors hover:bg-primary hover:text-white"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
          >
            + 추가
          </button>
        </div>
        {customer.smallTalkNotes.length === 0 ? (
          <p className="text-sm text-text-muted">기록이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-3">
            {[...customer.smallTalkNotes]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              )
              .map((note) => (
                <div
                  key={note.id}
                  className="relative rounded-2xl p-4"
                  style={{
                    background: 'var(--color-surface-alt)',
                    borderLeft: '3px solid var(--color-primary)',
                  }}
                >
                  {/* 말풍선 꼬리 */}
                  <div
                    className="absolute -left-[7px] top-4 h-3 w-3 rotate-45"
                    style={{ background: 'var(--color-surface-alt)' }}
                  />
                  <p className="mb-1.5 text-xs font-medium text-text-muted">
                    {formatDateDot(note.createdAt)} · {note.createdByDesignerName}
                  </p>
                  <p className="text-sm text-text leading-relaxed">{note.noteText}</p>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* 구분선 */}
      <div className="mx-4 h-px" style={{ background: 'var(--color-border)' }} />

      {/* 상담 기록으로 이동 */}
      <div className="px-4">
        <Button
          variant="secondary"
          fullWidth
          onClick={() => router.push('/records')}
        >
          상담 기록 보기
        </Button>
      </div>
    </div>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: Props) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <CustomerDetailContent id={id} />
    </Suspense>
  );
}
