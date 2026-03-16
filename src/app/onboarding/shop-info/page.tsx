'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AddressInput } from '@/components/ui/AddressInput';
import { TimeInput } from '@/components/ui/TimeInput';
import { Toggle } from '@/components/ui/Toggle';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/cn';

const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일'];

interface DaySchedule {
  open: boolean;
  openTime: string;
  closeTime: string;
}

export default function ShopInfoPage() {
  const router = useRouter();
  const { shopSettings, setShopSettings } = useAppStore();

  const [shopName, setShopName] = useState(shopSettings.shopName || '');
  const [phone, setPhone] = useState(shopSettings.shopPhone || '');
  const [address, setAddress] = useState(shopSettings.shopAddress || '');
  const [addressDetail, setAddressDetail] = useState(shopSettings.shopAddressDetail || '');
  // 일괄 vs 요일별
  const [bulkMode, setBulkMode] = useState(true);

  // 일괄 설정
  const [bulkOpen, setBulkOpen] = useState('10:00');
  const [bulkClose, setBulkClose] = useState('20:00');
  const [closedDays, setClosedDays] = useState<boolean[]>([false, false, false, false, false, false, true]); // 일요일 기본 휴무

  // 요일별 설정
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(
    DAYS_OF_WEEK.map((_, i) => ({
      open: i !== 6, // 일요일 기본 휴무
      openTime: '10:00',
      closeTime: '20:00',
    }))
  );

  const toggleClosedDay = (idx: number) => {
    setClosedDays((prev) => prev.map((v, i) => (i === idx ? !v : v)));
  };

  const updateDaySchedule = (idx: number, patch: Partial<DaySchedule>) => {
    setDaySchedules((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const handleNext = () => {
    // Build businessHours from the UI state
    // DAYS_OF_WEEK is [월,화,수,목,금,토,일] = dayOfWeek [1,2,3,4,5,6,0]
    const dayOfWeekMap = [1, 2, 3, 4, 5, 6, 0]; // index → dayOfWeek
    const businessHours = DAYS_OF_WEEK.map((_, idx) => {
      if (bulkMode) {
        return {
          dayOfWeek: dayOfWeekMap[idx],
          isOpen: !closedDays[idx],
          openTime: closedDays[idx] ? undefined : bulkOpen,
          closeTime: closedDays[idx] ? undefined : bulkClose,
        };
      }
      return {
        dayOfWeek: dayOfWeekMap[idx],
        isOpen: daySchedules[idx].open,
        openTime: daySchedules[idx].open ? daySchedules[idx].openTime : undefined,
        closeTime: daySchedules[idx].open ? daySchedules[idx].closeTime : undefined,
      };
    });
    setShopSettings({ shopName, shopPhone: phone, shopAddress: address, shopAddressDetail: addressDetail, businessHours });
    router.push('/onboarding/services');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 md:px-0 py-4 md:py-6"
    >
      <div className="flex flex-col gap-2 mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-text">매장 정보를 입력해주세요</h1>
      </div>

      <div className="flex flex-col gap-5 flex-1">
        {/* Basic info — 2col on tablet */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="매장명"
            placeholder="매장명을 입력하세요"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
          />
          <Input
            label="전화번호"
            type="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <AddressInput
          label="주소"
          value={{ address, addressDetail }}
          onChange={(addr, detail) => {
            setAddress(addr);
            setAddressDetail(detail);
          }}
        />

        {/* Business hours */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary">영업시간 설정</span>
            {/* Mode toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-border p-1 bg-surface">
              <button
                type="button"
                onClick={() => setBulkMode(true)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200',
                  bulkMode
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:text-text',
                )}
              >
                일괄 설정
              </button>
              <button
                type="button"
                onClick={() => setBulkMode(false)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-lg transition-all duration-200',
                  !bulkMode
                    ? 'bg-primary text-white'
                    : 'text-text-muted hover:text-text',
                )}
              >
                요일별 설정
              </button>
            </div>
          </div>

          {bulkMode ? (
            <div
              className="rounded-2xl border border-border p-4 flex flex-col gap-4"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              {/* Open/Close time */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs text-text-muted">오픈 시간</span>
                  <TimeInput value={bulkOpen} onChange={setBulkOpen} />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs text-text-muted">마감 시간</span>
                  <TimeInput value={bulkClose} onChange={setBulkClose} />
                </div>
              </div>

              {/* Closed days */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted">휴무일</span>
                <div className="flex gap-1.5">
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleClosedDay(idx)}
                      className={cn(
                        'flex-1 h-9 md:h-11 rounded-xl text-xs md:text-sm font-medium transition-all duration-200',
                        closedDays[idx]
                          ? 'bg-primary text-white'
                          : 'border border-border text-text-muted hover:border-primary/40',
                      )}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              className="rounded-2xl border border-border p-4 flex flex-col gap-3"
              style={{ backgroundColor: 'var(--color-surface)' }}
            >
              {DAYS_OF_WEEK.map((day, idx) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-5 text-sm font-medium text-text-secondary">{day}</span>
                  <Toggle
                    checked={daySchedules[idx].open}
                    onChange={(v) => updateDaySchedule(idx, { open: v })}
                    size="sm"
                  />
                  {daySchedules[idx].open ? (
                    <>
                      <TimeInput
                        size="sm"
                        value={daySchedules[idx].openTime}
                        onChange={(v) => updateDaySchedule(idx, { openTime: v })}
                      />
                      <span className="text-xs text-text-muted">~</span>
                      <TimeInput
                        size="sm"
                        value={daySchedules[idx].closeTime}
                        onChange={(v) => updateDaySchedule(idx, { closeTime: v })}
                      />
                    </>
                  ) : (
                    <span className="text-xs text-text-muted">휴무</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-6 flex flex-col gap-4">
        <Button size="lg" fullWidth onClick={handleNext}>
          다음
        </Button>
      </div>
    </motion.div>
  );
}
