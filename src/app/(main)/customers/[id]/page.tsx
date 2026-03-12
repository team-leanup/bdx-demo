'use client';

import { use, useState, useRef, useCallback, Suspense, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { CustomerTagChip } from '@/components/customer/CustomerTagChip';
import { Card, Badge, Button, ToastContainer, Modal } from '@/components/ui';
import { SafetyTag } from '@/components/ui/SafetyTag';
import { FlagIcon } from '@/components/ui/FlagIcon';
import type { ToastData } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatPrice, formatRelativeDate, formatDateDot, getNowInKoreaIso } from '@/lib/format';
import {
  CUSTOMER_TAG_ACCENTS,
  getCustomerTagDotClasses,
  resolveCustomerTagAccent,
} from '@/lib/customer-tags';
import { BODY_PART_LABEL } from '@/lib/labels';
import { TAG_PRESETS } from '@/data/tag-presets';
import { useShopStore } from '@/store/shop-store';
import type { CustomerTag, TagCategory } from '@/types/customer';
import { PreferenceEditor } from '@/components/customer/PreferenceEditor';
import { useCustomerStore } from '@/store/customer-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAuthStore } from '@/store/auth-store';
import { useReservationStore } from '@/store/reservation-store';
import { useConsultationStore } from '@/store/consultation-store';
import { resizePortfolioImage } from '@/lib/image-utils';
import type { PortfolioPhotoKind } from '@/types/portfolio';
import { ConsultationStep } from '@/types/consultation';
import { getSafetyTagMeta } from '@/lib/tag-safety';
import {
  IconCamera,
  IconCalendar,
} from '@/components/icons';

// Design type icon mapping for timeline
const DESIGN_SCOPE_ICON: Record<string, string> = {
  원컬러: '●',
  풀아트: '★',
  그라데이션: '◑',
  프렌치: '◻',
  포인트: '◆',
};

function sortTagsByDisplayOrder(tags: CustomerTag[]): CustomerTag[] {
  return [...tags].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) {
      return a.pinned ? -1 : 1;
    }

    const sortDiff = (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER);
    if (sortDiff !== 0) {
      return sortDiff;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

function resequencePinnedTags(tags: CustomerTag[]): CustomerTag[] {
  const orderedPinnedIds = sortTagsByDisplayOrder(tags)
    .filter((tag) => tag.pinned)
    .map((tag) => tag.id);
  const orderMap = new Map(orderedPinnedIds.map((tagId, index) => [tagId, index]));

  return tags.map((tag) => {
    if (!tag.pinned) {
      return { ...tag, sortOrder: undefined };
    }

    return {
      ...tag,
      sortOrder: orderMap.get(tag.id) ?? 0,
    };
  });
}

function movePinnedTag(tags: CustomerTag[], draggedId: string, targetId: string): CustomerTag[] {
  if (draggedId === targetId) {
    return tags;
  }

  const pinnedTags = sortTagsByDisplayOrder(tags).filter((tag) => tag.pinned);
  const draggedIndex = pinnedTags.findIndex((tag) => tag.id === draggedId);
  const targetIndex = pinnedTags.findIndex((tag) => tag.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1) {
    return tags;
  }

  const nextPinnedTags = [...pinnedTags];
  const [draggedTag] = nextPinnedTags.splice(draggedIndex, 1);
  nextPinnedTags.splice(targetIndex, 0, draggedTag);

  const orderMap = new Map(nextPinnedTags.map((tag, index) => [tag.id, index]));
  return tags.map((tag) => {
    if (!tag.pinned) {
      return tag;
    }

    return {
      ...tag,
      sortOrder: orderMap.get(tag.id) ?? tag.sortOrder,
    };
  });
}

function CustomerDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const hydrateConsultation = useConsultationStore((s) => s.hydrateConsultation);
  const searchParams = useSearchParams();
  const fromChecklist = searchParams.get('fromChecklist') === 'true';
  const customer = useCustomerStore((s) => s.getById(id));
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const updateTagsInStore = useCustomerStore((s) => s.updateTags);
  const appendSmallTalkNote = useCustomerStore((s) => s.appendSmallTalkNote);
  const designers = useShopStore((s) => s.designers);

  const [isVip, setIsVip] = useState(() => useCustomerStore.getState().getById(id)?.isRegular ?? false);
  const [vipToast, setVipToast] = useState<string | null>(null);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [localTags, setLocalTags] = useState(customer?.tags ?? []);
  const [draggedPinnedTagId, setDraggedPinnedTagId] = useState<string | null>(null);
  const [newTagValue, setNewTagValue] = useState('');
  const [showSmallTalkInput, setShowSmallTalkInput] = useState(false);
  const [newSmallTalk, setNewSmallTalk] = useState('');
  const [localSmallTalkNotes, setLocalSmallTalkNotes] = useState(customer?.smallTalkNotes ?? []);
  const [galleryTab, setGalleryTab] = useState<'reference' | 'treatment'>('treatment');
  const [showDesignerPicker, setShowDesignerPicker] = useState(false);
  const [assignedDesigner, setAssignedDesigner] = useState(customer?.assignedDesignerName ?? '');
  const treatmentFileRef = useRef<HTMLInputElement>(null);
  const consultFileRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addPhoto = usePortfolioStore((s) => s.addPhoto);
  const removePhoto = usePortfolioStore((s) => s.removePhoto);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const activeDesignerName = useAuthStore((s) => s.activeDesignerName);
  const getByCustomerId = usePortfolioStore((s) => s.getByCustomerId);
  const reservations = useReservationStore((s) => s.reservations);

  const customerPhotos = getByCustomerId(id);
  const treatmentPhotos = customerPhotos.filter((p) => p.kind === 'treatment');
  const consultPhotos = customerPhotos.filter((p) => p.kind === 'reference');

  // CU-2: 최근 3장 미니 갤러리
  const recentTreatmentPhotos = treatmentPhotos.slice(0, 3);
  const [photoPopupId, setPhotoPopupId] = useState<string | null>(null);

  // CU-3: 태그 아이콘 맵
  const tagIconMap = useMemo(() =>
    TAG_PRESETS.flatMap((p) => p.options).reduce<Record<string, string | undefined>>(
      (acc, opt) => (opt.icon ? { ...acc, [opt.value]: opt.icon } : acc),
      {},
    ),
  [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // CU-4: 외국어 감지
  const detectedLanguage = useMemo(() => {
    if (customer?.preferredLanguage && customer.preferredLanguage !== 'ko') {
      return customer.preferredLanguage;
    }
    const foreignBooking = reservations.find(
      (r) => r.customerId === id && r.language && r.language !== 'ko',
    );
    return foreignBooking?.language ?? undefined;
  }, [customer?.preferredLanguage, reservations, id]);

  const handleDismissToast = useCallback((toastId: string): void => {
    setToasts((current) => current.filter((toast) => toast.id !== toastId));
  }, []);

  const pushToast = useCallback((type: ToastData['type'], message: string): void => {
    setToasts((current) => [...current, { id: `toast-${Date.now()}`, type, message }]);
  }, []);

  const [prefData, setPrefData] = useState(() => {
    const p = useCustomerStore.getState().getById(id)?.preference;
    return {
      shape: p?.preferredShape ?? '',
      length: p?.preferredLength ?? '',
      thickness: p?.preferredThickness ?? '',
      cuticle: p?.cuticleSensitivity ?? '',
      nailCondition: p?.nailCondition ?? '',
      memo: p?.memo ?? '',
    };
  });

  useEffect(() => {
    if (!editingTags) {
      setLocalTags(customer?.tags ?? []);
    }
  }, [customer?.tags, editingTags]);

  const orderedTags = sortTagsByDisplayOrder(localTags);
  const pinnedTags = orderedTags.filter((tag) => tag.pinned);

  const handleVipToggle = () => {
    const newVal = !isVip;
    setIsVip(newVal);
    updateCustomer(id, { isRegular: newVal });
    navigator.vibrate?.(50);
    setVipToast(newVal ? '단골 지정됨' : '단골 해제됨');
    setTimeout(() => setVipToast(null), 2000);
  };

  const handleStartTagEdit = (): void => {
    setLocalTags(customer?.tags ?? []);
    setEditingTags(true);
  };

  const handleCancelTagEdit = (): void => {
    setLocalTags(customer?.tags ?? []);
    setNewTagValue('');
    setDraggedPinnedTagId(null);
    setEditingTags(false);
  };

  const handleSaveTagEdit = (): void => {
    updateTagsInStore(id, resequencePinnedTags(localTags));
    setDraggedPinnedTagId(null);
    setEditingTags(false);
  };

  const handleToggleTagPinned = (tagId: string): void => {
    setLocalTags((prev) => {
      const pinnedCount = prev.filter((tag) => tag.pinned).length;
      return resequencePinnedTags(
        prev.map((tag) => {
          if (tag.id !== tagId) {
            return tag;
          }

          const nextPinned = !tag.pinned;
          return {
            ...tag,
            pinned: nextPinned,
            sortOrder: nextPinned ? pinnedCount : undefined,
          };
        }),
      );
    });
  };

  const handleToggleTagAccent = (tagId: string): void => {
    setLocalTags((prev) =>
      prev.map((tag) => {
        if (tag.id !== tagId) {
          return tag;
        }

        return {
          ...tag,
          accent: tag.accent ? undefined : resolveCustomerTagAccent(tag),
        };
      }),
    );
  };

  const handleSetTagAccent = (tagId: string, accent: CustomerTag['accent']): void => {
    setLocalTags((prev) =>
      prev.map((tag) => (tag.id === tagId ? { ...tag, accent } : tag)),
    );
  };

  const handleRemoveTag = (tagId: string): void => {
    setLocalTags((prev) => resequencePinnedTags(prev.filter((tag) => tag.id !== tagId)));
  };

  const handlePinnedTagDrop = (targetTagId: string): void => {
    if (!draggedPinnedTagId || draggedPinnedTagId === targetTagId) {
      setDraggedPinnedTagId(null);
      return;
    }

    setLocalTags((prev) => movePinnedTag(prev, draggedPinnedTagId, targetTagId));
    setDraggedPinnedTagId(null);
  };

  const handleAppendCustomTag = (): void => {
    const nextValue = newTagValue.trim();
    if (!nextValue) {
      return;
    }

    setLocalTags((prev) => [
      ...prev,
      {
        id: `t-${Date.now()}`,
        customerId: id,
        category: 'etc',
        value: nextValue,
        isCustom: true,
        createdAt: getNowInKoreaIso(),
      },
    ]);
    setNewTagValue('');
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, kind: PortfolioPhotoKind) => {
      const files = e.target.files;
      if (!files) return;
      
      setUploadError(null);
        
        for (const file of Array.from(files)) {
          try {
            const dataUrl = await resizePortfolioImage(file);
            const result = await addPhoto({
              customerId: id,
              kind,
              imageDataUrl: dataUrl,
          });
            
            if (!result.success && result.error) {
              setUploadError(result.error);
              pushToast('error', result.error);
              setTimeout(() => setUploadError(null), 3000);
              break;
            }

            pushToast('success', '포트폴리오 사진을 저장했어요');
          } catch {
            setUploadError('이미지 변환에 실패했습니다');
            pushToast('error', '이미지 변환에 실패했습니다');
            setTimeout(() => setUploadError(null), 3000);
          }
        }
      
      e.target.value = '';
    },
    [id, addPhoto, pushToast],
  );

  const handleRemovePhoto = useCallback(async (photoId: string) => {
    const result = await removePhoto(photoId);
    if (!result.success) {
      pushToast('error', result.error ?? '사진 삭제에 실패했어요');
      return;
    }

    pushToast('success', '사진을 삭제했어요');
  }, [pushToast, removePhoto]);

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
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
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
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-bold text-text">{customer.name}</h2>
                  {/* CU-4: 외국어 고객 플래그 */}
                  {detectedLanguage && (
                    <FlagIcon language={detectedLanguage} size="sm" />
                  )}
                  <button
                    type="button"
                    onClick={handleVipToggle}
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all duration-200',
                      isVip
                        ? 'bg-primary/15 text-primary'
                        : 'bg-surface-alt text-text-muted hover:bg-primary/10 hover:text-primary'
                    )}
                    aria-label={isVip ? '단골 해제' : '단골 지정'}
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
                {designers.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setAssignedDesigner(d.name);
                      updateCustomer(id, { assignedDesignerName: d.name, assignedDesignerId: d.id });
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
            <p className="text-sm font-bold text-text mt-0.5">{customer.averageSpend ? formatPrice(customer.averageSpend) : '–'}</p>
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
          <span className="text-base font-bold text-white">{customer.totalSpend ? formatPrice(customer.totalSpend) : '–'}</span>
        </div>
        </Card>
      </div>

      {/* CU-4: 외국어 고객 번역 이력 버튼 */}
      {detectedLanguage && (
        <div className="mx-4 -mt-2">
          <button
            onClick={() => router.push(`/records?customerId=${id}`)}
            className="flex w-full items-center gap-2 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            <FlagIcon language={detectedLanguage} size="sm" />
            <span>번역된 상담 이력 보기</span>
            <svg className="ml-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* CU-2: 최근 시술 사진 미니 갤러리 */}
      {recentTreatmentPhotos.length > 0 && (
        <div className="mx-4 -mt-2">
          <p className="mb-2 text-xs font-semibold text-text-secondary">최근 시술</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recentTreatmentPhotos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setPhotoPopupId(photo.id)}
                className="relative flex-shrink-0 h-20 w-20 rounded-xl overflow-hidden bg-surface-alt shadow-sm hover:shadow-md transition-shadow"
              >
                <Image
                  src={photo.imageDataUrl}
                  alt="시술 사진"
                  fill
                  unoptimized
                  className="object-cover"
                />
                {photo.takenAt && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/50 px-1.5 py-1">
                    <p className="text-[9px] text-white text-center leading-none">{formatDateDot(photo.takenAt)}</p>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─────────────────────────────── */}
      {/* 1.5 고정 특이사항 (Pinned Traits) */}
      {/* ─────────────────────────────── */}
      <Card className="mx-4 shadow-md rounded-2xl">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">특이사항</h2>
        {pinnedTags.length === 0 ? (
          <p className="text-sm text-text-muted">특이사항 없음</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pinnedTags.map((tag) => {
              const safety = getSafetyTagMeta(tag);
              if (safety.level === 'high' || safety.level === 'medium') {
                return <SafetyTag key={tag.id} tag={tag} size="sm" />;
              }
              return <CustomerTagChip key={tag.id} tag={tag} size="sm" showPin />;
            })}
          </div>
        )}
      </Card>

      {/* ─────────────────────────────── */}
      {/* 5. 시술 성향 태그 */}
      {/* ─────────────────────────────── */}
      <Card className="mx-4 shadow-md rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-text-secondary">시술 성향 태그</h2>
            {editingTags && (
              <p className="mt-1 text-[11px] text-text-muted">
                강조, 색상, 상단 고정, 노출 순서를 한 번에 조정합니다.
              </p>
            )}
          </div>
          {editingTags ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted"
                onClick={handleCancelTagEdit}
              >
                취소
              </button>
              <button
                type="button"
                className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
                onClick={handleSaveTagEdit}
              >
                완료
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="text-xs font-semibold text-primary"
              onClick={handleStartTagEdit}
            >
              편집
            </button>
          )}
        </div>

        {editingTags && (
          <div className="mb-4 rounded-2xl border border-border bg-surface-alt p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold text-text">상단 카드 노출 순서</p>
                <p className="mt-1 text-[11px] text-text-muted">고정한 태그를 드래그해서 홈/예약 카드 우선순서를 정하세요.</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">
                {pinnedTags.length}개 고정
              </span>
            </div>
            {pinnedTags.length === 0 ? (
              <p className="text-xs text-text-muted">아래 태그에서 `상단 고정`을 켜면 이 영역에 추가됩니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pinnedTags.map((tag, index) => (
                  <button
                    key={tag.id}
                    type="button"
                    draggable
                    onDragStart={() => setDraggedPinnedTagId(tag.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handlePinnedTagDrop(tag.id)}
                    onDragEnd={() => setDraggedPinnedTagId(null)}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 text-left transition-shadow',
                      draggedPinnedTagId === tag.id && 'opacity-60 shadow-sm',
                    )}
                  >
                    <span className="text-[10px] font-semibold text-text-muted">{index + 1}</span>
                    <span className="text-text-muted">⋮⋮</span>
                    <CustomerTagChip tag={tag} size="sm" showPin />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {registeredPresets.map((preset) => {
            const tagsForCategory = orderedTags.filter((tag) => tag.category === preset.category);
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
                    'flex flex-wrap gap-2 overflow-hidden transition-all duration-300',
                    tagsExpanded || editingTags ? 'max-h-none' : 'max-h-24',
                  )}
                >
                  {tagsForCategory.map((tag) => (
                    <div
                      key={tag.id}
                      className={cn(
                        'rounded-2xl border border-border bg-surface p-2.5',
                        editingTags ? 'min-w-[240px] flex-1' : '',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <CustomerTagChip
                          tag={tag}
                          size="sm"
                          showPin={Boolean(tag.pinned)}
                          icon={tagIconMap[tag.value]}
                        />
                        {editingTags && (
                          <button
                            type="button"
                            className="text-[10px] font-medium text-text-muted"
                            onClick={() => handleRemoveTag(tag.id)}
                          >
                            삭제
                          </button>
                        )}
                      </div>

                      {editingTags && (
                        <div className="mt-2 flex flex-col gap-2">
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleTagAccent(tag.id)}
                              className={cn(
                                'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                                tag.accent
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border text-text-muted hover:bg-surface-alt',
                              )}
                            >
                              {tag.accent ? '✔ 강조' : '강조'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleTagPinned(tag.id)}
                              className={cn(
                                'rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                                tag.pinned
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border text-text-muted hover:bg-surface-alt',
                              )}
                            >
                              {tag.pinned ? '📌 상단 고정됨' : '상단 고정'}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSetTagAccent(tag.id, undefined)}
                              className={cn(
                                'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
                                tag.accent === undefined
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-border text-text-muted hover:bg-surface-alt',
                              )}
                            >
                              기본
                            </button>
                            <div className="flex gap-1">
                              {CUSTOMER_TAG_ACCENTS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => handleSetTagAccent(tag.id, color)}
                                  className={cn(
                                    'h-5 w-5 rounded-full border-2 transition-all',
                                    getCustomerTagDotClasses(color),
                                    tag.accent === color ? 'border-text ring-2 ring-offset-1' : 'border-transparent',
                                    !tag.accent && 'opacity-45',
                                  )}
                                  aria-label={`${tag.value} 색상 ${color}`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {!editingTags && orderedTags.length === 0 && (
            <p className="text-sm text-text-muted">등록된 태그가 없습니다</p>
          )}
        </div>

        {editingTags && (
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newTagValue}
              onChange={(e) => setNewTagValue(e.target.value)}
              placeholder="새 태그 입력"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAppendCustomTag();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAppendCustomTag}
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
            updateCustomer(id, {
              preference: {
                customerId: id,
                ...(customer?.preference ?? {}),
                preferredShape: updated.shape,
                preferredLength: updated.length,
                preferredThickness: updated.thickness,
                cuticleSensitivity: (updated.cuticle as 'normal' | 'sensitive') || undefined,
                nailCondition: updated.nailCondition,
                memo: updated.memo,
                updatedAt: new Date().toISOString(),
              },
            });
          }}
        />
      </div>

      {/* ─────────────────────────────── */}
      {/* 3. 이미지 갤러리 (real upload) */}
      {/* ─────────────────────────────── */}
      <Card className="mx-4 shadow-md rounded-2xl">
        {/* 섹션 헤더 + 업로드 버튼 */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary">시술 기록</h2>
          <button
            className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
            style={{ borderStyle: 'dashed', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            onClick={() => treatmentFileRef.current?.click()}
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
            onChange={(e) => handleFileChange(e, 'reference')}
          />
        </div>

        {uploadError && (
          <div className="mb-3 rounded-xl bg-error/10 border border-error/20 px-3 py-2">
            <p className="text-xs font-medium text-error">{uploadError}</p>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {treatmentPhotos.length > 0 ? (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <p className="text-xs font-medium text-text-muted">시술 사진</p>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}
                >
                  {treatmentPhotos.length}장
                </span>
              </div>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                {treatmentPhotos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square group">
                    <Image
                      src={photo.imageDataUrl}
                      alt="시술 사진"
                      fill
                      unoptimized
                      className="rounded-xl object-cover shadow-sm"
                    />
                    <button
                      onClick={() => handleRemovePhoto(photo.id)}
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

        {/* 상담 기록 보기 링크 */}
        <button
          onClick={() => router.push(`/records?customerId=${id}`)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-medium text-text-secondary hover:border-primary hover:text-primary transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          상담 기록 보기
        </button>
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
              <div key={`${hist.recordId}-${idx}`} className="relative flex gap-3 pb-5 last:pb-0">
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
                      {hist.price ? formatPrice(hist.price) : '–'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="neutral" size="sm">{BODY_PART_LABEL[hist.bodyPart] ?? hist.bodyPart}</Badge>
                    <Badge variant="primary" size="sm">{hist.designScope}</Badge>
                  </div>
                  {/* CU-5: 컬러 & 파츠 칩 */}
                  {(hist.colorLabels?.length ?? 0) > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {hist.colorLabels!.map((color, idx) => (
                        <span key={idx} className="inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          {color}
                        </span>
                      ))}
                    </div>
                  )}
                  {(hist.partsUsed?.length ?? 0) > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {hist.partsUsed!.map((part, idx) => (
                        <Badge key={idx} variant="success" size="sm">{part}</Badge>
                      ))}
                    </div>
                  )}
                  <p className="mt-1.5 text-xs text-text-secondary">담당: {hist.designerName}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─────────────────────────────── */}
      {/* 6. 스몰토크 기록 */}
      {/* ─────────────────────────────── */}
      <Card className="mx-4 shadow-md rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-secondary">고객 메모</h2>
          <button
            className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20 active:scale-95"
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
              className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-text placeholder:text-text-muted resize-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 outline-none transition-colors"
              rows={3}
            />
            <button
              onClick={() => {
                if (newSmallTalk.trim()) {
                  const newNote = {
                    id: `stn-${Date.now()}`,
                    customerId: customer.id,
                    noteText: newSmallTalk.trim(),
                    createdAt: getNowInKoreaIso(),
                    createdByDesignerId: activeDesignerId ?? 'designer-session',
                    createdByDesignerName: activeDesignerName ?? '나',
                  };
                  setLocalSmallTalkNotes((prev) => [newNote, ...prev]);
                  appendSmallTalkNote(customer.id, newNote);
                  setNewSmallTalk('');
                  setShowSmallTalkInput(false);
                }
              }}
              className="self-end rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white active:scale-95 transition-transform"
            >
              저장
            </button>
          </div>
        )}
        {localSmallTalkNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-alt">
              <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">메모를 추가해보세요</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {[...localSmallTalkNotes]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
              )
              .map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl bg-surface-alt p-4"
                  style={{
                    borderLeft: '4px solid var(--color-primary)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-text-secondary">{note.createdByDesignerName}</span>
                    <span className="text-[11px] text-text-muted">{formatDateDot(note.createdAt)}</span>
                  </div>
                  <p className="text-sm text-text leading-relaxed">{note.noteText}</p>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* CU-2: 사진 팝업 모달 */}
      {photoPopupId && (() => {
        const photo = treatmentPhotos.find((p) => p.id === photoPopupId);
        if (!photo) return null;
        return (
          <Modal isOpen={true} onClose={() => setPhotoPopupId(null)} title="시술 사진">
            <div className="flex flex-col gap-4 p-4">
              <div className="relative aspect-square w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-surface-alt">
                <Image
                  src={photo.imageDataUrl}
                  alt="시술 사진"
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              {photo.takenAt && (
                <p className="text-center text-sm text-text-secondary">{formatDateDot(photo.takenAt)}</p>
              )}
              {photo.note && (
                <p className="text-sm text-text text-center">{photo.note}</p>
              )}
              <Button
                variant="secondary"
                fullWidth
                onClick={() => router.push(`/portfolio/${photo.id}`)}
              >
                포트폴리오 상세 보기
              </Button>
            </div>
          </Modal>
        );
      })()}

      {/* 구분선 */}
      <div className="mx-4 h-px" style={{ background: 'var(--color-border)' }} />

      {/* CTA 버튼 */}
      <div className="px-4 flex flex-col gap-2">
        <Button
          variant="primary"
          fullWidth
          onClick={() => {
            sessionStorage.removeItem('consultation_customer_memo');
            hydrateConsultation({
              customerId: customer.id,
              customerName: customer.name,
              customerPhone: customer.phone,
              entryPoint: 'staff',
              currentStep: ConsultationStep.START,
            });
            router.push('/consultation');
          }}
        >
          이 고객으로 새 상담 시작
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => router.push(`/records?customerId=${id}&view=list`)}
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
