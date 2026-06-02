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
import { formatPrice, formatRelativeDate, formatDateDot, getNowInKoreaIso, toKoreanDateString } from '@/lib/format';
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
import { useMembershipPlanStore } from '@/store/membership-plan-store';
import { generateId } from '@/lib/generate-id';
import { getRemainingAmount, formatWon } from '@/lib/membership';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAuthStore } from '@/store/auth-store';
import { useReservationStore } from '@/store/reservation-store';
import { normalizePhone } from '@/lib/phone';
import { useRecordsStore } from '@/store/records-store';
import type { TreatmentHistory } from '@/types/customer';
import { resolveRecordCategoryLabelKo } from '@/lib/category-resolver';
import { useAppStore } from '@/store/app-store';
import { resizePortfolioImage } from '@/lib/image-utils';
import type { PortfolioPhotoKind } from '@/types/portfolio';
import { getSafetyTagMeta } from '@/lib/tag-safety';
import {
  IconCamera,
  IconCalendar,
} from '@/components/icons';
import { MembershipCard } from '@/components/customer/MembershipCard';
import { TreatmentPhotoCarousel } from '@/components/customer/TreatmentPhotoCarousel';

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

function isRenderableImageSrc(src: string | undefined): src is string {
  return typeof src === 'string' && src.trim().length > 0;
}

function CustomerDetailContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromChecklist = searchParams.get('fromChecklist') === 'true';
  const customer = useCustomerStore((s) => s.getById(id));
  const updateCustomer = useCustomerStore((s) => s.updateCustomer);
  const removeCustomer = useCustomerStore((s) => s.removeCustomer);
  const updateTagsInStore = useCustomerStore((s) => s.updateTags);
  const appendSmallTalkNote = useCustomerStore((s) => s.appendSmallTalkNote);
  const addMembership = useCustomerStore((s) => s.addMembership);
  const manualDeductMembership = useCustomerStore((s) => s.manualDeductMembership);
  const updateMembership = useCustomerStore((s) => s.updateMembership);
  const membershipSyncError = useCustomerStore((s) => s.membershipSyncError);
  const clearMembershipSyncError = useCustomerStore((s) => s.clearMembershipSyncError);
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
  const [showMembershipModal, setShowMembershipModal] = useState(false);
  const [showDeductModal, setShowDeductModal] = useState(false);
  // 0428 P1-6: window.confirm 대신 인라인 모달
  const [showExpireConfirm, setShowExpireConfirm] = useState(false);
  // 0602: 고객 삭제 confirm 모달
  const [showDeleteCustomerConfirm, setShowDeleteCustomerConfirm] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [deleteCustomerError, setDeleteCustomerError] = useState<string | null>(null);
  const [deductCount, setDeductCount] = useState('');
  const [deductNote, setDeductNote] = useState('');
  const [mbPurchaseAmount, setMbPurchaseAmount] = useState('');
  const [mbExpiryDate, setMbExpiryDate] = useState('');
  const [mbSelectedPlanId, setMbSelectedPlanId] = useState<string>('');

  const membershipPlans = useMembershipPlanStore((s) => s.plans);
  const hydratePlans = useMembershipPlanStore((s) => s.hydrateFromDB);
  const plansReady = useMembershipPlanStore((s) => s._dbReady);
  const activePlans = membershipPlans.filter((p) => p.isActive);
  useEffect(() => {
    if (!plansReady) void hydratePlans();
  }, [plansReady, hydratePlans]);

  // 0428 P1-2: 회원권 모달 열릴 때 기존 회원권 값을 form에 주입
  // 신규 등록은 빈 값으로, 수정은 기존 값으로 시작 (만료일 리셋 방지)
  useEffect(() => {
    if (!showMembershipModal) return;
    const existing = useCustomerStore.getState().getById(id)?.membership;
    if (existing) {
      setMbPurchaseAmount(String(existing.purchaseAmount));
      setMbExpiryDate(existing.expiryDate ?? '');
      setMbSelectedPlanId(existing.planId ?? '');
    } else {
      setMbPurchaseAmount('');
      setMbExpiryDate('');
      setMbSelectedPlanId('');
    }
  }, [showMembershipModal, id]);

  const addPhoto = usePortfolioStore((s) => s.addPhoto);
  const removePhoto = usePortfolioStore((s) => s.removePhoto);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const activeDesignerName = useAuthStore((s) => s.activeDesignerName);
  const getByCustomerId = usePortfolioStore((s) => s.getByCustomerId);
  const reservations = useReservationStore((s) => s.reservations);
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  const shopSettings = useAppStore((s) => s.shopSettings);

  // UF-4: records-store에서 해당 고객 레코드를 가져와 시술 이력과 병합
  const customerRecords = useMemo(
    () => getAllRecords().filter((r) => r.customerId === id),
    [getAllRecords, id],
  );

  const mergedTreatmentHistory = useMemo((): TreatmentHistory[] => {
    const existingHistory = customer?.treatmentHistory ?? [];
    const recordBased = customerRecords.map((r): TreatmentHistory => ({
      recordId: r.id,
      date: toKoreanDateString(r.createdAt),
      bodyPart: r.consultation.bodyPart,
      // 0531: 시술 종류는 designCategory 우선(프렌치 등). designScope 손실 매핑 보정.
      designScope: resolveRecordCategoryLabelKo(r.consultation, shopSettings),
      price: r.finalPrice,
      designerName: useShopStore.getState().getDesignerName(r.designerId) || r.designerId,
      paymentMethod: r.paymentMethod,
      // 0601 QA: 등급(A) 대신 커스텀 파츠 종류명 × 수량. customPartId를 customParts에서 해석.
      partsUsed: r.consultation.partsSelections?.length
        ? r.consultation.partsSelections.map((p) => {
            const name = p.customPartId
              ? shopSettings.customParts?.find((cp) => cp.id === p.customPartId)?.name
              : undefined;
            return `${name ?? '파츠'} x${p.quantity}`;
          })
        : undefined,
    }));

    // N-11: 중복 제거 — recordId 기반 (날짜+금액은 다른 고객의 같은 시술도 중복 처리될 수 있음)
    const seen = new Set(existingHistory.map((h) => h.recordId).filter(Boolean));
    const unique = recordBased.filter((r) => !r.recordId || !seen.has(r.recordId));

    return [...existingHistory, ...unique].sort((a, b) => b.date.localeCompare(a.date));
  }, [customer?.treatmentHistory, customerRecords, shopSettings]);

  // 결제 수단별 합계 (records 실데이터 기반)
  const paymentSummary = useMemo(() => {
    let cash = 0;
    let card = 0;
    let membership = 0;
    let deposit = 0;
    for (const r of customerRecords) {
      if (!r.finalizedAt) continue;
      deposit += (r.deposit ?? 0);
      const pm = r.paymentMethod;
      // 복합 결제(membership + cash/card)
      if (pm === 'membership' && r.secondaryPaymentMethod && r.secondaryAmount) {
        membership += (r.membershipApplied ?? 0);
        if (r.secondaryPaymentMethod === 'cash') cash += r.secondaryAmount;
        else card += r.secondaryAmount;
      } else if (pm === 'cash') {
        cash += r.finalPrice;
      } else if (pm === 'card') {
        card += r.finalPrice;
      } else if (pm === 'membership') {
        membership += (r.membershipApplied ?? r.finalPrice);
      }
    }
    return { cash, card, membership, deposit };
  }, [customerRecords]);

  // 이 고객의 예약 이력 (사전상담 완료 여부 포함)
  // customerId 직접 연결 + 전화번호 매칭(사전상담 booking 이 customer_id 미연결인 경우 대비).
  const customerReservations = useMemo(() => {
    const phone = customer?.phone ? normalizePhone(customer.phone) : null;
    return reservations
      .filter((r) => r.customerId === id || (!!phone && !!r.phone && normalizePhone(r.phone) === phone))
      .sort((a, b) => b.reservationDate.localeCompare(a.reservationDate));
  }, [reservations, id, customer?.phone]);

  const customerPhotos = getByCustomerId(id);
  const treatmentPhotos = customerPhotos.filter(
    (p) => p.kind === 'treatment' && isRenderableImageSrc(p.imageDataUrl),
  );
  const consultPhotos = customerPhotos.filter((p) => p.kind === 'reference');

  // CU-2: 최근 3장 미니 갤러리
  const recentTreatmentPhotos = treatmentPhotos.slice(0, 3);
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

  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => { clearTimeout(toastTimerRef.current); }, []);

  // [MED] 회원권 DB sync 실패 시 toast 알림
  useEffect(() => {
    if (membershipSyncError && membershipSyncError.customerId === id) {
      pushToast('error', `회원권 저장에 실패했어요: ${membershipSyncError.message}`);
      clearMembershipSyncError();
    }
  }, [membershipSyncError, id, clearMembershipSyncError, pushToast]);

  const handleVipToggle = () => {
    const newVal = !isVip;
    setIsVip(newVal);
    updateCustomer(id, { isRegular: newVal });
    navigator.vibrate?.(50);
    setVipToast(newVal ? '단골 지정됨' : '단골 해제됨');
    toastTimerRef.current = setTimeout(() => setVipToast(null), 2000);
  };

  const handleDeleteCustomer = async (): Promise<void> => {
    if (isDeletingCustomer) return;
    setIsDeletingCustomer(true);
    setDeleteCustomerError(null);
    const result = await removeCustomer(id);
    if (result.success) {
      // 뒤로가기로 삭제된 고객에 다시 진입하지 않도록 replace
      router.replace('/customers');
    } else {
      setIsDeletingCustomer(false);
      if (result.reason === 'has_records') {
        setDeleteCustomerError(
          `시술 기록이 ${result.recordCount ?? ''}건 있어 삭제할 수 없어요. 시술 기록을 먼저 삭제한 뒤 다시 시도해 주세요.`,
        );
      } else {
        setDeleteCustomerError(result.error ?? '삭제에 실패했어요. 잠시 후 다시 시도해 주세요.');
      }
    }
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
              toastTimerRef.current = setTimeout(() => setUploadError(null), 3000);
              break;
            }

            pushToast('success', '포트폴리오 사진을 저장했어요');
          } catch {
            setUploadError('이미지 변환에 실패했습니다');
            pushToast('error', '이미지 변환에 실패했습니다');
            toastTimerRef.current = setTimeout(() => setUploadError(null), 3000);
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
    <div className="flex flex-col gap-6 pb-8 md:px-6">
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm flex items-center gap-3 px-4 pt-4 pb-2">
        <button
          onClick={() => router.back()}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-text-secondary"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 text-lg font-bold text-text">고객 상세</h1>
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams();
            params.set('customerId', customer.id);
            params.set('customerName', customer.name);
            router.push(`/quick-sale?${params.toString()}`);
          }}
          className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          매출
        </button>
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
                  <h2 className="max-w-[200px] truncate text-xl font-bold text-text sm:max-w-[200px]">{customer.name}</h2>
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
              <p className="truncate text-sm text-text-secondary">
                {assignedDesigner ? `담당: ${assignedDesigner}` : '담당 미지정'}
              </p>
              <button
                onClick={() => setShowDesignerPicker((v) => !v)}
                className="flex items-center gap-0.5 text-[11px] font-medium text-primary hover:underline"
              >
                변경
                <svg
                  className={cn('h-3 w-3 transition-transform duration-200', showDesignerPicker && 'rotate-180')}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
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
        <div className="grid grid-cols-3 gap-1.5 md:gap-4">
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
            <p className="text-base font-bold text-primary mt-0.5">
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
            <p className="text-sm font-bold text-primary mt-0.5">{customer.averageSpend ? formatPrice(customer.averageSpend) : '–'}</p>
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
            <p className="text-xs font-bold text-primary mt-0.5 text-center leading-tight">{formatRelativeDate(customer.lastVisitDate)}</p>
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

        {/* 시술 시간 선호 */}
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-semibold text-text-muted">시술 시간 선호</p>
          <div className="flex gap-1.5">
            {(['short', 'normal', 'long'] as const).map((val) => {
              const labels = { short: '짧음', normal: '보통', long: '김' };
              const isSelected = (customer.durationPreference ?? 'normal') === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => updateCustomer(id, { durationPreference: val })}
                  className={cn(
                    'flex-1 rounded-xl py-1.5 text-xs font-semibold border transition-all',
                    isSelected
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-alt text-text-secondary border-border hover:border-primary/40',
                  )}
                >
                  {labels[val]}
                </button>
              );
            })}
          </div>
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

      {/* 비주얼 시술 이력 캐러셀 */}
      {treatmentPhotos.length > 0 && (
        <div className="mx-4 -mt-2">
          <p className="mb-2 text-xs font-semibold text-text-secondary">시술 이력</p>
          <TreatmentPhotoCarousel photos={treatmentPhotos} maxItems={5} />
        </div>
      )}

      {/* ─────────────────────────────── */}
      {/* 1.5 고정 특이사항 (Pinned Traits) */}
      {/* ─────────────────────────────── */}
      <Card className="mx-4 shadow-md rounded-2xl">
        <h2 className="mb-3 text-sm font-semibold text-text-secondary">특이사항</h2>
        {pinnedTags.length === 0 ? (
          <button
            onClick={handleStartTagEdit}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-text-muted hover:border-primary hover:text-primary transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            태그에서 상단 고정으로 추가
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pinnedTags.map((tag) => {
              const safety = getSafetyTagMeta(tag);
              if (safety.level === 'high' || safety.level === 'medium') {
                return <SafetyTag key={tag.id} tag={tag} size="sm" showIcon />;
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
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text-secondary">시술 성향 태그</h2>
            {editingTags && (
              <p className="mt-1 text-[11px] text-text-muted">
                강조, 색상, 상단 고정, 노출 순서를 한 번에 조정합니다.
              </p>
            )}
          </div>
          {editingTags ? (
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:justify-start">
              <button
                type="button"
                className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs font-medium text-text-muted"
                onClick={handleCancelTagEdit}
              >
                취소
              </button>
              <button
                type="button"
                className="whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
                onClick={handleSaveTagEdit}
              >
                완료
              </button>
            </div>
          ) : (
            localTags.length === 0 ? (
              <button
                type="button"
                className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
                onClick={handleStartTagEdit}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                태그 추가
              </button>
            ) : (
              <button
                type="button"
                className="rounded-full bg-surface-alt border border-border px-3 py-1.5 text-xs font-semibold text-text-secondary hover:bg-border transition-colors"
                onClick={handleStartTagEdit}
              >
                편집
              </button>
            )
          )}
        </div>

        {editingTags && (
          <div className="mb-4 rounded-2xl border border-border bg-surface-alt p-3">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-text">상단 카드 노출 순서</p>
                <p className="mt-1 text-[11px] text-text-muted">고정한 태그를 드래그해서 홈/예약 카드 우선순서를 정하세요.</p>
              </div>
              <span className="self-start whitespace-nowrap rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary sm:self-auto">
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
                        {preset.category === 'etc' ? (
                          <SafetyTag tag={tag} size="sm" showIcon />
                        ) : (
                          <CustomerTagChip
                            tag={tag}
                            size="sm"
                            showPin={Boolean(tag.pinned)}
                            icon={tagIconMap[tag.value]}
                          />
                        )}
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
      {/* 2.3 예약 / 사전상담 이력 */}
      {/* ─────────────────────────────── */}
      {customerReservations.length > 0 && (
        <Card className="mx-4 shadow-md rounded-2xl">
          <h2 className="mb-3 text-sm font-semibold text-text-secondary">예약 이력</h2>
          <div className="flex flex-col gap-2">
            {customerReservations.map((res) => {
              const hasPreConsult = !!res.preConsultationCompletedAt;
              return (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => hasPreConsult && router.push(`/records/preconsult/${res.id}`)}
                  className={cn(
                    'flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors',
                    hasPreConsult
                      ? 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 cursor-pointer'
                      : 'border-border bg-surface-alt cursor-default',
                  )}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-xs font-semibold text-text">
                      {res.reservationDate} {res.reservationTime}
                    </span>
                    {res.requestNote && (
                      <span className="text-[11px] text-text-muted truncate max-w-[200px]">{res.requestNote}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {hasPreConsult ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        사전상담 완료
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                        미완료
                      </span>
                    )}
                    {hasPreConsult && (
                      <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* ─────────────────────────────── */}
      {/* 2.5 회원권 */}
      {/* ─────────────────────────────── */}
      <div className="mx-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-text-secondary">회원권</h2>
          {/* 0428 P1-4: 잔액 기반 — 잔액 남으면 횟수 차감 가능 */}
          {customer.membership && getRemainingAmount(customer.membership) > 0 && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeductCount('');
                  setDeductNote('');
                  setShowDeductModal(true);
                }}
                className="text-xs font-medium text-text-secondary hover:text-text hover:underline"
              >
                금액 차감
              </button>
              <button
                type="button"
                onClick={() => setShowMembershipModal(true)}
                className="text-xs font-medium text-primary hover:underline"
              >
                수정
              </button>
            </div>
          )}
          {customer.membership && getRemainingAmount(customer.membership) <= 0 && (
            <button
              type="button"
              onClick={() => setShowMembershipModal(true)}
              className="text-xs font-medium text-primary hover:underline"
            >
              수정
            </button>
          )}
        </div>
        {customer.membership ? (
          <MembershipCard
            membership={customer.membership}
            onAddSession={() => setShowMembershipModal(true)}
            // 0428 P1-6: window.confirm → 인라인 모달
            onExpire={() => setShowExpireConfirm(true)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowMembershipModal(true)}
            className="w-full rounded-2xl border border-dashed border-border bg-surface px-4 py-5 text-sm text-text-muted hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
            </svg>
            회원권 등록
          </button>
        )}
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
                      className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error text-white text-xs shadow-md transition-opacity lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto"
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

        {/* 결제 수단별 합계 */}
        {(paymentSummary.cash > 0 || paymentSummary.card > 0 || paymentSummary.membership > 0 || paymentSummary.deposit > 0) && (
          <div className="mt-3 rounded-xl border border-border bg-surface-alt px-3 py-2.5 flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold text-text-muted mb-0.5">결제 합계</p>
            <div className="flex flex-wrap gap-2 text-center">
              {paymentSummary.cash > 0 && (
                <div className="flex flex-col gap-0.5 min-w-[60px] flex-1">
                  <span className="text-[10px] font-medium text-text-muted">현금</span>
                  <span className="text-xs font-bold text-text tabular-nums">{formatPrice(paymentSummary.cash)}</span>
                </div>
              )}
              {paymentSummary.card > 0 && (
                <div className="flex flex-col gap-0.5 min-w-[60px] flex-1">
                  <span className="text-[10px] font-medium text-text-muted">카드</span>
                  <span className="text-xs font-bold text-text tabular-nums">{formatPrice(paymentSummary.card)}</span>
                </div>
              )}
              {paymentSummary.membership > 0 && (
                <div className="flex flex-col gap-0.5 min-w-[60px] flex-1">
                  <span className="text-[10px] font-medium text-text-muted">회원권</span>
                  <span className="text-xs font-bold text-text tabular-nums">{formatPrice(paymentSummary.membership)}</span>
                </div>
              )}
              {paymentSummary.deposit > 0 && (
                <div className="flex flex-col gap-0.5 min-w-[60px] flex-1">
                  <span className="text-[10px] font-medium text-text-muted">예약금</span>
                  <span className="text-xs font-bold text-text tabular-nums">{formatPrice(paymentSummary.deposit)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 시술 기록 보기 링크 */}
        <button
          onClick={() => router.push(`/records?customerId=${id}`)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-medium text-text-secondary hover:border-primary hover:text-primary transition-colors"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          시술 기록 보기
        </button>
      </Card>

      {/* ─────────────────────────────── */}
      {/* 4. 시술 이력 타임라인 */}
      {/* ─────────────────────────────── */}
      <Card className="mx-4 shadow-md rounded-2xl">
        <h2 className="mb-4 text-sm font-semibold text-text-secondary">시술 이력</h2>
        {mergedTreatmentHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <svg className="h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-text-muted">아직 시술 이력이 없습니다</p>
          </div>
        ) : (
        <div className="relative flex flex-col gap-0">
          {mergedTreatmentHistory.map((hist, idx) => {
            const scopeIcon = DESIGN_SCOPE_ICON[hist.designScope] ?? '●';
            return (
              <div key={`${hist.recordId}-${idx}`} className="relative flex gap-3 pb-5 last:pb-0">
                {/* 타임라인 라인 */}
                {idx < mergedTreatmentHistory.length - 1 && (
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
                  role={hist.recordId ? 'button' : undefined}
                  onClick={() => hist.recordId && router.push(`/records/${hist.recordId}`)}
                  className={cn(
                    'flex-1 min-w-0 rounded-2xl border p-3',
                    hist.recordId ? 'cursor-pointer hover:border-primary/40 transition-colors' : '',
                  )}
                  style={{
                    background: 'var(--color-surface-alt)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-text-muted">
                      {formatDateDot(hist.date)}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hist.paymentMethod && (
                        <span className={cn(
                          'inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                          hist.paymentMethod === 'cash' && 'bg-emerald-50 text-emerald-700',
                          hist.paymentMethod === 'card' && 'bg-blue-50 text-blue-700',
                          hist.paymentMethod === 'membership' && 'bg-amber-50 text-amber-700',
                        )}>
                          {hist.paymentMethod === 'cash' ? '현금' : hist.paymentMethod === 'card' ? '카드' : '회원권'}
                        </span>
                      )}
                      <span
                        className="text-base font-bold"
                        style={{ color: 'var(--color-primary-dark)' }}
                      >
                        {hist.price ? formatPrice(hist.price) : '–'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge variant="neutral" size="sm">{BODY_PART_LABEL[hist.bodyPart] ?? hist.bodyPart}</Badge>
                    <Badge variant="primary" size="sm">{hist.designScope}</Badge>
                  </div>
                  {/* CU-5: 컬러 & 파츠 칩 */}
                  {(hist.colorLabels?.length ?? 0) > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {hist.colorLabels!.map((color, colorIdx) => (
                        <span key={colorIdx} className="inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          {color}
                        </span>
                      ))}
                    </div>
                  )}
                  {(hist.partsUsed?.length ?? 0) > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {hist.partsUsed!.map((part, partIdx) => (
                        <Badge key={partIdx} variant="success" size="sm">{part}</Badge>
                      ))}
                    </div>
                  )}
                  <p className="mt-1.5 text-xs text-text-secondary">담당: {hist.designerName}</p>
                </div>
              </div>
            );
          })}
        </div>
        )}
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
            <p className="text-xs text-text-muted/70">💡 예: 반려동물 이름, 직업, 취미 등 대화 소재</p>
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

      {/* 회원권 등록 모달 */}
      <Modal
        isOpen={showMembershipModal}
        onClose={() => {
          setShowMembershipModal(false);
          setMbSelectedPlanId('');
        }}
        title={customer.membership ? '회원권 수정' : '회원권 등록'}
      >
        <div className="px-5 py-4 flex flex-col gap-4">
          {/* 상품 선택 드롭다운 — 0423: 수정 시에도 다른 상품으로 변경 가능하게 */}
          {activePlans.length > 0 && (
            <div>
              <label className="text-xs font-medium text-text-secondary mb-1 block">상품 선택 (선택)</label>
              <select
                value={mbSelectedPlanId}
                onChange={(e) => {
                  const planId = e.target.value;
                  setMbSelectedPlanId(planId);
                  const plan = activePlans.find((p) => p.id === planId);
                  if (plan) {
                    setMbPurchaseAmount(String(plan.price));
                    if (plan.validDays != null) {
                      const d = new Date();
                      d.setDate(d.getDate() + plan.validDays);
                      setMbExpiryDate(d.toISOString().slice(0, 10));
                    } else {
                      setMbExpiryDate('');
                    }
                  }
                }}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text focus:border-primary focus:outline-none"
              >
                <option value="">직접 입력</option>
                {activePlans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} · {plan.price.toLocaleString('ko-KR')}원 충전
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-text-muted">
                설정 → 회원권에 등록한 상품을 선택하면 아래가 자동으로 채워져요
              </p>
            </div>
          )}
          {/* 기존 회원권 수정 시: 현재 사용금액·잔액 안내 */}
          {customer.membership && (
            <div className="rounded-xl bg-surface-alt border border-border px-3 py-2.5 text-xs text-text-secondary flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span>현재 사용금액</span>
                <span className="font-semibold tabular-nums text-text">{formatWon(customer.membership.usedAmount ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>현재 잔액</span>
                <span className="font-semibold tabular-nums text-primary">{formatWon(getRemainingAmount(customer.membership))}</span>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">새 총 충전액 *</label>
            <input
              value={mbPurchaseAmount}
              onChange={(e) => {
                setMbPurchaseAmount(e.target.value.replace(/[^0-9]/g, ''));
                setMbSelectedPlanId('');
              }}
              inputMode="numeric"
              placeholder="예: 200000"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-muted focus:border-primary focus:outline-none tabular-nums"
            />
            {mbPurchaseAmount && (
              <p className="mt-1 text-[11px] text-text-muted">
                {Number(mbPurchaseAmount).toLocaleString('ko-KR')}원 (총 충전액) — 시술마다 금액으로 차감돼요
              </p>
            )}
            {/* 기존 회원권 수정 시: 입력값이 사용금액보다 작으면 경고 */}
            {customer.membership && mbPurchaseAmount && Number(mbPurchaseAmount) < (customer.membership.usedAmount ?? 0) && (
              <p className="mt-1 text-[11px] text-rose-500 font-medium">
                총 충전액이 이미 사용한 금액({formatWon(customer.membership.usedAmount ?? 0)})보다 작습니다. 잔액이 0이 되어 회원권이 소진 처리됩니다.
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">만료일 (선택)</label>
            <input
              type="date"
              value={mbExpiryDate}
              onChange={(e) => setMbExpiryDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-text-muted">비워두면 1년 후로 자동 설정</p>
          </div>
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={() => {
                setShowMembershipModal(false);
                setMbSelectedPlanId('');
              }}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-text-secondary"
            >
              취소
            </button>
            <button
              type="button"
              disabled={
                !mbPurchaseAmount ||
                Number(mbPurchaseAmount) <= 0 ||
                (customer.membership != null && Number(mbPurchaseAmount) < (customer.membership.usedAmount ?? 0))
              }
              onClick={() => {
                const amount = Number(mbPurchaseAmount);
                const today = new Date();
                const defaultExpiry = new Date(today);
                defaultExpiry.setFullYear(today.getFullYear() + 1);
                const expiryDate = mbExpiryDate || defaultExpiry.toISOString().slice(0, 10);
                const existing = customer.membership;
                const selectedPlan = activePlans.find((p) => p.id === mbSelectedPlanId);
                // 0423: 금액 기반 잔액도 함께 계산
                // - 신규 등록: remainingAmount = purchaseAmount, usedAmount = 0
                // - 기존 수정: 사용 금액은 그대로 유지, 잔액만 purchaseAmount - usedAmount로 재계산
                const prevUsedAmount = existing?.usedAmount ?? 0;
                const nextRemainingAmount = Math.max(0, amount - prevUsedAmount);
                addMembership(id, {
                  id: existing?.id ?? generateId('mb'),
                  // 0531 회의: 금액 차감 방식 — 횟수 카운터 미사용(0)
                  totalSessions: 0,
                  usedSessions: 0,
                  remainingSessions: 0,
                  purchaseAmount: amount,
                  usedAmount: prevUsedAmount,
                  remainingAmount: nextRemainingAmount,
                  purchaseDate: existing?.purchaseDate ?? today.toISOString().slice(0, 10),
                  expiryDate,
                  // 0601: 수정 시 잔액이 남아 있으면 active로 재활성화(잘못/수동 만료 해제).
                  //   날짜 만료는 표시 시점 getEffectiveStatus가 만료일로 재판정하므로
                  //   저장 status를 'expired'로 굳히지 않는다 — 만료일을 미래로 바꿔도
                  //   만료 뱃지가 안 풀리던 버그 수정. 잔액 소진 시에만 used_up.
                  status: nextRemainingAmount > 0 ? 'active' : 'used_up',
                  transactions: existing?.transactions ?? [],
                  planId: selectedPlan?.id ?? existing?.planId,
                  planName: selectedPlan?.name ?? existing?.planName,
                });
                setShowMembershipModal(false);
                setMbPurchaseAmount('');
                setMbExpiryDate('');
                setMbSelectedPlanId('');
              }}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              {customer.membership ? '저장' : '등록'}
            </button>
          </div>
        </div>
      </Modal>

      {/* 회원권 수동 차감 모달 (기존 회원권 이관용) */}
      <Modal
        isOpen={showDeductModal}
        onClose={() => setShowDeductModal(false)}
        title="회원권 금액 차감"
      >
        <div className="px-5 py-4 flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            다른 곳에서 쓰던 회원권을 옮겨오거나 시술 기록 없이 차감해야 할 때 사용하세요.
          </p>
          {customer.membership && (
            <div className="rounded-xl bg-surface-alt border border-border p-3 text-sm flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-text-muted">남은 금액</span>
                <span className="font-semibold text-text tabular-nums">
                  {getRemainingAmount(customer.membership).toLocaleString()}원
                </span>
              </div>
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">차감 금액 *</label>
            <input
              value={deductCount}
              onChange={(e) => setDeductCount(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              placeholder="예: 50000"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-muted focus:border-primary focus:outline-none tabular-nums"
            />
            {/* 입력 시 예상 차감 금액 + 차감 후 잔액 실시간 미리보기 */}
            {customer.membership && deductCount && Number(deductCount) > 0 && (() => {
              const n = Number(deductCount);
              const remaining = getRemainingAmount(customer.membership);
              const expectedDeduct = Math.min(remaining, n);
              const afterRemaining = Math.max(0, remaining - expectedDeduct);
              return (
                <div className="mt-2 rounded-lg bg-primary/5 border border-primary/15 px-3 py-2 text-xs text-text-secondary tabular-nums">
                  <div className="flex justify-between">
                    <span>예상 차감</span>
                    <span className="font-bold text-primary">-{formatWon(expectedDeduct)}</span>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span>차감 후 잔액</span>
                    <span className="font-semibold text-text">{formatWon(afterRemaining)}</span>
                  </div>
                </div>
              );
            })()}
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1 block">사유 메모 (선택)</label>
            <input
              value={deductNote}
              onChange={(e) => setDeductNote(e.target.value)}
              placeholder="예: 기존 회원권 이관"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2 pb-2">
            <button
              type="button"
              onClick={() => setShowDeductModal(false)}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-text-secondary"
            >
              취소
            </button>
            <button
              type="button"
              disabled={!deductCount || Number(deductCount) <= 0}
              onClick={() => {
                const n = Number(deductCount);
                if (!Number.isFinite(n) || n <= 0) return;
                manualDeductMembership(id, n, deductNote);
                setShowDeductModal(false);
                setDeductCount('');
                setDeductNote('');
              }}
              className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-white disabled:opacity-40"
            >
              차감하기
            </button>
          </div>
        </div>
      </Modal>

      {/* 0428 P1-6: 만료 처리 confirm 모달 (window.confirm 대체) */}
      <Modal
        isOpen={showExpireConfirm}
        onClose={() => setShowExpireConfirm(false)}
        title="회원권 만료 처리"
      >
        <div className="px-5 py-4 flex flex-col gap-4">
          <p className="text-sm text-text-secondary leading-relaxed">
            이 회원권을 만료 처리할까요?<br />
            결제 수단에서 더 이상 선택할 수 없게 됩니다.
          </p>
          {customer.membership && (
            <div className="rounded-xl bg-surface-alt border border-border p-3 text-xs text-text-muted flex items-center justify-between">
              <span>현재 잔액</span>
              <span className="font-semibold text-text tabular-nums">
                {formatWon(getRemainingAmount(customer.membership))}
              </span>
            </div>
          )}
          <div className="flex gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={() => setShowExpireConfirm(false)}
              className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-text-secondary"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => {
                updateMembership(id, { status: 'expired' });
                setShowExpireConfirm(false);
              }}
              className="flex-1 rounded-xl bg-warning py-3 text-sm font-bold text-white"
            >
              만료 처리
            </button>
          </div>
        </div>
      </Modal>

      {/* 0602: 고객 삭제 — 잘못 등록한 고객 정리. 매출·예약·포트폴리오는 보존(연결만 해제) */}
      <button
        type="button"
        onClick={() => { setDeleteCustomerError(null); setShowDeleteCustomerConfirm(true); }}
        className="mx-4 mt-2 rounded-xl border border-error/30 bg-error/5 py-2.5 text-sm font-semibold text-error hover:bg-error/10 transition-colors min-h-[44px]"
      >
        이 고객 삭제
      </button>

      <Modal
        isOpen={showDeleteCustomerConfirm}
        onClose={() => { if (!isDeletingCustomer) setShowDeleteCustomerConfirm(false); }}
        title="고객을 삭제할까요?"
      >
        <div className="flex flex-col gap-4 p-5">
          {customerRecords.length > 0 ? (
            <>
              {/* 시술 기록이 있는 고객은 매출 정합성 보호를 위해 삭제 차단 — 기록 먼저 삭제 안내 */}
              <p className="text-sm leading-relaxed text-text-secondary break-keep">
                <span className="font-bold text-text">{customer.name}</span> 고객은 시술 기록이 <span className="font-bold text-text">{customerRecords.length}건</span> 있어요.
                매출 기록을 보호하기 위해, 시술 기록을 먼저 삭제한 뒤에 고객을 삭제할 수 있어요.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteCustomerConfirm(false)}
                  className="flex-1 rounded-xl border border-border bg-white py-2.5 text-sm font-semibold text-text-secondary min-h-[44px]"
                >
                  닫기
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/records?customerId=${id}`)}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white min-h-[44px]"
                >
                  시술 기록 보기
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm leading-relaxed text-text-secondary break-keep">
                <span className="font-bold text-text">{customer.name}</span> 고객을 삭제하시겠어요? 태그·메모·회원권 정보가 함께 삭제되며, 삭제 후에는 되돌릴 수 없어요.
              </p>
              {deleteCustomerError && (
                <p className="text-xs text-error">{deleteCustomerError}</p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteCustomerConfirm(false)}
                  disabled={isDeletingCustomer}
                  className="flex-1 rounded-xl border border-border bg-white py-2.5 text-sm font-semibold text-text-secondary disabled:opacity-50 min-h-[44px]"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCustomer}
                  disabled={isDeletingCustomer}
                  className="flex-1 rounded-xl bg-error py-2.5 text-sm font-bold text-white disabled:opacity-60 min-h-[44px]"
                >
                  {isDeletingCustomer ? '삭제 중…' : '삭제'}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
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
