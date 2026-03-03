'use client';

import { use, useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Badge, Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatPrice, formatRelativeDate, formatDateDot } from '@/lib/format';
import { BODY_PART_LABEL } from '@/lib/labels';
import { getMockCustomerById, MOCK_CUSTOMERS } from '@/data/mock-customers';
import { MOCK_DESIGNERS } from '@/data/mock-shop';
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
  const [vipToast, setVipToast] = useState<string | null>(null);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [localTags, setLocalTags] = useState(customer?.tags ?? []);
  const [newTagValue, setNewTagValue] = useState('');
  const [showSmallTalkInput, setShowSmallTalkInput] = useState(false);
  const [newSmallTalk, setNewSmallTalk] = useState('');
  const [localSmallTalkNotes, setLocalSmallTalkNotes] = useState(customer?.smallTalkNotes ?? []);
  const [galleryTab, setGalleryTab] = useState<'consult' | 'treatment'>('treatment');
  const [showDesignerPicker, setShowDesignerPicker] = useState(false);
  const [assignedDesigner, setAssignedDesigner] = useState(customer?.assignedDesignerName ?? '');
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

  const handleVipToggle = () => {
    const newVal = !isVip;
    setIsVip(newVal);
    const idx = MOCK_CUSTOMERS.findIndex((c) => c.id === id);
    if (idx !== -1) {
      MOCK_CUSTOMERS[idx] = { ...MOCK_CUSTOMERS[idx], isRegular: newVal };
    }
    navigator.vibrate?.(50);
    setVipToast(newVal ? 'VIP 지정됨' : 'VIP 해제됨');
    setTimeout(() => setVipToast(null), 2000);
  };

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

  // 태그를 카테고리별로 분류 (localTags 기반)
  const tagsByCategory: Partial<Record<TagCategory, string[]>> = {};
  for (const tag of localTags) {
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
      <div className="mx-4 relative">
        <AnimatePresence>
          {vipToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-x-0 top-0 z-10 flex items-center justify-center rounded-t-2xl py-2 text-sm font-bold text-white"
              style={{ background: isVip ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
            >
              {vipToast}
            </motion.div>
          )}
        </AnimatePresence>
        <Card className="shadow-md rounded-2xl">
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
                    type="button"
                    onClick={handleVipToggle}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200',
                      isVip
                        ? 'bg-primary/15 text-primary'
                        : 'bg-surface-alt text-text-muted hover:bg-primary/10 hover:text-primary'
                    )}
                    aria-label={isVip ? 'VIP 해제' : 'VIP 지정'}
                  >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={isVip ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                    단골
                  </button>
                </div>
                <p className="text-sm text-text-secondary">{customer.phone}</p>
              </div>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <p className="text-sm text-text-secondary">
                담당: {assignedDesigner}
              </p>
              <button
                onClick={() => setShowDesignerPicker((v) => !v)}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                변경
              </button>
            </div>
            {showDesignerPicker && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {MOCK_DESIGNERS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setAssignedDesigner(d.name);
                      const idx = MOCK_CUSTOMERS.findIndex((c) => c.id === id);
                      if (idx !== -1) {
                        MOCK_CUSTOMERS[idx] = { ...MOCK_CUSTOMERS[idx], assignedDesignerName: d.name, assignedDesignerId: d.id };
                      }
                      setShowDesignerPicker(false);
                    }}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                    style={{
                      background: assignedDesigner === d.name ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                      color: assignedDesigner === d.name ? 'white' : 'var(--color-text-secondary)',
                      border: `1px solid ${assignedDesigner === d.name ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    }}
                  >
                    {d.name} {d.role === 'owner' ? '원장' : '선생님'}
                  </button>
                ))}
              </div>
            )}
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
      </div>

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
            <button
              className="text-xs text-primary"
              onClick={() => setEditingTags((prev) => !prev)}
            >
              {editingTags ? '완료' : '편집'}
            </button>
          </div>
          {/* 카테고리별 그룹 표시 */}
          <div className="flex flex-col gap-3">
            {registeredPresets.map((preset) => {
              const tagsForCategory = tagsByCategory[preset.category] ?? [];
              if (tagsForCategory.length === 0 && !editingTags) return null;
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
                      tagsExpanded || editingTags ? 'max-h-none' : 'max-h-20',
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
                        {editingTags && (
                          <button
                            className="ml-1 text-[10px] opacity-60 hover:opacity-100"
                            onClick={() => setLocalTags((prev) =>
                              prev.filter((t) => !(t.category === preset.category && t.value === val))
                            )}
                          >
                            ✕
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {editingTags && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
                placeholder="새 태그 입력"
                className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTagValue.trim()) {
                    setLocalTags((prev) => [...prev, {
                      id: `t-${Date.now()}`,
                      customerId: customer.id,
                      category: 'etc' as TagCategory,
                      value: newTagValue.trim(),
                      isCustom: true,
                      createdAt: new Date().toISOString(),
                    }]);
                    setNewTagValue('');
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newTagValue.trim()) {
                    setLocalTags((prev) => [...prev, {
                      id: `t-${Date.now()}`,
                      customerId: customer.id,
                      category: 'etc' as TagCategory,
                      value: newTagValue.trim(),
                      isCustom: true,
                      createdAt: new Date().toISOString(),
                    }]);
                    setNewTagValue('');
                  }
                }}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white"
              >
                추가
              </button>
            </div>
          )}
          {registeredPresets.length > 2 && !editingTags && (
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
          <h2 className="text-sm font-semibold text-text-secondary">고객 메모</h2>
          <button
            className="rounded-xl border px-3 py-1 text-xs font-medium transition-colors hover:bg-primary hover:text-white"
            style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
            onClick={() => setShowSmallTalkInput((prev) => !prev)}
          >
            {showSmallTalkInput ? '취소' : '+ 추가'}
          </button>
        </div>
        {showSmallTalkInput && (
          <div className="mb-3 flex flex-col gap-2">
            <textarea
              value={newSmallTalk}
              onChange={(e) => setNewSmallTalk(e.target.value)}
              placeholder="고객과의 대화 내용을 기록하세요..."
              className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-text placeholder:text-text-muted resize-none"
              rows={3}
            />
            <button
              onClick={() => {
                if (newSmallTalk.trim()) {
                  setLocalSmallTalkNotes((prev) => [{
                    id: `stn-${Date.now()}`,
                    customerId: customer.id,
                    noteText: newSmallTalk.trim(),
                    createdAt: new Date().toISOString(),
                    createdByDesignerId: 'designer-001',
                    createdByDesignerName: '나',
                  }, ...prev]);
                  setNewSmallTalk('');
                  setShowSmallTalkInput(false);
                }
              }}
              className="self-end rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              저장
            </button>
          </div>
        )}
        {localSmallTalkNotes.length === 0 ? (
          <p className="text-sm text-text-muted">기록이 없습니다</p>
        ) : (
          <div className="flex flex-col gap-3">
            {[...localSmallTalkNotes]
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

      {/* CTA 버튼 */}
      <div className="px-4 flex flex-col gap-2">
        <Button
          variant="primary"
          fullWidth
          onClick={() => router.push(
            `/consultation/customer?name=${encodeURIComponent(customer.name)}&phone=${encodeURIComponent(customer.phone)}&customerId=${customer.id}`
          )}
        >
          이 고객으로 새 상담 시작
        </Button>
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
