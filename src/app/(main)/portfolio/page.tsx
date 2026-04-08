'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Input, Button, ToastContainer } from '@/components/ui';
import type { ToastData } from '@/components/ui';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useCustomerStore } from '@/store/customer-store';
import { useRecordsStore } from '@/store/records-store';
import { useReservationStore } from '@/store/reservation-store';
import { PortfolioOverlay } from '@/components/portfolio/PortfolioOverlay';
import { cn } from '@/lib/cn';
import { formatDateDot, formatPrice } from '@/lib/format';
import type { PortfolioPhotoKind } from '@/types/portfolio';
import type { Customer } from '@/types/customer';
import type { ConsultationRecord } from '@/types/consultation';

type FilterKind = 'all' | PortfolioPhotoKind;
type DateFilter = 'all' | '30d' | '90d' | '1y';
type PriceFilter = 'all' | 'under50000' | '50000to79999' | '80000to119999' | '120000plus';

const KIND_LABEL: Record<PortfolioPhotoKind, string> = {
  reference: '레퍼런스',
  treatment: '시술',
};

const DESIGN_SCOPE_LABEL: Record<string, string> = {
  solid_tone: '원컬러',
  solid_point: '단색+포인트',
  full_art: '풀아트',
  monthly_art: '이달의 아트',
};

export default function PortfolioPage(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const photos = usePortfolioStore((s) => s.photos);
  const hydrateFromDB = usePortfolioStore((s) => s.hydrateFromDB);
  const migrationNotice = usePortfolioStore((s) => s.migrationNotice);
  const clearMigrationNotice = usePortfolioStore((s) => s.clearMigrationNotice);
  const getById = useCustomerStore((s) => s.getById);
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const [search, setSearch] = useState('');
  const [filterKind, setFilterKind] = useState<FilterKind>('all');
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
          .filter((cid, i, arr) => arr.indexOf(cid) === i)
          .map((cid) => [cid, getById(cid)] as [string, Customer | undefined])
          .filter((entry): entry is [string, Customer] => entry[1] !== undefined),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photos, getById],
  );

  const photoCards = useMemo(() => {
    return photos.map((photo) => {
      const customer = getById(photo.customerId);
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
  }, [photos, getById, recordMap]);

  const filteredPhotos = useMemo(() => {
    const q = search.toLowerCase();
    const now = Date.now();

    return photoCards
      .filter(({ photo, searchSource, serviceType, price, effectiveDate }) => {
        if (filterKind !== 'all' && photo.kind !== filterKind) return false;
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
        if (globalBestFilter && !foreignCustomerIds.has(photo.customerId)) return false;

        if (!q) return true;
        return searchSource.includes(q);
      })
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
  }, [photoCards, filterKind, serviceFilter, dateFilter, priceFilter, moodFilter, globalBestFilter, foreignCustomerIds, search]);

  const stats = useMemo(() => {
    const referenceCount = photos.filter((p) => p.kind === 'reference').length;
    const treatmentCount = photos.filter((p) => p.kind === 'treatment').length;
    return { total: photos.length, referenceCount, treatmentCount };
  }, [photos]);

  const FILTER_TABS: { key: FilterKind; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'treatment', label: '시술' },
    { key: 'reference', label: '레퍼런스' },
  ];

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
    photos.forEach((photo) => {
      (photo.tags ?? []).forEach((tag) => {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => `#${tag}`);
  }, [photos]);

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

  return (
    <div className="flex flex-col gap-4 pb-6">
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      {/* PF-3: 오버레이 */}
      {overlayPhotoId && (
        <PortfolioOverlay
          photoIds={filteredPhotos.map((fp) => fp.photo.id)}
          initialPhotoId={overlayPhotoId}
          photos={photos}
          customerMap={customerMap}
          recordMap={recordMap}
          onClose={() => setOverlayPhotoId(null)}
        />
      )}
      <div className="px-4 md:px-0 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-text">포트폴리오</h1>
          <span className="text-sm text-text-secondary tabular-nums">{stats.total}장</span>
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

      <div className="px-4 md:px-0 flex flex-col gap-2">
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

        {/* kind 탭 — 항상 보임 */}
        <div className="flex gap-0.5 p-1 rounded-full bg-surface-alt border border-border self-start">
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterKind(key)}
              className={cn(
                'px-5 py-1.5 rounded-full text-xs font-medium transition-all',
                filterKind === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text',
              )}
            >
              {label}
            </button>
          ))}
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
      </div>

      <div className="px-4 md:px-0">
        {filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-base font-medium text-text-secondary">
              {search || filterKind !== 'all' || serviceFilter !== 'all' || dateFilter !== 'all' || priceFilter !== 'all' || moodFilter || globalBestFilter
                ? '검색 결과가 없습니다'
                : '아직 포트폴리오가 없습니다'}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {search || filterKind !== 'all' || serviceFilter !== 'all' || dateFilter !== 'all' || priceFilter !== 'all' || moodFilter || globalBestFilter
                ? '검색어나 필터를 변경해보세요'
                : '사진을 업로드하여 포트폴리오를 시작하세요'}
            </p>
            {!search && filterKind === 'all' && serviceFilter === 'all' && dateFilter === 'all' && priceFilter === 'all' && !moodFilter && !globalBestFilter && (
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => router.push('/portfolio/upload')}
              >
                첫 사진 업로드
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredPhotos.map(({ photo, customer, serviceType, price, effectiveDate }, idx) => {
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
              const imgSrc = photo.imageDataUrl || NAIL_FALLBACKS[idx % NAIL_FALLBACKS.length];
              return (
                <button
                  key={photo.id}
                  onClick={() => setOverlayPhotoId(photo.id)}
                  className="group rounded-xl overflow-hidden bg-surface-alt shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={imgSrc}
                      alt={customer?.name ?? '포트폴리오'}
                      fill
                      unoptimized={imgSrc.startsWith('data:')}
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {customer?.name ?? '미지정'}
                      </p>
                      <p className="text-[10px] text-muted-foreground shrink-0">{formatDateDot(effectiveDate)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className={cn(
                          'max-w-[80px] truncate px-2 py-0.5 rounded border text-[10px] font-medium',
                          photo.kind === 'reference'
                            ? 'border-border bg-muted text-muted-foreground'
                            : 'border-primary/30 bg-primary/10 text-primary'
                        )}
                      >
                        {KIND_LABEL[photo.kind]}
                      </span>
                      {serviceType && (
                        <span className="max-w-[80px] truncate px-2 py-0.5 rounded border border-border bg-muted text-[10px] font-medium text-muted-foreground">
                          {serviceType}
                        </span>
                      )}
                      {photo.designType && (
                        <span className="max-w-[80px] truncate px-2 py-0.5 rounded border border-border bg-muted text-[10px] font-medium text-muted-foreground">
                          {photo.designType}
                        </span>
                      )}
                    </div>
                    <div className="h-4 flex items-center">
                      {price != null && (
                        <p className="text-[11px] font-semibold text-foreground truncate">{formatPrice(price)}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
