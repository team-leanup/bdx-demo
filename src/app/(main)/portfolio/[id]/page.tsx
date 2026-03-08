'use client';

import { use, useState, Suspense } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge, Card, Modal } from '@/components/ui';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useCustomerStore } from '@/store/customer-store';
import { useRecordsStore } from '@/store/records-store';
import { formatDateDot, formatPrice } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { PortfolioPhotoKind } from '@/types/portfolio';

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

const BODY_PART_LABEL: Record<string, string> = {
  hand: '핸드',
  foot: '페디',
};

const OFF_TYPE_LABEL: Record<string, string> = {
  none: '없음',
  same_shop: '자샵오프',
  other_shop: '타샵오프',
};

const EXTENSION_TYPE_LABEL: Record<string, string> = {
  none: '없음',
  repair: '리페어',
  extension: '연장',
};

const EXPRESSION_LABEL: Record<string, string> = {
  solid: '기본',
  gradient: '그라데이션',
  french: '프렌치',
  magnetic: '마그네틱',
};

function PortfolioDetailContent({ id }: { id: string }): React.ReactElement {
  const router = useRouter();
  const photos = usePortfolioStore((s) => s.photos);
  const removePhoto = usePortfolioStore((s) => s.removePhoto);
  const getCustomerById = useCustomerStore((s) => s.getById);
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const photo = photos.find((p) => p.id === id);
  const customer = photo ? getCustomerById(photo.customerId) : undefined;
  const records = getAllRecords();
  const linkedRecord = photo?.recordId ? records.find((r) => r.id === photo.recordId) : undefined;

  const handleDelete = (): void => {
    if (!photo) return;
    removePhoto(photo.id);
    router.push('/portfolio');
  };

  if (!photo) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
        <svg className="mb-4 h-12 w-12 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
        </svg>
        <p className="text-lg font-semibold text-text">사진을 찾을 수 없습니다</p>
        <p className="mt-1 text-sm text-text-muted">삭제되었거나 존재하지 않는 사진입니다</p>
        <Button className="mt-6" onClick={() => router.push('/portfolio')}>
          포트폴리오로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 md:px-6">
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-text-secondary"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text">사진 상세</h1>
        <div className="flex-1" />
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-error/10 text-error hover:bg-error/20 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="mx-4">
        <div className="relative aspect-square w-full max-w-lg mx-auto rounded-2xl overflow-hidden bg-surface-alt shadow-lg">
          <Image
            src={photo.imageDataUrl}
            alt={customer?.name ?? '포트폴리오 사진'}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      </div>

      <Card className="mx-4 shadow-md rounded-2xl">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold text-white"
                style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}
              >
                {customer?.name.charAt(0) ?? '?'}
              </div>
              <div>
                <p className="font-semibold text-text">{customer?.name ?? '알 수 없는 고객'}</p>
                <p className="text-xs text-text-muted">{formatDateDot(photo.createdAt)}</p>
              </div>
            </div>
            <Badge
              variant={photo.kind === 'reference' ? 'neutral' : 'primary'}
              size="md"
            >
              {KIND_LABEL[photo.kind]}
            </Badge>
          </div>

          {photo.note && (
            <div className="rounded-xl bg-surface-alt p-4">
              <p className="text-xs font-medium text-text-muted mb-1">메모</p>
              <p className="text-sm text-text leading-relaxed">{photo.note}</p>
            </div>
          )}

          {photo.tags && photo.tags.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-muted mb-2">태그</p>
              <div className="flex flex-wrap gap-1.5">
                {photo.tags.map((tag, idx) => (
                  <Badge key={idx} variant="neutral" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {linkedRecord && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-primary">시술 기록</p>
                <p className="text-lg font-bold text-primary">{formatPrice(linkedRecord.finalPrice)}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-medium text-text-muted mb-0.5">시술 날짜</p>
                  <p className="font-medium text-text">{formatDateDot(linkedRecord.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-text-muted mb-0.5">시술 부위</p>
                  <p className="font-medium text-text">{BODY_PART_LABEL[linkedRecord.consultation.bodyPart] ?? linkedRecord.consultation.bodyPart}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-text-muted mb-0.5">시술 종류</p>
                  <p className="font-medium text-text">{DESIGN_SCOPE_LABEL[linkedRecord.consultation.designScope] ?? linkedRecord.consultation.designScope}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-text-muted mb-0.5">오프</p>
                  <p className="font-medium text-text">{OFF_TYPE_LABEL[linkedRecord.consultation.offType] ?? '없음'}</p>
                </div>
                {linkedRecord.consultation.extensionType !== 'none' && (
                  <div>
                    <p className="text-[10px] font-medium text-text-muted mb-0.5">연장/리페어</p>
                    <p className="font-medium text-text">{EXTENSION_TYPE_LABEL[linkedRecord.consultation.extensionType]}</p>
                  </div>
                )}
                {linkedRecord.consultation.expressions && linkedRecord.consultation.expressions.length > 0 && linkedRecord.consultation.expressions[0] !== 'solid' && (
                  <div>
                    <p className="text-[10px] font-medium text-text-muted mb-0.5">표현 기법</p>
                    <p className="font-medium text-text">
                      {linkedRecord.consultation.expressions.map(e => EXPRESSION_LABEL[e] ?? e).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {linkedRecord.notes && (
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <p className="text-[10px] font-medium text-text-muted mb-1">상담 메모</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{linkedRecord.notes}</p>
                </div>
              )}
            </div>
          )}

          {customer && (
            <Button
              variant="secondary"
              fullWidth
              onClick={() => router.push(`/customers/${customer.id}`)}
            >
              고객 상세 보기
            </Button>
          )}
        </div>
      </Card>

      <AnimatePresence>
        {showDeleteConfirm && (
          <Modal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            title="사진 삭제"
          >
            <div className="p-5 flex flex-col gap-4">
              <p className="text-sm text-text-secondary">
                이 사진을 삭제하시겠습니까?<br />
                삭제된 사진은 복구할 수 없습니다.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  취소
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleDelete}
                >
                  삭제
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function PortfolioDetailPage({ params }: Props): React.ReactElement {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PortfolioDetailContent id={id} />
    </Suspense>
  );
}
