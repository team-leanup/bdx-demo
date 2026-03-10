'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BentoGrid, BentoCard, Button, Modal, ToastContainer } from '@/components/ui';
import type { ToastData } from '@/components/ui';
import { FeatureDiscovery } from '@/components/onboarding/FeatureDiscovery';
import { KPICards } from '@/components/dashboard/KPICards';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { ServiceAnalytics } from '@/components/dashboard/ServiceAnalytics';
import { CustomerAnalytics } from '@/components/dashboard/CustomerAnalytics';
import { DesignerPerformance } from '@/components/dashboard/DesignerPerformance';
import { WeeklySummary } from '@/components/dashboard/WeeklySummary';
import { HourlyBookings } from '@/components/dashboard/HourlyBookings';
import { formatDateDot, formatPrice } from '@/lib/format';
import { DESIGN_SCOPE_LABEL } from '@/lib/labels';
import { useAuthStore } from '@/store/auth-store';
import { useRecordsStore } from '@/store/records-store';
import { useCustomerStore } from '@/store/customer-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useReservationStore } from '@/store/reservation-store';
import {
  computeRegularVisitRate,
  computePeakHours,
  computeUpsellMetrics,
  computeForeignReservationSummary,
  computeGoldenTimeTargets,
} from '@/lib/analytics';
import type { ConsultationRecord } from '@/types/consultation';

interface PopularTreatmentPhotoBase {
  photoId: string;
  name: string;
  imageDataUrl: string;
  customerName: string;
  effectiveDate: string;
  colorLabels: string[];
  price: number | undefined;
  note: string | undefined;
}

interface PopularTreatmentThumbnail extends PopularTreatmentPhotoBase {
  rank: number;
  count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });
  const role = useAuthStore((s) => s.role);
  const isOwner = useAuthStore((s) => s.isOwner);
  const activeDesignerName = useAuthStore((s) => s.activeDesignerName);
  const records = useRecordsStore((s) => s.records);
  const customers = useCustomerStore((s) => s.customers);
  const getCustomerById = useCustomerStore((s) => s.getById);
  const photos = usePortfolioStore((s) => s.photos);
  const reservations = useReservationStore((s) => s.reservations);
  const [selectedTreatment, setSelectedTreatment] = useState<PopularTreatmentThumbnail | null>(null);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const regularVisitRate = useMemo(() => computeRegularVisitRate(customers), [customers]);
  const peakHours = useMemo(() => computePeakHours(reservations), [reservations]);
  const upsellMetrics = useMemo(() => computeUpsellMetrics(records), [records]);
  const foreignReservationSummary = useMemo(
    () => computeForeignReservationSummary(reservations),
    [reservations],
  );
  const goldenTimeTargets = useMemo(
    () => computeGoldenTimeTargets(customers, reservations),
    [customers, reservations],
  );
  const recordMap = useMemo<Map<string, ConsultationRecord>>(
    () => new Map(records.map((record) => [record.id, record])),
    [records],
  );

  const popularTreatmentThumbnails = useMemo(() => {
    const treatmentPhotos: PopularTreatmentPhotoBase[] = [];

    photos
      .filter((photo) => photo.kind === 'treatment')
      .forEach((photo) => {
        const linkedRecord = photo.recordId ? recordMap.get(photo.recordId) : undefined;
        const serviceType = photo.serviceType
          ?? (linkedRecord
            ? DESIGN_SCOPE_LABEL[linkedRecord.consultation.designScope] ?? linkedRecord.consultation.designScope
            : undefined);

        if (!serviceType) {
          return;
        }

        const effectiveDate = photo.takenAt ?? linkedRecord?.createdAt ?? photo.createdAt;

        treatmentPhotos.push({
          photoId: photo.id,
          name: serviceType,
          imageDataUrl: photo.imageDataUrl,
          customerName: getCustomerById(photo.customerId)?.name ?? '알 수 없는 고객',
          effectiveDate,
          colorLabels: photo.colorLabels ?? [],
          price: photo.price ?? linkedRecord?.finalPrice,
          note: photo.note,
        });
      });

    const grouped = new Map<string, PopularTreatmentPhotoBase[]>();
    treatmentPhotos.forEach((photo) => {
      const bucket = grouped.get(photo.name) ?? [];
      bucket.push(photo);
      grouped.set(photo.name, bucket);
    });

    return Array.from(grouped.entries())
      .map(([name, items]) => {
        const representative = [...items].sort(
          (a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime(),
        )[0];

        return {
          ...representative,
          rank: 0,
          count: items.length,
        };
      })
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }

        return new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime();
      })
      .slice(0, 3)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }, [photos, recordMap, getCustomerById]);

  const handleDismissToast = (id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const handleCopyReminder = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      setToasts((current) => [
        ...current,
        { id: `toast-${Date.now()}`, type: 'success', message: '리마인더 문구를 복사했어요' },
      ]);
    } catch {
      setToasts((current) => [
        ...current,
        { id: `toast-${Date.now()}`, type: 'error', message: '복사에 실패했어요. 다시 시도해 주세요' },
      ]);
    }
  };

  if (!isOwner()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-surface-alt flex items-center justify-center">
          <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="text-lg font-bold text-text">원장님 전용 페이지입니다</p>
          <p className="text-sm text-text-muted">대시보드는 원장 모드에서만 접근할 수 있습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <FeatureDiscovery
        featureId="dashboard-intro"
        icon="📊"
        title="대시보드"
        description={"상담 건수, 인기 디자인, 선택 패턴 등\n상담 기록 기반 현황을 한눈에 확인하세요."}
      />
      {/* 헤더 */}
      <div className="px-4 md:px-0 pt-4">
        <h1 className="text-2xl font-bold text-text">대시보드</h1>
        <p className="mt-0.5 text-sm text-text-secondary">{today} 기준</p>
      </div>

      {/* Staff banner */}
      {role === 'staff' && activeDesignerName && (
        <div className="mx-4 md:mx-0 flex items-center gap-2 rounded-xl bg-primary/10 px-4 py-2.5">
          <svg className="h-4 w-4 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-xs font-medium text-primary">{activeDesignerName}님의 대시보드</p>
        </div>
      )}

      {/* Full Bento Grid */}
      <div className="px-4 md:px-0">
        <BentoGrid cols={4}>
          <BentoCard span="4x1" variant="accent">
            <div className="flex h-full flex-col gap-4 p-4 md:p-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text-secondary">업셀링 리포트</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-extrabold leading-none text-primary md:text-4xl">
                      {formatPrice(upsellMetrics.totalUpsellRevenue)}
                    </span>
                    <span className="pb-1 text-xs font-medium text-text-muted">BDX 상담으로 추가된 옵션 매출</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-surface/80 px-4 py-3">
                  <p className="text-[11px] text-text-muted">업셀링 적용 상담</p>
                  <p className="mt-1 text-lg font-bold text-text">{upsellMetrics.upsellConsultations}건</p>
                  <p className="text-[11px] text-text-muted">전체 상담의 {upsellMetrics.upsellRate}%</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-border bg-surface/80 px-4 py-3">
                  <p className="text-[11px] text-text-muted">상담당 평균 추가 매출</p>
                  <p className="mt-1 text-lg font-bold text-text">{formatPrice(upsellMetrics.averageUpsellRevenue)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface/80 px-4 py-3">
                  <p className="text-[11px] text-text-muted">가장 크게 견인한 옵션</p>
                  <p className="mt-1 text-lg font-bold text-text">{upsellMetrics.topCategoryLabel}</p>
                  <p className="text-[11px] text-text-muted">{formatPrice(upsellMetrics.topCategoryRevenue)}</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface/80 px-4 py-3">
                  <p className="text-[11px] text-text-muted">원장님 체감 포인트</p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {upsellMetrics.upsellConsultations > 0
                      ? '디자인/파츠 제안이 바로 추가 매출로 연결되고 있어요.'
                      : '상담에서 디자인/파츠 옵션을 제안해보세요.'}
                  </p>
                </div>
              </div>
            </div>
          </BentoCard>

          <BentoCard span="2x1">
            <div className="flex h-full flex-col gap-4 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-text-secondary">외국인 예약 현황</h2>
                  <p className="mt-1 text-xs text-text-muted">오늘 외국어 예약과 언어별 상담 준비 상태</p>
                </div>
                <div className="rounded-2xl bg-primary/10 px-3 py-2 text-right">
                  <p className="text-[10px] text-primary">오늘의 외국인 예약</p>
                  <p className="text-2xl font-extrabold text-primary">{foreignReservationSummary.foreignerCount}명</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-surface-alt px-4 py-3">
                  <p className="text-[11px] text-text-muted">준비 완료</p>
                  <p className="mt-1 text-lg font-bold text-text">{foreignReservationSummary.totalReady}건</p>
                </div>
                <div className="rounded-2xl border border-border bg-surface-alt px-4 py-3">
                  <p className="text-[11px] text-text-muted">추가 준비 필요</p>
                  <p className="mt-1 text-lg font-bold text-text">{foreignReservationSummary.totalPending}건</p>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {foreignReservationSummary.statuses.map((status) => (
                  <div
                    key={status.language}
                    className={`rounded-2xl border border-border px-4 py-3 ${status.total === 0 ? 'bg-surface/50 opacity-60' : 'bg-surface-alt'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-xs font-bold text-primary">{status.flag}</span>
                        <div>
                          <p className="text-sm font-semibold text-text">{status.label}</p>
                          <p className="text-[11px] text-text-muted">예약 {status.total}건 · 준비 완료 {status.ready}건</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary">{status.readyRate}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${status.readyRate}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          <BentoCard span="2x1">
            <div className="flex h-full flex-col gap-4 p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-text-secondary">재방문 골든타임 알림</h2>
                  <p className="mt-1 text-xs text-text-muted">평균 주기 28일 기준 이번 주 리마인더 대상</p>
                </div>
                <div className="rounded-2xl bg-amber-100 px-3 py-2 text-right text-amber-800">
                  <p className="text-[10px]">이번 주 대상</p>
                  <p className="text-2xl font-extrabold">{goldenTimeTargets.length}명</p>
                </div>
              </div>

              {goldenTimeTargets.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-surface-alt px-4 text-center text-sm text-text-muted">
                  이번 주에는 별도 리마인더가 필요한 고객이 없습니다.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {goldenTimeTargets.map((target) => (
                    <div key={target.customerId} className="rounded-2xl border border-border bg-surface-alt px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text">{target.customerName}</p>
                          <p className="mt-0.5 text-[11px] text-text-muted">
                            {target.assignedDesignerName} · {target.recentServiceLabel} · 마지막 방문 후 {target.daysSinceLastVisit}일
                          </p>
                          <p className="mt-1 text-[11px] text-text-muted">권장 연락일 {formatDateDot(target.expectedReservationDate)}</p>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => handleCopyReminder(target.reminderMessage)}>
                          문구 복사
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </BentoCard>

          {/* KPI Row: 4 × 1×1 BentoCards (returned as Fragment children) */}
          <KPICards />

          {/* 이번 주 요약: 4×1 */}
          <BentoCard span="4x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">이번 주 요약</h2>
              <WeeklySummary />
            </div>
          </BentoCard>

          {/* 상담 추이: 4×1 */}
          <BentoCard span="4x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">상담 추이</h2>
              <RevenueChart />
            </div>
          </BentoCard>

          {/* 디자이너별 상담 현황: 4×1 */}
          <BentoCard span="4x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">디자이너별 상담 현황</h2>
              <DesignerPerformance />
            </div>
          </BentoCard>

          {/* 시간대별 예약: 4×1 */}
          <BentoCard span="4x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">시간대별 예약</h2>
              <HourlyBookings />
            </div>
          </BentoCard>

          {/* 인기 시술 Top 3: 2×1 */}
          <BentoCard span="2x1" variant="accent">
            <div className="p-4 md:p-5 h-full flex flex-col">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-text-secondary">인기 시술 Top 3</h2>
                <span className="text-[10px] font-medium text-text-muted">포트폴리오 기준</span>
              </div>

              {popularTreatmentThumbnails.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface/60 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-text-secondary">시술 사진이 아직 없습니다</p>
                  <p className="mt-1 text-xs text-text-muted">포트폴리오에 시술 사진을 등록하면 인기 시술 썸네일이 자동으로 표시됩니다.</p>
                  <Button size="sm" className="mt-4" onClick={() => router.push('/portfolio')}>
                    포트폴리오 보기
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 flex-1">
                  {popularTreatmentThumbnails.map((treatment) => (
                    <button
                      key={treatment.photoId}
                      type="button"
                      onClick={() => setSelectedTreatment(treatment)}
                      className="flex items-center gap-3 rounded-2xl border border-border bg-surface/80 p-2.5 text-left transition-colors hover:bg-surface"
                    >
                      <div
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                        style={{ background: 'var(--color-primary)' }}
                      >
                        {treatment.rank}
                      </div>
                      <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-surface-alt">
                        <Image
                          src={treatment.imageDataUrl}
                          alt={treatment.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text">{treatment.name}</p>
                        <p className="mt-0.5 truncate text-[11px] text-text-muted">{treatment.colorLabels[0] ?? '컬러번호 미등록'}</p>
                      </div>
                      <span className="text-xs font-semibold text-primary">{treatment.count}장</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </BentoCard>

          {/* 단골 방문율: 1×1 */}
          <BentoCard span="1x1" variant="accent">
            <div className="p-4 h-full flex flex-col justify-between">
              <span className="text-xs font-semibold text-text-secondary">단골 방문율</span>
              <div className="flex flex-col gap-1">
                <span
                  className="text-3xl font-extrabold text-primary leading-none"
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {regularVisitRate}%
                </span>
                <div className="h-2 w-full rounded-full bg-surface-alt overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${regularVisitRate}%`, background: 'var(--color-primary)' }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-text-muted">이번 달 기준</span>
            </div>
          </BentoCard>

          {/* 피크타임: 1×1 */}
          <BentoCard span="1x1" variant="accent">
            <div className="p-4 h-full flex flex-col gap-2">
              <span className="text-xs font-semibold text-text-secondary">피크타임</span>
              <div className="flex flex-col gap-1.5 flex-1">
                {peakHours.map((h, i) => (
                  <div key={h.time} className="flex items-center gap-2">
                    <div
                      className="h-1.5 rounded-full flex-1"
                      style={{
                        background: 'var(--color-primary)',
                        opacity: 1 - i * 0.25,
                      }}
                    />
                    <span className="text-[10px] text-text-secondary flex-shrink-0">{h.time.split('~')[0]}</span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>

          {/* 인기 서비스: 2×1 */}
          <BentoCard span="2x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">인기 서비스</h2>
              <ServiceAnalytics />
            </div>
          </BentoCard>

          {/* 고객 분석: 2×1 */}
          <BentoCard span="2x1">
            <div className="p-4 md:p-5">
              <h2 className="text-sm font-semibold text-text-secondary mb-3">고객 분석</h2>
              <CustomerAnalytics />
            </div>
          </BentoCard>
        </BentoGrid>
      </div>

      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

      <Modal
        isOpen={selectedTreatment !== null}
        onClose={() => setSelectedTreatment(null)}
        title={selectedTreatment?.name ?? '인기 시술'}
      >
        {selectedTreatment && (
          <div className="flex flex-col gap-4 p-5">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-surface-alt">
              <Image
                src={selectedTreatment.imageDataUrl}
                alt={selectedTreatment.name}
                fill
                unoptimized
                className="object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-surface-alt p-4 text-sm">
              <div>
                <p className="text-[10px] font-medium text-text-muted">시술명</p>
                <p className="mt-0.5 font-semibold text-text">{selectedTreatment.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-text-muted">대표 가격</p>
                <p className="mt-0.5 font-semibold text-text">
                  {selectedTreatment.price != null ? formatPrice(selectedTreatment.price) : '미등록'}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-text-muted">고객</p>
                <p className="mt-0.5 font-semibold text-text">{selectedTreatment.customerName}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-text-muted">촬영일</p>
                <p className="mt-0.5 font-semibold text-text">{formatDateDot(selectedTreatment.effectiveDate)}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-text-muted">컬러번호</p>
              {selectedTreatment.colorLabels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTreatment.colorLabels.map((color, index) => (
                    <span
                      key={`${color}-${index}`}
                      className="rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-semibold text-text"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-muted">등록된 컬러번호가 없습니다</p>
              )}
            </div>

            {selectedTreatment.note && (
              <div className="rounded-2xl border border-border bg-surface px-4 py-3">
                <p className="mb-1 text-xs font-medium text-text-muted">메모</p>
                <p className="text-sm leading-relaxed text-text-secondary">{selectedTreatment.note}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
