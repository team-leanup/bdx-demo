'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Input, Button, ToastContainer } from '@/components/ui';
import type { ToastData } from '@/components/ui';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useCustomerStore } from '@/store/customer-store';
import { useAppStore } from '@/store/app-store';
import { useRecordsStore } from '@/store/records-store';
import { useReservationStore } from '@/store/reservation-store';
import { PortfolioOverlay } from '@/components/portfolio/PortfolioOverlay';
import { cn } from '@/lib/cn';
import { resolveMenuCategoryLabel } from '@/lib/labels';
import { formatDateDot, formatPrice } from '@/lib/format';
import { resizeTreatmentPhoto } from '@/lib/image-utils';

// ── 텍스트 입력 팝업 ──
interface EditPopupState {
  open: boolean;
  title: string;
  placeholder: string;
  initialValue: string;
  onConfirm: (value: string) => void;
}

const EDIT_POPUP_INITIAL: EditPopupState = { open: false, title: '', placeholder: '', initialValue: '', onConfirm: () => {} };

function EditPopup({ state, onClose }: { state: EditPopupState; onClose: () => void }): React.ReactElement | null {
  const [value, setValue] = useState(state.initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(state.initialValue);
    if (state.open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [state.open, state.initialValue]);

  if (!state.open) return null;

  const handleConfirm = (): void => {
    if (value.trim()) {
      state.onConfirm(value.trim());
      onClose();
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-1/3 z-50 mx-auto max-w-sm rounded-2xl bg-surface shadow-xl p-5 flex flex-col gap-4"
      >
        <h3 className="text-base font-bold text-text">{state.title}</h3>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
          placeholder={state.placeholder}
          className="w-full rounded-xl border border-border bg-surface-alt px-4 py-3 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary">취소</button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-medium">확인</button>
        </div>
      </motion.div>
    </>
  );
}
import type { PortfolioPhoto } from '@/types/portfolio';
import type { Customer } from '@/types/customer';

interface MenuToggleRowProps {
  photoId: string;
  isFeatured: boolean | undefined;
  featuredPrice: number | undefined;
  onError?: (msg: string) => void;
}

function MenuToggleRow({ photoId, isFeatured, featuredPrice, onError }: MenuToggleRowProps): React.ReactElement {
  const toggleMenu = usePortfolioStore((s) => s.toggleMenu);
  const [editing, setEditing] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [priceWarning, setPriceWarning] = useState(false);

  const handleRegister = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setEditing(true);
    setPriceInput('');
    setPriceWarning(false);
  };

  const handleConfirm = (e: React.MouseEvent): void => {
    e.stopPropagation();
    const parsed = parseInt(priceInput.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed === 0) {
      setPriceWarning(true);
      return;
    }
    setPriceWarning(false);
    void toggleMenu(photoId, isNaN(parsed) ? undefined : parsed).then((r) => {
      if (!r.success) onError?.(r.error ?? '메뉴 등록에 실패했어요');
    });
    setEditing(false);
  };

  const handleCancel = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setEditing(false);
  };

  const handleRemove = (e: React.MouseEvent): void => {
    e.stopPropagation();
    void toggleMenu(photoId).then((r) => {
      if (!r.success) onError?.(r.error ?? '메뉴 해제에 실패했어요');
    });
  };

  if (isFeatured) {
    return (
      <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-border/60">
        <span className="min-w-0 flex items-center gap-1 text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 truncate">
          메뉴{featuredPrice != null ? ` ${formatPrice(featuredPrice)}` : ''}
        </span>
        <button
          onClick={handleRemove}
          className="shrink-0 text-[10px] text-text-muted hover:text-destructive transition-colors"
        >
          해제
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div
        className="flex flex-col gap-0.5 pt-1.5 border-t border-border/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1">
        <input
          autoFocus
          type="number"
          inputMode="numeric"
          placeholder="가격 (원)"
          value={priceInput}
          onChange={(e) => { setPriceInput(e.target.value); setPriceWarning(false); }}
          className={cn(
            'flex-1 min-w-0 rounded-lg border bg-surface px-2 py-1 text-[10px] text-text focus:outline-none',
            priceWarning ? 'border-error focus:border-error' : 'border-border focus:border-primary',
          )}
        />
        <button
          onClick={handleConfirm}
          className="shrink-0 rounded-lg bg-amber-400 px-2 py-1 text-[10px] font-semibold text-white hover:bg-amber-500 transition-colors"
        >
          등록
        </button>
        <button
          onClick={handleCancel}
          className="shrink-0 rounded-lg border border-border px-2 py-1 text-[10px] text-text-secondary hover:bg-surface-alt transition-colors"
        >
          취소
        </button>
        </div>
        {priceWarning && (
          <p className="text-[10px] text-error">0원은 등록할 수 없어요. 가격을 입력해 주세요</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center pt-1.5 border-t border-border/60">
      <button
        onClick={handleRegister}
        className="text-[10px] text-text-muted hover:text-amber-600 transition-colors"
      >
        + 메뉴판 등록
      </button>
    </div>
  );
}

// ── Menu tab inline price editor ──────────────────────────────────────────────
interface MenuCardPriceProps {
  photoId: string;
  price: number | undefined;
  readOnly?: boolean;
}

function MenuCardPrice({ photoId, price, readOnly }: MenuCardPriceProps): React.ReactElement {
  const updatePhotoMetadata = usePortfolioStore((s) => s.updatePhotoMetadata);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');

  const startEdit = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setInput(price != null ? String(price) : '');
    setEditing(true);
  };

  const commit = (): void => {
    const parsed = parseInt(input.replace(/[^0-9]/g, ''), 10);
    // 낙관적 업데이트 + DB 영속화
    void updatePhotoMetadata(photoId, { price: isNaN(parsed) ? undefined : parsed });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  };

  if (readOnly) {
    return (
      <span className="text-base font-bold text-primary tabular-nums">
        {price != null ? formatPrice(price) : <span className="text-text-muted font-normal text-xs">-</span>}
      </span>
    );
  }

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        inputMode="numeric"
        placeholder="가격 (원)"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className="w-28 rounded-lg border border-primary bg-surface px-2 py-1 text-base font-semibold text-primary focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      className="flex items-center gap-1 text-base font-bold text-primary hover:text-primary/80 transition-colors tabular-nums"
    >
      {price != null ? formatPrice(price) : <span className="text-text-muted font-normal text-xs">가격 미설정</span>}
      <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}

// ── Constants ─────────────────────────────────────────────────────────────────
type DateFilter = 'all' | '30d' | '90d' | '1y';
type PriceFilter = 'all' | 'under50000' | '50000to79999' | '80000to119999' | '120000plus';

const DESIGN_SCOPE_LABEL: Record<string, string> = {
  solid_tone: '원컬러',
  solid_point: '단색+포인트',
  full_art: '풀아트',
  monthly_art: '이달의 아트',
};

// 0530: 시술 종류 SSOT — 메뉴 카테고리는 shopSettings(categoryLabels + customCategories)에서 파생.
// 라벨은 labels.ts CATEGORY_LABELS(resolveMenuCategoryLabel) 단일 소스를 사용 →
// 설정 '시술 종류' / 사전상담 고객 화면과 100% 동일한 집합·순서·라벨을 보장한다.
const BUILTIN_CATEGORY_KEYS = ['simple', 'french', 'magnet', 'art'] as const;

function deriveMenuCategories(
  categoryLabels: Record<string, string> | undefined,
  customCategories: { id: string; name: string; order: number }[] | undefined,
): { key: string; label: string }[] {
  const builtin = BUILTIN_CATEGORY_KEYS.map((key) => ({
    key,
    label: resolveMenuCategoryLabel(key, categoryLabels),
  }));
  const custom = (customCategories ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ key: c.id, label: c.name }));
  return [...builtin, ...custom];
}

// ── InlineEditText: 탭→인라인 편집→blur/enter로 저장 ──
function InlineEditText({ value, onSave, readOnly }: { value: string; onSave: (v: string) => void; readOnly?: boolean }): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);
  const commit = (): void => { if (input.trim()) onSave(input.trim()); setEditing(false); };
  if (readOnly) {
    return (
      <span className="block text-base font-semibold text-text truncate min-w-0">{value}</span>
    );
  }
  if (editing) {
    return (
      <input autoFocus value={input} onChange={(e) => setInput(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
        className="text-base font-semibold text-text bg-transparent border-b-2 border-primary outline-none px-0 py-0 w-full min-w-0" />
    );
  }
  return (
    <button onClick={(e) => { e.stopPropagation(); setInput(value); setEditing(true); }}
      className="flex items-center gap-1 text-base font-semibold text-text hover:text-primary transition-colors text-left min-w-0">
      <span className="truncate">{value}</span>
      <svg className="w-3.5 h-3.5 shrink-0 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}

// ── CategoryHeader: 인라인 이름 편집 + 수정 모드 토글 ──
function CategoryHeader({ label, count, editMode, onToggleEditMode, onRename }: { label: string; count: number; editMode: boolean; onToggleEditMode?: () => void; onRename?: (v: string) => void }): React.ReactElement {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(label);
  const commit = (): void => { if (input.trim() && onRename) onRename(input.trim()); setEditing(false); };
  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input autoFocus value={input} onChange={(e) => setInput(e.target.value)}
          onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
          className="text-base font-bold text-text bg-transparent border-b-2 border-primary outline-none px-0 py-0.5 w-32" />
        <span className="text-xs text-text-muted">{count}개</span>
        <div className="flex-1 h-px bg-border" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-base font-bold text-text tracking-tight">{label}</h2>
      {editMode && onRename && (
        <button onClick={() => { setInput(label); setEditing(true); }} className="text-text-muted hover:text-primary transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}
      <span className="text-xs text-text-muted tabular-nums">{count}개</span>
      <div className="flex-1 h-px bg-border" />
      {onToggleEditMode && (
        <button
          onClick={onToggleEditMode}
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
            editMode
              ? 'bg-primary text-white'
              : 'border border-border text-text-secondary hover:border-primary/40 hover:text-primary',
          )}
        >
          {editMode ? '완료' : '수정'}
        </button>
      )}
    </div>
  );
}

// ── MenuCategoryMove: 탭하면 이동할 카테고리 옵션 표시 ──
function MenuCategoryMove({ photoId, currentCategory }: { photoId: string; currentCategory: string }): React.ReactElement {
  const [open, setOpen] = useState(false);
  // 0529 버그B: updatePhoto(store-only)는 DB에 저장하지 않아 새로고침 시 카테고리가 리셋됐다.
  // updatePhotoMetadata로 styleCategory를 DB까지 영속화한다.
  const updatePhotoMetadata = usePortfolioStore((s) => s.updatePhotoMetadata);
  const categoryLabels = useAppStore((s) => s.shopSettings.categoryLabels);
  const customCategories = useAppStore((s) => s.shopSettings.customCategories);
  const cats = deriveMenuCategories(categoryLabels, customCategories);
  if (!open) {
    return (
      <button onClick={(e) => { e.stopPropagation(); setOpen(true); }} className="text-[9px] text-text-muted px-1.5 py-0.5 rounded-full bg-surface-alt hover:bg-border transition-colors">
        이동
      </button>
    );
  }
  return (
    <div className="flex gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
      {cats.filter((c) => c.key !== currentCategory).map((c) => (
        <button key={c.key} onClick={() => { void updatePhotoMetadata(photoId, { styleCategory: c.key }); setOpen(false); }}
          className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          → {c.label}
        </button>
      ))}
      <button onClick={() => setOpen(false)} className="text-[9px] text-text-muted px-1 py-0.5">✕</button>
    </div>
  );
}

const NAIL_FALLBACKS = [
  '/images/mock/nail/nail-1.jpg',
  '/images/mock/nail/nail-2.jpg',
  '/images/mock/nail/nail-3.jpg',
  '/images/mock/nail/nail-4.jpg',
  '/images/mock/nail/nail-5.jpg',
  '/images/mock/nail/nail-6.jpg',
  '/images/mock/nail/nail-7.jpg',
  '/images/mock/nail/nail-8.jpg',
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PortfolioPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const photos = usePortfolioStore((s) => s.photos);
  const dbReady = usePortfolioStore((s) => s._dbReady);
  const hydrateFromDB = usePortfolioStore((s) => s.hydrateFromDB);
  const migrationNotice = usePortfolioStore((s) => s.migrationNotice);
  const clearMigrationNotice = usePortfolioStore((s) => s.clearMigrationNotice);
  const getMenuPhotos = usePortfolioStore((s) => s.getMenuPhotos);
  const toggleMenu = usePortfolioStore((s) => s.toggleMenu);
  const addCategory = usePortfolioStore((s) => s.addCategory);
  const renameCategory = usePortfolioStore((s) => s.renameCategory);
  const customCategoriesSetting = useAppStore((s) => s.shopSettings.customCategories);
  const categoryLabelsSetting = useAppStore((s) => s.shopSettings.categoryLabels);
  // 0530: 시술 종류 SSOT — shopSettings(categoryLabels + customCategories)에서만 파생.
  // 별도 로컬 리스트를 제거해 설정·사전상담과 항상 동일한 집합을 보장 (localStorage 분리 제거).
  const menuCategories = useMemo(
    () => deriveMenuCategories(categoryLabelsSetting, customCategoriesSetting),
    [categoryLabelsSetting, customCategoriesSetting],
  );
  const categoryOrder = menuCategories.map((c) => c.key);
  const categoryLabelMap = Object.fromEntries(menuCategories.map((c) => [c.key, c.label]));
  const getById = useCustomerStore((s) => s.getById);
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Top-level tab
  const [activeTab, setActiveTab] = useState<'menu' | 'records'>('menu');
  const [editPopup, setEditPopup] = useState<EditPopupState>(EDIT_POPUP_INITIAL);

  // Records tab filters
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [moodFilter, setMoodFilter] = useState<string | null>(null);
  const [globalBestFilter, setGlobalBestFilter] = useState(false);
  const [overlayPhotoId, setOverlayPhotoId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const records = getAllRecords();
  const reservations = useReservationStore((s) => s.reservations);

  useEffect(() => {
    hydrateFromDB();
  }, [hydrateFromDB]);

  useEffect(() => {
    const actionToast = searchParams.get('toast');
    if (!actionToast) {
      return;
    }

    const messageMap: Record<string, string> = {
      uploaded: '포트폴리오 사진을 저장했어요',
      deleted: '포트폴리오 사진을 삭제했어요',
    };

    const message = messageMap[actionToast];
    if (message) {
      setToasts((current) => [
        ...current,
        { id: `toast-${Date.now()}`, type: 'success', message },
      ]);
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete('toast');
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `/portfolio?${nextQuery}` : '/portfolio');
  }, [router, searchParams]);

  useEffect(() => {
    if (!migrationNotice) {
      return;
    }

    setToasts((current) => [
      ...current,
      { id: `toast-${Date.now()}`, type: migrationNotice.type, message: migrationNotice.message },
    ]);
    clearMigrationNotice();
  }, [clearMigrationNotice, migrationNotice]);

  const handleDismissToast = (id: string): void => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const pushToast = (type: ToastData['type'], message: string): void => {
    setToasts((current) => [
      ...current,
      { id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, type, message },
    ]);
  };

  const recordMap = useMemo(() => new Map(records.map((record) => [record.id, record])), [records]);

  // PF-2: 글로벌 베스트 — 외국어 고객 ID 집합
  const foreignCustomerIds = useMemo(() => {
    const ids = new Set<string>();
    reservations.forEach((r) => {
      if (r.language && r.language !== 'ko' && r.customerId) ids.add(r.customerId);
    });
    return ids;
  }, [reservations]);

  const customerMap = useMemo(
    () =>
      new Map(
        photos
          .map((p) => p.customerId)
          .filter((cid): cid is string => Boolean(cid))
          .filter((cid, i, arr) => arr.indexOf(cid) === i)
          .map((cid) => [cid, getById(cid)] as [string, Customer | undefined])
          .filter((entry): entry is [string, Customer] => entry[1] !== undefined),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos, getById],
  );

  // 0531 회의: 시술 기록 갤러리에는 온보딩에서 등록한 메뉴 사진(reference)까지 모두 자동 포함.
  // (사전상담 메뉴엔 일부만 노출될 수 있지만, 기록 갤러리는 전체를 카테고리별로 보여준다)
  const recordGalleryPhotos = useMemo(
    () => photos.filter((p) => p.kind === 'treatment' || p.kind === 'reference'),
    [photos],
  );

  const photoCards = useMemo(() => {
    return recordGalleryPhotos.map((photo) => {
      const customer = photo.customerId ? getById(photo.customerId) : undefined;
      const linkedRecord = photo.recordId ? recordMap.get(photo.recordId) : undefined;
      const serviceType = photo.serviceType
        ?? (linkedRecord ? DESIGN_SCOPE_LABEL[linkedRecord.consultation.designScope] ?? linkedRecord.consultation.designScope : undefined);
      const price = photo.price ?? linkedRecord?.finalPrice;
      const effectiveDate = photo.takenAt ?? linkedRecord?.createdAt ?? photo.createdAt;
      const searchSource = [
        customer?.name,
        photo.note,
        photo.designType,
        serviceType,
        ...(photo.tags ?? []),
        ...(photo.colorLabels ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return {
        photo,
        customer,
        linkedRecord,
        serviceType,
        price,
        effectiveDate,
        searchSource,
      };
    });
  }, [recordGalleryPhotos, getById, recordMap]);

  const filteredPhotos = useMemo(() => {
    const q = search.toLowerCase();
    const now = Date.now();

    return photoCards
      .filter(({ photo, searchSource, serviceType, price, effectiveDate }) => {
        if (serviceFilter !== 'all' && serviceType !== serviceFilter) return false;

        if (dateFilter !== 'all') {
          const takenAt = new Date(effectiveDate).getTime();
          const limitDays = dateFilter === '30d' ? 30 : dateFilter === '90d' ? 90 : 365;
          if (now - takenAt > limitDays * 24 * 60 * 60 * 1000) return false;
        }

        if (priceFilter !== 'all') {
          if (price == null) return false;
          if (priceFilter === 'under50000' && price >= 50000) return false;
          if (priceFilter === '50000to79999' && (price < 50000 || price >= 80000)) return false;
          if (priceFilter === '80000to119999' && (price < 80000 || price >= 120000)) return false;
          if (priceFilter === '120000plus' && price < 120000) return false;
        }

        // PF-2: 분위기 필터
        if (moodFilter && !(photo.tags ?? []).some((t) => t.includes(moodFilter.replace('#', '')))) return false;

        // PF-2: 글로벌 베스트
        if (globalBestFilter && (!photo.customerId || !foreignCustomerIds.has(photo.customerId))) return false;

        if (!q) return true;
        return searchSource.includes(q);
      })
      .sort((a, b) => {
        // 메뉴 등록된 사진 상단
        if (a.photo.isFeatured && !b.photo.isFeatured) return -1;
        if (!a.photo.isFeatured && b.photo.isFeatured) return 1;
        return new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();
      });
  }, [photoCards, serviceFilter, dateFilter, priceFilter, moodFilter, globalBestFilter, foreignCustomerIds, search]);

  const serviceOptions = useMemo(() => {
    const values = new Set<string>();
    photoCards.forEach(({ serviceType }) => {
      if (serviceType) values.add(serviceType);
    });
    return ['all', ...Array.from(values)];
  }, [photoCards]);

  // 등록된 포트폴리오의 태그 기반으로 동적 해시태그 생성
  const dynamicMoodTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    recordGalleryPhotos.forEach((photo) => {
      (photo.tags ?? []).forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => `#${tag}`);
  }, [recordGalleryPhotos]);

  const dateOptions: { key: DateFilter; label: string }[] = [
    { key: 'all', label: '전체 기간' },
    { key: '30d', label: '30일' },
    { key: '90d', label: '3개월' },
    { key: '1y', label: '1년' },
  ];

  const priceOptions: { key: PriceFilter; label: string }[] = [
    { key: 'all', label: '전체 가격' },
    { key: 'under50000', label: '5만원 미만' },
    { key: '50000to79999', label: '5-8만원' },
    { key: '80000to119999', label: '8-12만원' },
    { key: '120000plus', label: '12만원 이상' },
  ];

  // ── Menu tab data ────────────────────────────────────────────────────────
  const menuPhotos = getMenuPhotos();

  const menuByCategory = useMemo(() => {
    const grouped = new Map<string, PortfolioPhoto[]>();
    categoryOrder.forEach((cat) => grouped.set(cat, []));

    menuPhotos.forEach((photo) => {
      const cat = photo.styleCategory ?? 'simple';
      const arr = grouped.get(cat) ?? grouped.get('simple')!;
      arr.push(photo);
    });

    // Also handle unknown categories by bucketing to 'simple'
    return grouped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuPhotos, categoryOrder.join(',')]);

  // 메뉴에 추가 픽커용: 아직 메뉴에 없는(=isFeatured=false) 모든 포트폴리오 사진을 카테고리별로.
  // 0530: 기존엔 kind==='treatment' 사진만 노출해 온보딩 업로드(reference) 사진을 메뉴에 못 넣었음.
  //       reference 포함한 전체 비-featured 사진을 후보로 보여준다.
  const nonMenuByCategory = useMemo(() => {
    const grouped = new Map<string, PortfolioPhoto[]>();
    categoryOrder.forEach((cat) => grouped.set(cat, []));

    photos
      .filter((p) => !p.isFeatured)
      .forEach((photo) => {
        const cat = photo.styleCategory ?? 'simple';
        const arr = grouped.get(cat) ?? grouped.get('simple')!;
        arr.push(photo);
      });

    return grouped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, categoryOrder.join(',')]);

  // Picker state: which category is open
  const [pickerCategory, setPickerCategory] = useState<string | null>(null);

  const handleAddToMenu = (photo: PortfolioPhoto): void => {
    void toggleMenu(photo.id, photo.price).then((r) => {
      if (!r.success) pushToast('error', r.error ?? '메뉴 등록에 실패했어요');
    });
    setPickerCategory(null);
  };

  const addPhoto = usePortfolioStore((s) => s.addPhoto);
  const handleUploadPhoto = (file: File): void => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const cat = pickerCategory ?? 'simple';
      // 0530: 업로드 실패를 토스트로 노출 (이전엔 void 로 삼켜 "첨부가 안 됨" 처럼 보였음)
      void resizeTreatmentPhoto(dataUrl).then((resized) => addPhoto({
        customerId: '',
        kind: 'treatment',
        imageDataUrl: resized,
        // 0529 버그5: 커스텀 카테고리(custom-*)도 그대로 저장 (DesignCategory = builtin | string)
        styleCategory: cat,
        isFeatured: true,
        isPublic: true,
      })).then((r) => {
        if (r.success) pushToast('success', '메뉴에 사진을 추가했어요');
        else pushToast('error', r.error ?? '사진 업로드에 실패했어요. 다시 시도해 주세요');
      });
      setPickerCategory(null);
    };
    reader.readAsDataURL(file);
  };

  // Derived counts for header
  const menuCount = menuPhotos.length;
  const recordsCount = recordGalleryPhotos.length;

  // Overlay photo ids depend on active tab
  const overlayPhotoIds = useMemo(() => {
    if (activeTab === 'menu') {
      return menuPhotos.map((p) => p.id);
    }
    return filteredPhotos.map((fp) => fp.photo.id);
  }, [activeTab, menuPhotos, filteredPhotos]);

  return (
    <div className="flex flex-col pb-6">
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
      <AnimatePresence>
        <EditPopup state={editPopup} onClose={() => setEditPopup(EDIT_POPUP_INITIAL)} />
      </AnimatePresence>

      {overlayPhotoId && (
        <PortfolioOverlay
          photoIds={overlayPhotoIds}
          initialPhotoId={overlayPhotoId}
          photos={photos}
          customerMap={customerMap}
          recordMap={recordMap}
          onClose={() => setOverlayPhotoId(null)}
        />
      )}

      {/* Header */}
      <div className="px-4 md:px-0 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {activeTab === 'menu' ? (
            <>
              <h1 className="text-2xl font-bold text-text">메뉴판</h1>
              <span className="text-sm text-text-secondary tabular-nums">{menuCount}개</span>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text">시술 기록</h1>
              <span className="text-sm text-text-secondary tabular-nums">{recordsCount}장</span>
            </>
          )}
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/portfolio/upload')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          업로드
        </Button>
      </div>

      {/* Top-level tab bar */}
      <div className="flex border-b border-border mt-3">
        <button
          onClick={() => setActiveTab('menu')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'menu'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text',
          )}
        >
          메뉴
        </button>
        <button
          onClick={() => setActiveTab('records')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            activeTab === 'records'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-text',
          )}
        >
          시술 기록
        </button>
      </div>

      {/* ── MENU TAB ────────────────────────────────────────────────────────── */}
      {activeTab === 'menu' && (
        <div className="flex flex-col gap-6 px-4 md:px-0 pt-4">
          {!dbReady ? (
            <div className="flex items-center justify-center py-16">
              <svg className="h-6 w-6 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : menuCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="mb-3 h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-base font-medium text-text-secondary">메뉴판이 비어있습니다</p>
              <p className="mt-1 text-sm text-text-muted">포트폴리오에서 사진을 메뉴판에 등록하세요</p>
            </div>
          ) : (
            categoryOrder.map((cat) => {
              const items = menuByCategory.get(cat) ?? [];
              if (items.length === 0) return null;
              return (
                <CategorySection
                  key={cat}
                  category={cat}
                  label={categoryLabelMap[cat] ?? cat}
                  items={items}
                  nonMenuItems={nonMenuByCategory.get(cat) ?? []}
                  pickerOpen={pickerCategory === cat}
                  onOpenPicker={() => setPickerCategory(cat)}
                  onClosePicker={() => setPickerCategory(null)}
                  onAddToMenu={handleAddToMenu}
                  onUploadPhoto={handleUploadPhoto}
                  onRemoveFromMenu={(id) => { void toggleMenu(id).then((r) => { if (!r.success) pushToast('error', r.error ?? '메뉴 해제에 실패했어요'); }); }}
                  onOpenOverlay={(id) => setOverlayPhotoId(id)}
                  onRenameCategory={(newLabel) => {
                    void renameCategory(cat, newLabel).then((r) => {
                      if (!r.success) pushToast('error', r.error ?? '카테고리 이름 변경에 실패했어요');
                    });
                  }}
                />
              );
            })
          )}

          {/* "메뉴에 추가" sections for categories with no menu items yet — menuCount>0일 때만 */}
          {menuCount > 0 && categoryOrder.map((cat) => {
            const items = menuByCategory.get(cat) ?? [];
            const nonMenuItems = nonMenuByCategory.get(cat) ?? [];
            // 0529 버그4: 메뉴 사진이 없는 카테고리도 항상 표시해 사진 추가 진입점을 제공한다.
            // (이전엔 비메뉴 사진까지 없으면 섹션이 숨겨져 새로 추가한 카테고리가 영영 안 보였음)
            if (items.length > 0) return null;
            return (
              <CategorySection
                key={`empty-${cat}`}
                category={cat}
                label={categoryLabelMap[cat] ?? cat}
                items={[]}
                nonMenuItems={nonMenuItems}
                pickerOpen={pickerCategory === cat}
                onOpenPicker={() => setPickerCategory(cat)}
                onClosePicker={() => setPickerCategory(null)}
                onAddToMenu={handleAddToMenu}
                onUploadPhoto={handleUploadPhoto}
                onRemoveFromMenu={(id) => { void toggleMenu(id).then((r) => { if (!r.success) pushToast('error', r.error ?? '메뉴 해제에 실패했어요'); }); }}
                onOpenOverlay={(id) => setOverlayPhotoId(id)}
              />
            );
          })}
          {/* 카테고리 추가 */}
          <button
            onClick={() => setEditPopup({
              open: true, title: '새 카테고리 추가', placeholder: '카테고리 이름', initialValue: '',
              onConfirm: (v) => {
                void addCategory(v).then((r) => {
                  if (r.success) pushToast('success', '시술 종류를 추가했어요');
                  else pushToast('error', r.error ?? '카테고리 추가에 실패했어요. 다시 시도해 주세요');
                });
              },
            })}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors py-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            카테고리 추가
          </button>
        </div>
      )}

      {/* ── RECORDS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'records' && (
        <div className="flex flex-col gap-2 px-4 md:px-0 pt-4">
          {/* 검색바 + 필터 버튼 한 행 */}
          <div className="flex gap-2">
            <Input
              placeholder="고객명, 태그, 컬러, 디자인 타입 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1"
            />
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className={cn(
                'relative flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors shrink-0',
                filterOpen
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-surface text-text-secondary hover:border-primary/40',
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              필터
              {(moodFilter || globalBestFilter || serviceFilter !== 'all' || dateFilter !== 'all' || priceFilter !== 'all') && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {/* 접이식 필터 */}
          <AnimatePresence>
            {filterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="flex flex-col gap-2 pt-1">
                  {/* 해시태그 + 글로벌 베스트 */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {dynamicMoodTags.map((mood) => (
                      <button
                        key={mood}
                        onClick={() => setMoodFilter(moodFilter === mood ? null : mood)}
                        className={cn(
                          'flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border',
                          moodFilter === mood
                            ? 'bg-primary text-white border-primary'
                            : 'border-border text-text-secondary hover:border-primary/40 hover:text-primary bg-surface',
                        )}
                      >
                        {mood}
                      </button>
                    ))}
                    <button
                      onClick={() => setGlobalBestFilter((v) => !v)}
                      className={cn(
                        'flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border inline-flex items-center gap-1',
                        globalBestFilter
                          ? 'bg-primary text-white border-primary'
                          : 'border-border text-text-secondary hover:border-primary/40 hover:text-primary bg-surface',
                      )}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a15.3 15.3 0 014 9 15.3 15.3 0 01-4 9 15.3 15.3 0 01-4-9 15.3 15.3 0 014-9z" />
                      </svg>
                      글로벌 베스트
                    </button>
                  </div>

                  {/* 시술종류 + 날짜 + 가격 */}
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-3">
                    <select
                      value={serviceFilter}
                      onChange={(e) => setServiceFilter(e.target.value)}
                      className="h-9 md:h-10 w-full rounded-xl border border-border bg-surface px-4 pr-8 text-xs md:text-sm text-text appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%236b7280%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_8px_center] bg-no-repeat"
                    >
                      {serviceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option === 'all' ? '시술 종류 전체' : option}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap items-center justify-center gap-0.5 rounded-xl md:rounded-2xl border border-border bg-surface p-0.5 md:p-1">
                      {dateOptions.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setDateFilter(key)}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] md:px-3 md:py-1.5 md:text-xs font-medium transition-colors',
                            dateFilter === key ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-alt',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-0.5 rounded-xl md:rounded-2xl border border-border bg-surface p-0.5 md:p-1">
                      {priceOptions.map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setPriceFilter(key)}
                          className={cn(
                            'rounded-full px-2.5 py-1 text-[11px] md:px-3 md:py-1.5 md:text-xs font-medium transition-colors',
                            priceFilter === key ? 'bg-primary text-white' : 'text-text-secondary hover:bg-surface-alt',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 필터 초기화 */}
                  {(moodFilter || globalBestFilter || serviceFilter !== 'all' || dateFilter !== 'all' || priceFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setMoodFilter(null);
                        setGlobalBestFilter(false);
                        setServiceFilter('all');
                        setDateFilter('all');
                        setPriceFilter('all');
                      }}
                      className="self-start text-xs text-text-muted hover:text-primary transition-colors"
                    >
                      필터 초기화
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Photo grid — R14: 카테고리별 그룹핑. 카테고리 없는 사진은 '기타' 섹션 */}
          {filteredPhotos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="mb-3 h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="text-base font-medium text-text-secondary">
                {search || serviceFilter !== 'all' || dateFilter !== 'all' || priceFilter !== 'all' || moodFilter || globalBestFilter
                  ? '검색 결과가 없습니다'
                  : '아직 시술 기록이 없습니다'}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {search || serviceFilter !== 'all' || dateFilter !== 'all' || priceFilter !== 'all' || moodFilter || globalBestFilter
                  ? '검색어나 필터를 변경해보세요'
                  : '사진을 업로드하여 포트폴리오를 시작하세요'}
              </p>
              {!search && serviceFilter === 'all' && dateFilter === 'all' && priceFilter === 'all' && !moodFilter && !globalBestFilter && (
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => router.push('/portfolio/upload')}
                >
                  첫 사진 업로드
                </Button>
              )}
            </div>
          ) : (() => {
            // R14: categoryOrder 순서로 그룹핑, 나머지는 '기타'
            type PhotoEntry = typeof filteredPhotos[number];
            const grouped = new Map<string, PhotoEntry[]>();
            categoryOrder.forEach((cat) => grouped.set(cat, []));
            const etcKey = '__etc__';
            grouped.set(etcKey, []);

            filteredPhotos.forEach((entry) => {
              const cat = entry.photo.styleCategory;
              if (cat && grouped.has(cat)) {
                grouped.get(cat)!.push(entry);
              } else {
                grouped.get(etcKey)!.push(entry);
              }
            });

            // 빈 카테고리 제외, '기타'는 항목 있을 때만
            const sections: { key: string; label: string; entries: PhotoEntry[] }[] = [];
            categoryOrder.forEach((cat) => {
              const entries = grouped.get(cat) ?? [];
              if (entries.length > 0) {
                sections.push({ key: cat, label: categoryLabelMap[cat] ?? cat, entries });
              }
            });
            const etcEntries = grouped.get(etcKey) ?? [];
            if (etcEntries.length > 0) {
              sections.push({ key: etcKey, label: '기타', entries: etcEntries });
            }

            return (
              <div className="flex flex-col gap-6">
                {sections.map(({ key, label, entries }) => (
                  <div key={key} className="flex flex-col gap-2">
                    {/* 섹션 헤더 */}
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-text tracking-tight">{label}</h3>
                      <span className="text-xs text-text-muted tabular-nums">{entries.length}장</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    {/* 사진 그리드 */}
                    <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
                      {entries.map(({ photo, customer, serviceType, price, effectiveDate }, idx) => {
                        const imgSrc = photo.imageDataUrl || NAIL_FALLBACKS[idx % NAIL_FALLBACKS.length];
                        return (
                          <div
                            key={photo.id}
                            className="break-inside-avoid mb-3 group rounded-xl overflow-hidden bg-surface-alt shadow-sm hover:shadow-md transition-shadow"
                          >
                            <button
                              onClick={() => setOverlayPhotoId(photo.id)}
                              className="relative block w-full overflow-hidden"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={imgSrc}
                                alt={customer?.name ?? '포트폴리오'}
                                className="w-full h-auto block transition-transform group-hover:scale-105"
                                loading="lazy"
                              />
                              {photo.isFeatured && (
                                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-amber-400 text-white text-[9px] font-bold shadow-sm">
                                  메뉴
                                </span>
                              )}
                            </button>
                            <div className="p-2.5 space-y-1.5">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {customer?.name ?? '미지정'}
                                </p>
                                <p className="text-[10px] text-muted-foreground shrink-0">{formatDateDot(effectiveDate)}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-1">
                                {serviceType && (
                                  <span className="max-w-[48%] truncate px-2 py-0.5 rounded border border-border bg-muted text-[10px] font-medium text-muted-foreground">
                                    {serviceType}
                                  </span>
                                )}
                                {photo.designType && (
                                  <span className="max-w-[48%] truncate px-2 py-0.5 rounded border border-border bg-muted text-[10px] font-medium text-muted-foreground">
                                    {photo.designType}
                                  </span>
                                )}
                              </div>
                              <div className="min-h-4 flex items-center">
                                {price != null && (
                                  <p className="text-[11px] font-semibold text-foreground truncate">{formatPrice(price)}</p>
                                )}
                              </div>
                              <MenuToggleRow
                                photoId={photo.id}
                                isFeatured={photo.isFeatured}
                                featuredPrice={photo.isFeatured ? photo.price : undefined}
                                onError={(msg) => pushToast('error', msg)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

// ── Category Section Component ─────────────────────────────────────────────────
interface CategorySectionProps {
  category: string;
  label: string;
  items: PortfolioPhoto[];
  nonMenuItems: PortfolioPhoto[];
  pickerOpen: boolean;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onAddToMenu: (photo: PortfolioPhoto) => void;
  onUploadPhoto: (file: File) => void;
  onRemoveFromMenu: (id: string) => void;
  onOpenOverlay: (id: string) => void;
  onRenameCategory?: (newLabel: string) => void;
}

function CategorySection({
  label,
  items,
  nonMenuItems,
  pickerOpen,
  onOpenPicker,
  onClosePicker,
  onAddToMenu,
  onUploadPhoto,
  onRemoveFromMenu,
  onOpenOverlay,
  onRenameCategory,
}: CategorySectionProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 0529 버그4/5: 메뉴 사진이 아직 없는 카테고리는 자동 편집모드로 시작해
  // '메뉴에 추가' 진입점을 바로 노출 (수정 버튼을 못 찾던 문제 완화)
  const [editMode, setEditMode] = useState(items.length === 0);
  return (
    <div className="flex flex-col gap-3">
      {/* Section header — 인라인 편집 + 수정 모드 토글 */}
      <CategoryHeader
        label={label}
        count={items.length}
        editMode={editMode}
        onToggleEditMode={() => setEditMode((v) => !v)}
        onRename={onRenameCategory}
      />

      {/* Menu cards */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((photo, idx) => (
            <MenuCard
              key={photo.id}
              photo={photo}
              fallbackIdx={idx}
              editMode={editMode}
              onRemove={() => onRemoveFromMenu(photo.id)}
              onOpenOverlay={() => onOpenOverlay(photo.id)}
            />
          ))}
        </div>
      )}

      {/* Add to menu button — 편집 모드일 때만 노출 */}
      {editMode && (
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUploadPhoto(file);
            e.target.value = '';
          }}
        />
        <button
          onClick={pickerOpen ? onClosePicker : onOpenPicker}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors py-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          메뉴에 추가
        </button>

        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <div className="pt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                {/* 사진 업로드 버튼 */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 flex flex-col items-center justify-center gap-1 hover:bg-primary/10 transition-colors"
                >
                  <svg className="w-6 h-6 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <span className="text-[10px] text-primary/60 font-medium">사진 올리기</span>
                </button>
                {nonMenuItems.map((photo, idx) => {
                  const imgSrc = photo.imageDataUrl || NAIL_FALLBACKS[idx % NAIL_FALLBACKS.length];
                  return (
                    <button
                      key={photo.id}
                      onClick={() => onAddToMenu(photo)}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary transition-colors group"
                    >
                      <Image
                        src={imgSrc}
                        alt={photo.designType ?? '사진'}
                        fill
                        unoptimized={imgSrc.startsWith('data:')}
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
    </div>
  );
}

// ── Menu Card Component ────────────────────────────────────────────────────────
interface MenuCardProps {
  photo: PortfolioPhoto;
  fallbackIdx: number;
  editMode: boolean;
  onRemove: () => void;
  onOpenOverlay: () => void;
}

function MenuCard({ photo, fallbackIdx, editMode, onRemove, onOpenOverlay }: MenuCardProps): React.ReactElement {
  const imgSrc = photo.imageDataUrl || NAIL_FALLBACKS[fallbackIdx % NAIL_FALLBACKS.length];
  const updatePhotoMetadata = usePortfolioStore((s) => s.updatePhotoMetadata);
  const setRepresentative = usePortfolioStore((s) => s.setRepresentative);

  return (
    <div className="flex items-center gap-3.5 bg-surface rounded-2xl p-3 border border-border/60 shadow-sm">
      {/* 썸네일 — 메뉴판 느낌으로 크게 */}
      <button onClick={onOpenOverlay} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0">
        <Image src={imgSrc} alt={photo.designType ?? ''} fill unoptimized={imgSrc.startsWith('data:')} className="object-cover" />
        {(photo.isStaffPick || photo.isPopular || photo.isRepresentative) && (
          <div className="absolute top-1 left-1 flex flex-wrap gap-0.5 max-w-[calc(100%-0.5rem)]">
            {photo.isRepresentative && <span className="px-1.5 py-0.5 rounded bg-text text-white text-[9px] font-bold shadow-sm">대표</span>}
            {photo.isStaffPick && <span className="px-1.5 py-0.5 rounded bg-primary text-white text-[9px] font-bold shadow-sm">추천</span>}
            {photo.isPopular && <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold shadow-sm">인기</span>}
          </div>
        )}
      </button>

      {/* 정보 */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        {/* 제목 + 가격 (메뉴판 스타일) */}
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex-1 min-w-0">
            <InlineEditText
              value={photo.designType ?? '미지정'}
              onSave={(v) => { void updatePhotoMetadata(photo.id, { designType: v }); }}
              readOnly={!editMode}
            />
          </div>
          <MenuCardPrice photoId={photo.id} price={photo.price} readOnly={!editMode} />
        </div>

        {/* 서비스 타입 부제 */}
        {photo.serviceType && (
          <span className="text-xs text-text-secondary truncate">{photo.serviceType}</span>
        )}

        {/* 편집 모드일 때만: 추천/인기 토글 + 이동 + 해제 */}
        {editMode && (
          <div className="flex items-center gap-1 flex-wrap mt-1">
            <button
              type="button"
              aria-pressed={!!photo.isStaffPick}
              aria-label="직원추천 표시 토글"
              onClick={(e) => { e.stopPropagation(); void updatePhotoMetadata(photo.id, { isStaffPick: !photo.isStaffPick }); }}
              className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors',
                photo.isStaffPick ? 'bg-primary text-white' : 'bg-surface-alt text-text-muted',
              )}
            >추천</button>
            <button
              type="button"
              aria-pressed={!!photo.isPopular}
              aria-label="인기 표시 토글"
              onClick={(e) => { e.stopPropagation(); void updatePhotoMetadata(photo.id, { isPopular: !photo.isPopular }); }}
              className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors',
                photo.isPopular ? 'bg-amber-500 text-white' : 'bg-surface-alt text-text-muted',
              )}
            >인기</button>
            <button
              type="button"
              aria-pressed={!!photo.isRepresentative}
              aria-label="이 카테고리의 대표(커버) 사진으로 지정"
              onClick={(e) => { e.stopPropagation(); void setRepresentative(photo.id, !photo.isRepresentative); }}
              className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors',
                photo.isRepresentative ? 'bg-text text-white' : 'bg-surface-alt text-text-muted',
              )}
              title="이 카테고리의 대표(커버) 사진으로 지정"
            >대표</button>
            <MenuCategoryMove photoId={photo.id} currentCategory={photo.styleCategory ?? 'simple'} />
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="ml-auto text-[10px] text-text-muted hover:text-red-500 transition-colors"
            >
              해제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
