'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/auth-store';
import { useCustomerStore } from '@/store/customer-store';
import { useShopStore } from '@/store/shop-store';
import type { BookingChannel, BookingRequest } from '@/types/consultation';
import type { Locale } from '@/store/locale-store';
import { getNowInKoreaIso, getTodayInKorea } from '@/lib/format';

function generateTimeSlots(start = '10:00', end = '20:00'): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let h = startH, m = startM;
  while (h < endH || (h === endH && m <= endM)) {
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    m += 30;
    if (m >= 60) { h++; m = 0; }
  }
  return slots;
}

const CHANNEL_OPTIONS: { value: BookingChannel; label: string }[] = [
  { value: 'kakao', label: '카카오톡' },
  { value: 'naver', label: '네이버' },
  { value: 'phone', label: '전화' },
  { value: 'walk_in', label: '워크인' },
];

const LANGUAGE_OPTIONS: { value: Locale; flag: string; label: string }[] = [
  { value: 'ko', flag: '🇰🇷', label: '한국어' },
  { value: 'en', flag: '🇺🇸', label: 'English' },
  { value: 'zh', flag: '🇨🇳', label: '中文' },
  { value: 'ja', flag: '🇯🇵', label: '日本語' },
];

const SERVICE_OPTIONS = ['원컬러', '그라데이션', '자석젤', '아트'];

interface ReservationFormProps {
  onSubmit: (reservation: BookingRequest) => void;
  onCancel?: () => void;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to read image as data URL'));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read image file'));
    };

    reader.readAsDataURL(file);
  });
}

export function ReservationForm({ onSubmit, onCancel }: ReservationFormProps) {
  const today = getTodayInKorea();
  const currentShopId = useAuthStore((s) => s.currentShopId);
  const customers = useCustomerStore((s) => s.customers);
  const designers = useShopStore((s) => s.designers);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDate, setFormDate] = useState(today);
  const [formTime, setFormTime] = useState('');
  const [formChannel, setFormChannel] = useState<BookingChannel>('kakao');
  const [formNote, setFormNote] = useState('');
  const [formLanguage, setFormLanguage] = useState<Locale>('ko');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formDesignerId, setFormDesignerId] = useState('');
  const [serviceLabel, setServiceLabel] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const query = customerSearch.toLowerCase();
    const seen = new Set<string>();
    return customers.filter((c) => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return c.name.toLowerCase().includes(query) ||
        c.phone?.includes(customerSearch);
    }).slice(0, 5);
  }, [customerSearch, customers]);

  const handleSelectCustomer = (customerId: string): void => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setSelectedCustomerId(customerId);
      setFormName(customer.name);
      setFormPhone(customer.phone || '');
      setCustomerSearch(customer.name);
      setShowCustomerDropdown(false);
    }
  };

  const handleCustomerSearchChange = (value: string): void => {
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    if (selectedCustomerId) {
      const customer = customers.find((c) => c.id === selectedCustomerId);
      if (customer && customer.name !== value) {
        setSelectedCustomerId(null);
      }
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = Math.max(0, 3 - formImages.length);
    const selectedFiles = Array.from(files).slice(0, remainingSlots);

    if (selectedFiles.length === 0) {
      e.target.value = '';
      return;
    }

    try {
      const uploadedImages = await Promise.all(selectedFiles.map((file) => readFileAsDataUrl(file)));
      setFormImages((prev) => [...prev, ...uploadedImages]);
    } catch (error) {
      console.error('[ReservationForm] image upload error:', error);
    }

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formTime || !currentShopId) return;

    const newBooking: BookingRequest = {
      id: `booking-new-${Date.now()}`,
      shopId: currentShopId,
      customerName: formName.trim(),
      phone: formPhone.trim(),
      reservationDate: formDate,
      reservationTime: formTime,
      channel: formChannel,
      requestNote: formNote.trim() || undefined,
      referenceImageUrls: formImages,
      status: 'confirmed',
      createdAt: getNowInKoreaIso(),
      language: formLanguage,
      designerId: formDesignerId || undefined,
      serviceLabel: serviceLabel || undefined,
      customerId: selectedCustomerId || undefined,
    };
    onSubmit(newBooking);
    setFormName('');
    setFormPhone('');
    setFormDate(today);
    setFormTime('');
    setFormChannel('kakao');
    setFormNote('');
    setFormLanguage('ko');
    setFormImages([]);
    setFormDesignerId('');
    setServiceLabel('');
    setCustomerSearch('');
    setSelectedCustomerId(null);
    onCancel?.();
  };

  return (
    <div className="flex flex-col gap-3 p-5">
        {/* 고객 검색 */}
        <div className="relative">
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            고객 검색 <span className="text-text-muted">(선택)</span>
          </label>
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => handleCustomerSearchChange(e.target.value)}
            onFocus={() => setShowCustomerDropdown(true)}
            placeholder="고객 이름 또는 전화번호"
            className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text placeholder-text-muted outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary"
          />
          {selectedCustomerId && (
            <span className="absolute right-3 top-8 text-[10px] text-success font-medium">연결됨</span>
          )}
          {showCustomerDropdown && filteredCustomers.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-surface shadow-lg max-h-40 overflow-y-auto">
              {filteredCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectCustomer(c.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-surface-alt transition-colors flex justify-between items-center"
                >
                  <span className="font-medium text-text">{c.name}</span>
                  <span className="text-xs text-text-muted">{c.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 고객명 */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            고객명 <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="고객 이름 입력"
            className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text placeholder-text-muted outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary"
          />
        </div>

        {/* 연락처 */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            연락처
          </label>
          <input
            type="tel"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
            placeholder="010-0000-0000"
            className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text placeholder-text-muted outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary"
          />
        </div>

        {/* 시술 종류 */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            시술 종류
          </label>
          <select
            value={serviceLabel}
            onChange={(e) => setServiceLabel(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary"
          >
            <option value="">선택 안함</option>
            {SERVICE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* 담당 디자이너 */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            담당 디자이너
          </label>
          <select
            value={formDesignerId}
            onChange={(e) => setFormDesignerId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary"
          >
            <option value="">미정</option>
            {designers.filter((d) => d.isActive).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}{d.role === 'owner' ? ' (원장)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 예약 일자 & 시간 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              예약 일자 <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-text-secondary">
              예약 시간 <span className="text-error">*</span>
            </label>
            <select
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary"
            >
              <option value="">시간 선택</option>
              {generateTimeSlots().map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 예약 채널 */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            예약 채널
          </label>
          <select
            value={formChannel}
            onChange={(e) => setFormChannel(e.target.value as BookingChannel)}
            className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary"
          >
            {CHANNEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 상담 언어 */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            상담 언어
          </label>
          <select
            value={formLanguage}
            onChange={(e) => setFormLanguage(e.target.value as Locale)}
            className="w-full rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.flag} {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* 요청사항 */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            요청사항 <span className="text-text-muted">(선택)</span>
          </label>
          <textarea
            value={formNote}
            onChange={(e) => setFormNote(e.target.value)}
            placeholder="고객 요청 사항을 입력하세요"
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-surface-alt px-3 py-2.5 text-sm text-text placeholder-text-muted outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:border-primary"
          />
        </div>

        {/* 참고 이미지 */}
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            참고 이미지 <span className="text-text-muted">(최대 3장)</span>
          </label>
          {formImages.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
            {formImages.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                <Image src={url} alt="" fill unoptimized className="object-cover" />
                <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          {formImages.length < 3 && (
            <label className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-alt py-3 text-sm text-text-muted cursor-pointer hover:border-primary hover:text-primary transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              이미지 추가
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* 등록 버튼 */}
        <Button
          fullWidth
          onClick={handleSubmit}
          disabled={!formName.trim() || !formTime}
        >
          등록
        </Button>
    </div>
  );
}
