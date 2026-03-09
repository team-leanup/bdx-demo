'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button, Input } from '@/components/ui';
import { useCustomerStore } from '@/store/customer-store';
import { useRecordsStore } from '@/store/records-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { resizePortfolioImage } from '@/lib/image-utils';
import { formatDateDot } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { PortfolioPhotoKind } from '@/types/portfolio';

const DESIGN_SCOPE_LABEL: Record<string, string> = {
  solid_tone: '원컬러',
  solid_point: '단색+포인트',
  full_art: '풀아트',
  monthly_art: '이달의 아트',
};

interface UploadPhotoFormProps {
  onCancel: () => void;
  onSuccess?: () => void;
}

export function UploadPhotoForm({ onCancel, onSuccess }: UploadPhotoFormProps): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customers = useCustomerStore((s) => s.customers);
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  const addPhoto = usePortfolioStore((s) => s.addPhoto);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [selectedKind, setSelectedKind] = useState<PortfolioPhotoKind>('treatment');
  const [note, setNote] = useState('');
  const [takenAt, setTakenAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [serviceType, setServiceType] = useState('');
  const [designType, setDesignType] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [colorInput, setColorInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  const records = getAllRecords();

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  const customerRecords = selectedCustomerId
    ? records.filter((record) => record.customerId === selectedCustomerId)
    : [];

  const selectedRecord = customerRecords.find((record) => record.id === selectedRecordId);

  const parseList = useCallback((value: string): string[] | undefined => {
    const parsed = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    return parsed.length > 0 ? parsed : undefined;
  }, []);

  const resetForm = useCallback((): void => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedCustomerId('');
    setSelectedRecordId('');
    setSelectedKind('treatment');
    setNote('');
    setTakenAt(new Date().toISOString().slice(0, 10));
    setServiceType('');
    setDesignType('');
    setPriceInput('');
    setTagInput('');
    setColorInput('');
    setError(null);
    setCustomerSearch('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    },
    [previewUrl],
  );

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile || !selectedCustomerId) {
      setError('고객을 선택해주세요');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const dataUrl = await resizePortfolioImage(selectedFile);
      const derivedServiceType = selectedRecord
        ? DESIGN_SCOPE_LABEL[selectedRecord.consultation.designScope] ?? selectedRecord.consultation.designScope
        : serviceType.trim() || undefined;
      const derivedPrice = selectedRecord?.finalPrice ?? (priceInput ? Number(priceInput) : undefined);

      const result = await addPhoto({
        customerId: selectedCustomerId,
        recordId: selectedRecordId || undefined,
        kind: selectedKind,
        imageDataUrl: dataUrl,
        takenAt: takenAt || undefined,
        note: note.trim() || undefined,
        serviceType: derivedServiceType,
        designType: designType.trim() || undefined,
        price: Number.isFinite(derivedPrice) ? derivedPrice : undefined,
        tags: parseList(tagInput),
        colorLabels: parseList(colorInput),
      });

      if (!result.success) {
        setError(result.error ?? '업로드 실패');
        return;
      }

      resetForm();
      onSuccess?.();
    } catch {
      setError('이미지 처리 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = useCallback((): void => {
    resetForm();
    onCancel();
  }, [onCancel, resetForm]);

  const kindOptions: { key: PortfolioPhotoKind; label: string }[] = [
    { key: 'treatment', label: '시술' },
    { key: 'reference', label: '레퍼런스' },
  ];

  return (
    <div className="flex flex-col gap-5 px-4 py-5 sm:p-5 md:p-6">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative">
            <div className="relative mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-2xl bg-surface-alt">
              <Image
                src={previewUrl}
                alt="미리보기"
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mx-auto mt-3 block text-sm font-medium text-primary hover:underline"
            >
              다른 사진 선택
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-[4/3] max-h-64 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border transition-colors hover:border-primary hover:bg-primary/5"
          >
            <svg className="h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <span className="text-sm text-text-secondary">사진을 선택하세요</span>
          </button>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          고객 선택 <span className="text-error">*</span>
        </label>
        <Input
          placeholder="고객 이름 검색"
          value={customerSearch}
          onChange={(e) => setCustomerSearch(e.target.value)}
          className="mb-2"
        />
        {(customerSearch || selectedCustomerId) && (
          <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-surface">
            {filteredCustomers.length === 0 ? (
              <p className="p-3 text-center text-sm text-text-muted">검색 결과가 없습니다</p>
            ) : (
              filteredCustomers.slice(0, 10).map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId(customer.id);
                    setCustomerSearch(customer.name);
                    setSelectedRecordId('');
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors',
                    selectedCustomerId === customer.id
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-text hover:bg-surface-alt',
                  )}
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {customer.name.charAt(0)}
                  </span>
                  {customer.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">종류</label>
        <div className="flex gap-2">
          {kindOptions.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKind(key)}
              className={cn(
                'flex-1 rounded-xl py-2.5 text-sm font-medium transition-all',
                selectedKind === key
                  ? 'bg-primary text-white'
                  : 'bg-surface-alt text-text-secondary hover:bg-surface-alt/80',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {selectedCustomerId && customerRecords.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">
            상담 기록 연결 (선택)
          </label>
          <select
            value={selectedRecordId}
            onChange={(e) => setSelectedRecordId(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text"
          >
            <option value="">연결 안함</option>
            {customerRecords.slice(0, 10).map((record) => (
              <option key={record.id} value={record.id}>
                {formatDateDot(record.createdAt)} -{' '}
                {DESIGN_SCOPE_LABEL[record.consultation.designScope] ?? record.consultation.designScope}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">메모 (선택)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="사진에 대한 메모를 입력하세요"
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted"
          rows={3}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">촬영일</label>
          <input
            type="date"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">시술 종류</label>
          <Input
            value={selectedRecord ? (DESIGN_SCOPE_LABEL[selectedRecord.consultation.designScope] ?? selectedRecord.consultation.designScope) : serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            disabled={Boolean(selectedRecord)}
            placeholder="예: 원컬러, 풀아트"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">디자인 타입</label>
          <Input
            value={designType}
            onChange={(e) => setDesignType(e.target.value)}
            placeholder="예: 웨딩, 시럽, 키치"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">가격</label>
          <Input
            value={selectedRecord ? String(selectedRecord.finalPrice) : priceInput}
            onChange={(e) => setPriceInput(e.target.value.replace(/[^0-9]/g, ''))}
            disabled={Boolean(selectedRecord)}
            placeholder="예: 85000"
            inputMode="numeric"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">태그</label>
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="쉼표로 구분: 봄, 웨딩, 자석젤"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-text-secondary">컬러</label>
          <Input
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            placeholder="쉼표로 구분: 핑크, 누드, 브라운"
          />
        </div>
      </div>

      {error && <div className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</div>}

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row">
        <Button
          variant="secondary"
          onClick={handleCancel}
          className="h-12 w-full text-base sm:h-11 sm:flex-1 sm:text-base"
        >
          취소
        </Button>
        <Button
          variant="primary"
          onClick={handleUpload}
          loading={isProcessing}
          disabled={!selectedFile || !selectedCustomerId}
          className="h-14 w-full text-base shadow-sm sm:h-11 sm:flex-1 sm:text-base"
        >
          업로드
        </Button>
      </div>
    </div>
  );
}
