'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { Button, Input } from '@/components/ui';
import { useCustomerStore } from '@/store/customer-store';
import { useAuthStore } from '@/store/auth-store';
import { useRecordsStore } from '@/store/records-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { resizePortfolioImage } from '@/lib/image-utils';
import { formatDateDot, getTodayInKorea } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { PortfolioPhotoKind } from '@/types/portfolio';

const PRESET_TAGS = ['봄', '웨딩', '자석젤', '키치', '내추럴', '글리터', '심플', '화려한스타일', '이달의아트', '프렌치', '그라데이션', '마그네틱'];
const PRESET_COLORS = ['핑크', '누드', '베이지', '화이트', '블랙', '레드', '코랄', '브라운', '퍼플', '블루'];

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
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const customers = useCustomerStore((s) => s.customers);
  const createCustomer = useCustomerStore((s) => s.createCustomer);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const getAllRecords = useRecordsStore((s) => s.getAllRecords);
  const addPhoto = usePortfolioStore((s) => s.addPhoto);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [selectedKind, setSelectedKind] = useState<PortfolioPhotoKind>('reference');
  const [note, setNote] = useState('');
  const [takenAt, setTakenAt] = useState(() => getTodayInKorea());
  const [serviceType, setServiceType] = useState('');
  const [designType, setDesignType] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColorInput, setCustomColorInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const records = getAllRecords();
  const allPhotos = usePortfolioStore((s) => s.photos);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  const customerRecords = selectedCustomerId
    ? records.filter((record) => record.customerId === selectedCustomerId)
    : [];

  const selectedRecord = customerRecords.find((record) => record.id === selectedRecordId);

  // 고객 선택 시 가장 최근 상담 기록 자동 매칭
  useEffect(() => {
    if (!selectedCustomerId) {
      setSelectedRecordId('');
      return;
    }
    const sorted = records
      .filter((r) => r.customerId === selectedCustomerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setSelectedRecordId(sorted[0]?.id ?? '');
  }, [selectedCustomerId, records]);

  // PF-1: 이전 레시피 (동일 고객의 최근 포트폴리오)
  const recentCustomerPhoto = useMemo(() => {
    if (!selectedCustomerId) return undefined;
    return allPhotos
      .filter((p) => p.customerId === selectedCustomerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [allPhotos, selectedCustomerId]);

  const handleCopyLastRecipe = useCallback((): void => {
    if (!recentCustomerPhoto) return;
    setSelectedTags(recentCustomerPhoto.tags ?? []);
    setSelectedColors(recentCustomerPhoto.colorLabels ?? []);
    if (recentCustomerPhoto.designType) setDesignType(recentCustomerPhoto.designType);
    if (recentCustomerPhoto.serviceType && !selectedRecord) setServiceType(recentCustomerPhoto.serviceType);
  }, [recentCustomerPhoto, selectedRecord]);

  const toggleTag = useCallback((tag: string): void => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const toggleColor = useCallback((color: string): void => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    );
  }, []);

  const addCustomTag = useCallback((): void => {
    const v = customTagInput.trim();
    if (v && !selectedTags.includes(v)) setSelectedTags((prev) => [...prev, v]);
    setCustomTagInput('');
  }, [customTagInput, selectedTags]);

  const addCustomColor = useCallback((): void => {
    const v = customColorInput.trim();
    if (v && !selectedColors.includes(v)) setSelectedColors((prev) => [...prev, v]);
    setCustomColorInput('');
  }, [customColorInput, selectedColors]);

  useEffect(() => {
    if (!showCustomerDropdown) return;

    const handleClickOutside = (event: MouseEvent): void => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCustomerDropdown]);

  const handleCustomerSearchChange = useCallback((value: string): void => {
    setCustomerSearch(value);
    setShowCustomerDropdown(true);

    if (!selectedCustomerId) return;

    const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
    if (selectedCustomer && selectedCustomer.name !== value) {
      setSelectedCustomerId('');
    }
  }, [customers, selectedCustomerId]);

  const handleSelectCustomer = useCallback((customerId: string): void => {
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return;

    setSelectedCustomerId(customer.id);
    setCustomerSearch(customer.name);
    setShowCustomerDropdown(false);
  }, [customers]);

  const handleCreateCustomer = useCallback((): void => {
    const customerName = customerSearch.trim();
    if (!customerName) return;

    const newCustomer = createCustomer({
      name: customerName,
      assignedDesignerId: activeDesignerId ?? undefined,
    });

    setSelectedCustomerId(newCustomer.id);
    setCustomerSearch(newCustomer.name);
    setShowCustomerDropdown(false);
  }, [activeDesignerId, createCustomer, customerSearch]);

  const resetForm = useCallback((): void => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl(null);
    setSelectedCustomerId('');
    setSelectedRecordId('');
    setSelectedKind('reference');
    setNote('');
    setTakenAt(getTodayInKorea());
    setServiceType('');
    setDesignType('');
    setPriceInput('');
    setSelectedTags([]);
    setCustomTagInput('');
    setSelectedColors([]);
    setCustomColorInput('');
    setError(null);
    setCustomerSearch('');
    setShowCustomerDropdown(false);

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
    if (!selectedFile) {
      setError('사진을 선택해주세요');
      return;
    }

    let effectiveCustomerId = selectedCustomerId;
    if (!effectiveCustomerId) {
      const placeholder = createCustomer({ name: '미지정' });
      effectiveCustomerId = placeholder.id;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const dataUrl = await resizePortfolioImage(selectedFile);
      const derivedServiceType = selectedRecord
        ? DESIGN_SCOPE_LABEL[selectedRecord.consultation.designScope] ?? selectedRecord.consultation.designScope
        : (serviceType.trim() ? DESIGN_SCOPE_LABEL[serviceType.trim()] ?? serviceType.trim() : undefined);
      const derivedPrice = selectedRecord?.finalPrice ?? (priceInput ? Number(priceInput) : undefined);

      const result = await addPhoto({
        customerId: effectiveCustomerId,
        recordId: selectedRecordId || undefined,
        kind: selectedKind,
        imageDataUrl: dataUrl,
        takenAt: takenAt || undefined,
        note: note.trim() || undefined,
        serviceType: derivedServiceType,
        designType: designType.trim() || undefined,
        price: Number.isFinite(derivedPrice) ? derivedPrice : undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        colorLabels: selectedColors.length > 0 ? selectedColors : undefined,
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
    { key: 'reference', label: '레퍼런스' },
    { key: 'treatment', label: '시술' },
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

      <div ref={customerDropdownRef}>
        <label className="mb-1.5 block text-sm font-medium text-text-secondary">
          고객 선택
        </label>
        <Input
          placeholder="고객 이름 검색"
          value={customerSearch}
          onChange={(e) => handleCustomerSearchChange(e.target.value)}
          onFocus={() => setShowCustomerDropdown(true)}
          className="mb-2"
        />
        {showCustomerDropdown && (customerSearch || selectedCustomerId) && (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-border bg-surface">
            {filteredCustomers.slice(0, 10).map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => handleSelectCustomer(customer.id)}
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
                <span className="truncate min-w-0 flex-1">{customer.name}</span>
              </button>
            ))}
            {customerSearch.trim() && !filteredCustomers.some((c) => c.name === customerSearch.trim()) && (
              <button
                type="button"
                onClick={handleCreateCustomer}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-primary border-t border-border hover:bg-primary/5 transition-colors"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">+</span>
                &apos;{customerSearch.trim()}&apos; 직접 추가하기
              </button>
            )}
            {filteredCustomers.length === 0 && !customerSearch.trim() && (
              <p className="p-3 text-center text-sm text-text-muted">검색 결과가 없습니다</p>
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

      <div className="grid gap-4 lg:grid-cols-2">
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
          <select
            value={selectedRecord ? selectedRecord.consultation.designScope : serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            disabled={Boolean(selectedRecord)}
            className="h-12 w-full rounded-xl border border-border bg-surface px-4 text-sm text-text appearance-none"
          >
            <option value="">선택해주세요</option>
            <option value="solid_tone">원컬러</option>
            <option value="solid_point">단색+포인트</option>
            <option value="full_art">풀아트</option>
            <option value="monthly_art">이달의 아트</option>
          </select>
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

      {/* PF-1: 이전 레시피 복사 버튼 */}
      {recentCustomerPhoto && (
        <button
          type="button"
          onClick={handleCopyLastRecipe}
          className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
        >
          <span>🔄</span>
          <span>지난번이랑 똑같이 (이전 레시피 복사)</span>
        </button>
      )}

      {/* PF-1: 태그 칩 UI */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-text-secondary">태그</label>
          <span className={cn(
            'rounded-full px-2 py-0.5 text-[10px] font-semibold border',
            selectedTags.length >= 3
              ? 'bg-success/10 text-success border-success/20'
              : 'bg-surface-alt text-text-muted border-border',
          )}>
            태그 {selectedTags.length}/3 (최소 3개)
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                selectedTags.includes(tag)
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-text-secondary hover:border-primary/40 bg-surface',
              )}
            >
              {tag}
            </button>
          ))}
          {selectedTags.filter((t) => !PRESET_TAGS.includes(t)).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className="rounded-full px-3 py-1 text-xs font-medium border bg-primary text-white border-primary"
            >
              {tag} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customTagInput}
            onChange={(e) => setCustomTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomTag(); } }}
            placeholder="직접 입력 후 Enter"
            className="flex-1 h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={addCustomTag}
            className="rounded-lg bg-surface-alt px-3 text-sm font-medium text-text-secondary hover:bg-border transition-colors"
          >
            추가
          </button>
        </div>
      </div>

      {/* PF-1: 컬러 칩 UI */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text-secondary">컬러</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => toggleColor(color)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                selectedColors.includes(color)
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'border-border text-text-secondary hover:border-rose-300 bg-surface',
              )}
            >
              {color}
            </button>
          ))}
          {selectedColors.filter((c) => !PRESET_COLORS.includes(c)).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => toggleColor(color)}
              className="rounded-full px-3 py-1 text-xs font-medium border bg-rose-500 text-white border-rose-500"
            >
              {color} ×
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customColorInput}
            onChange={(e) => setCustomColorInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomColor(); } }}
            placeholder="직접 입력 후 Enter"
            className="flex-1 h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={addCustomColor}
            className="rounded-lg bg-surface-alt px-3 text-sm font-medium text-text-secondary hover:bg-border transition-colors"
          >
            추가
          </button>
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
          disabled={!selectedFile || selectedTags.length < 3}
          className={cn(
            'h-14 w-full text-base shadow-sm sm:h-11 sm:flex-1 sm:text-base',
            selectedTags.length < 3 && 'opacity-50',
          )}
        >
          업로드
        </Button>
      </div>
    </div>
  );
}
