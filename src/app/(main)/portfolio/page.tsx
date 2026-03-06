'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Input, BentoGrid, BentoCard, Button } from '@/components/ui';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useCustomerStore } from '@/store/customer-store';
import { useRecordsStore } from '@/store/records-store';
import { UploadPhotoModal } from '@/components/portfolio/UploadPhotoModal';
import { cn } from '@/lib/cn';
import type { PortfolioPhotoKind } from '@/types/portfolio';

type FilterKind = 'all' | PortfolioPhotoKind;

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
  const photos = usePortfolioStore((s) => s.photos);
  const getById = useCustomerStore((s) => s.getById);
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  
  const [search, setSearch] = useState('');
  const [filterKind, setFilterKind] = useState<FilterKind>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const records = getAllRecords();

  const filteredPhotos = useMemo(() => {
    const q = search.toLowerCase();
    
    return photos
      .filter((photo) => {
        if (filterKind !== 'all' && photo.kind !== filterKind) return false;
        
        if (!q) return true;
        
        const customer = getById(photo.customerId);
        if (customer?.name.toLowerCase().includes(q)) return true;
        
        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [photos, filterKind, search, getById]);

  const stats = useMemo(() => {
    const referenceCount = photos.filter((p) => p.kind === 'reference').length;
    const treatmentCount = photos.filter((p) => p.kind === 'treatment').length;
    return { total: photos.length, referenceCount, treatmentCount };
  }, [photos]);

  const FILTER_TABS: { key: FilterKind; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'reference', label: '레퍼런스' },
    { key: 'treatment', label: '시술' },
  ];

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="px-4 md:px-0 pt-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">포트폴리오</h1>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsUploadOpen(true)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          업로드
        </Button>
      </div>

      <BentoGrid cols={3} className="px-4 md:px-0">
        <BentoCard span="1x1" variant="accent">
          <div className="p-4 flex flex-col items-center justify-center h-full">
            <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {stats.total}
            </span>
            <span className="text-xs text-text-secondary mt-1">전체 사진</span>
          </div>
        </BentoCard>
        <BentoCard span="1x1" variant="accent">
          <div className="p-4 flex flex-col items-center justify-center h-full">
            <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {stats.referenceCount}
            </span>
            <span className="text-xs text-text-secondary mt-1">레퍼런스</span>
          </div>
        </BentoCard>
        <BentoCard span="1x1" variant="accent">
          <div className="p-4 flex flex-col items-center justify-center h-full">
            <span className="text-2xl font-extrabold text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>
              {stats.treatmentCount}
            </span>
            <span className="text-xs text-text-secondary mt-1">시술 사진</span>
          </div>
        </BentoCard>
      </BentoGrid>

      <div className="px-4 md:px-0 flex flex-col gap-3">
        <Input
          placeholder="고객 이름으로 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-0.5 p-1 rounded-full bg-surface-alt border border-border self-start">
          {FILTER_TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterKind(key)}
              className={cn(
                'px-5 py-1.5 rounded-full text-xs font-semibold transition-all',
                filterKind === key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-0">
        {filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="mb-3 h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <p className="text-base font-medium text-text-secondary">
              {search ? '검색 결과가 없습니다' : '아직 포트폴리오가 없습니다'}
            </p>
            <p className="mt-1 text-sm text-text-muted">
              {search ? '다른 검색어를 시도해보세요' : '사진을 업로드하여 포트폴리오를 시작하세요'}
            </p>
            {!search && (
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => setIsUploadOpen(true)}
              >
                첫 사진 업로드
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredPhotos.map((photo) => {
              const customer = getById(photo.customerId);
              const linkedRecord = photo.recordId ? records.find((r) => r.id === photo.recordId) : undefined;
              const treatmentLabel = linkedRecord 
                ? DESIGN_SCOPE_LABEL[linkedRecord.consultation.designScope] ?? linkedRecord.consultation.designScope
                : undefined;
              return (
                <button
                  key={photo.id}
                  onClick={() => router.push(`/portfolio/${photo.id}`)}
                  className="group relative aspect-square rounded-xl overflow-hidden bg-surface-alt shadow-sm hover:shadow-md transition-shadow"
                >
                  <Image
                    src={photo.imageDataUrl}
                    alt={customer?.name ?? '포트폴리오'}
                    fill
                    unoptimized
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 pt-6">
                    <p className="text-xs font-medium text-white truncate">
                      {customer?.name ?? '알 수 없음'}
                    </p>
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-medium',
                          photo.kind === 'reference'
                            ? 'bg-white/20 text-white'
                            : 'bg-primary/80 text-white'
                        )}
                      >
                        {KIND_LABEL[photo.kind]}
                      </span>
                      {treatmentLabel && (
                        <span className="px-2 py-0.5 rounded bg-white/30 text-[10px] font-medium text-white">
                          {treatmentLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <UploadPhotoModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
