'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Modal, Button, Input } from '@/components/ui';
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

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadPhotoModal({ isOpen, onClose, onSuccess }: UploadPhotoModalProps): React.ReactElement {
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  const records = getAllRecords();

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const customerRecords = selectedCustomerId
    ? records.filter((r) => r.customerId === selectedCustomerId)
    : [];

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }, [previewUrl]);

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile || !selectedCustomerId) {
      setError('고객을 선택해주세요');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const dataUrl = await resizePortfolioImage(selectedFile);
      
      const result = addPhoto({
        customerId: selectedCustomerId,
        recordId: selectedRecordId || undefined,
        kind: selectedKind,
        imageDataUrl: dataUrl,
        note: note.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error ?? '업로드 실패');
        return;
      }

      resetForm();
      onSuccess?.();
      onClose();
    } catch {
      setError('이미지 처리 중 오류가 발생했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

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
    setError(null);
    setCustomerSearch('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  const handleClose = useCallback((): void => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const kindOptions: { key: PortfolioPhotoKind; label: string }[] = [
    { key: 'treatment', label: '시술' },
    { key: 'reference', label: '레퍼런스' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="사진 업로드">
      <div className="flex flex-col gap-5 p-5">
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
              <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-surface-alt">
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
                className="mt-3 text-sm text-primary font-medium hover:underline block mx-auto"
              >
                다른 사진 선택
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video max-h-40 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="text-sm text-text-secondary">사진을 선택하세요</span>
            </button>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">
            고객 선택 <span className="text-error">*</span>
          </label>
          <Input
            placeholder="고객 이름 검색"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            className="mb-2"
          />
          {(customerSearch || selectedCustomerId) && (
            <div className="max-h-32 overflow-y-auto rounded-xl border border-border bg-surface">
              {filteredCustomers.length === 0 ? (
                <p className="p-3 text-sm text-text-muted text-center">검색 결과가 없습니다</p>
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
                      'w-full px-3 py-2.5 text-left text-sm transition-colors flex items-center gap-2',
                      selectedCustomerId === customer.id
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-surface-alt text-text'
                    )}
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
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
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">종류</label>
          <div className="flex gap-2">
            {kindOptions.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedKind(key)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                  selectedKind === key
                    ? 'bg-primary text-white'
                    : 'bg-surface-alt text-text-secondary hover:bg-surface-alt/80'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {selectedCustomerId && customerRecords.length > 0 && (
          <div>
            <label className="text-sm font-medium text-text-secondary mb-1.5 block">
              상담 기록 연결 (선택)
            </label>
            <select
              value={selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface text-text text-sm"
            >
              <option value="">연결 안함</option>
              {customerRecords.slice(0, 10).map((record) => (
                <option key={record.id} value={record.id}>
                  {formatDateDot(record.createdAt)} - {DESIGN_SCOPE_LABEL[record.consultation.designScope] ?? record.consultation.designScope}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-text-secondary mb-1.5 block">메모 (선택)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="사진에 대한 메모를 입력하세요"
            className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-text-muted resize-none"
            rows={2}
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-error/10 text-error text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            취소
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            loading={isProcessing}
            disabled={!selectedFile || !selectedCustomerId}
            className="flex-1"
          >
            업로드
          </Button>
        </div>
      </div>
    </Modal>
  );
}
