'use client';

import { useState } from 'react';
import { Card, Toggle, TimeInput } from '@/components/ui';
import { useAppStore } from '@/store/app-store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/cn';

const DAY_LABEL_KEYS = ['days_mon', 'days_tue', 'days_wed', 'days_thu', 'days_fri', 'days_sat', 'days_sun'];

interface DaySchedule {
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <p className="mb-2 px-4 md:px-0 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

export function OperatingHoursSection(): React.ReactElement {
  const t = useT();
  const { shopSettings, setShopSettings } = useAppStore();
  const storedHours = shopSettings.businessHours;
  const DAY_LABELS = DAY_LABEL_KEYS.map((k) => t(`settings.${k}`));
  const [bulkMode, setBulkMode] = useState(true);
  const [bulkOpen, setBulkOpen] = useState(() => {
    const openDay = storedHours.find((h) => h.isOpen);
    return openDay?.openTime ?? '10:00';
  });
  const [bulkClose, setBulkClose] = useState(() => {
    const openDay = storedHours.find((h) => h.isOpen);
    return openDay?.closeTime ?? '20:00';
  });
  const [bulkClosedDays, setBulkClosedDays] = useState<boolean[]>(() =>
    DAY_LABEL_KEYS.map((_, uiIdx) => {
      const dow = (uiIdx + 1) % 7;
      const h = storedHours.find((bh) => bh.dayOfWeek === dow);
      return h ? !h.isOpen : false;
    }),
  );
  const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(() =>
    DAY_LABEL_KEYS.map((_, uiIdx) => {
      const dow = (uiIdx + 1) % 7;
      const h = storedHours.find((bh) => bh.dayOfWeek === dow);
      return {
        isOpen: h?.isOpen ?? (uiIdx !== 6),
        openTime: h?.openTime ?? '10:00',
        closeTime: h?.closeTime ?? '20:00',
      };
    }),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const toggleBulkClosedDay = (index: number) => {
    setBulkClosedDays((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const updateDaySchedule = (index: number, patch: Partial<DaySchedule>) => {
    setDaySchedules((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s)),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);

    const businessHours = DAY_LABEL_KEYS.map((_, uiIdx) => {
      const dow = (uiIdx + 1) % 7;
      if (bulkMode) {
        const isClosed = bulkClosedDays[uiIdx];
        return {
          dayOfWeek: dow,
          isOpen: !isClosed,
          ...(!isClosed ? { openTime: bulkOpen, closeTime: bulkClose } : {}),
        };
      }
      const s = daySchedules[uiIdx];
      return {
        dayOfWeek: dow,
        isOpen: s.isOpen,
        ...(s.isOpen ? { openTime: s.openTime, closeTime: s.closeTime } : {}),
      };
    });

    const result = await setShopSettings({ businessHours });
    setIsSaving(false);

    if (!result.success) {
      setFeedback({ tone: 'error', message: result.error ?? '운영 정보 저장에 실패했습니다.' });
      return;
    }

    setFeedback({ tone: 'success', message: '운영 정보가 저장되었습니다.' });
  };

  return (
    <Section title={t('settings.hours_title')}>
      <Card className="mx-4 md:mx-0">
        {/* 모드 토글 */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-text">{t('settings.hours_businessHours')}</span>
          <div className="flex items-center gap-1 rounded-xl bg-surface-alt border border-border p-1">
            <button
              onClick={() => setBulkMode(true)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150',
                bulkMode
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text',
              )}
            >
              {t('settings.hours_bulk')}
            </button>
            <button
              onClick={() => setBulkMode(false)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150',
                !bulkMode
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-muted hover:text-text',
              )}
            >
              {t('settings.hours_byDay')}
            </button>
          </div>
        </div>

        {bulkMode ? (
          /* 일괄 설정 */
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm text-text-secondary w-10 flex-shrink-0">{t('settings.hours_time')}</span>
              <div className="flex items-center gap-2 flex-1">
                <TimeInput value={bulkOpen} onChange={setBulkOpen} />
                <span className="text-text-muted text-xs">~</span>
                <TimeInput value={bulkClose} onChange={setBulkClose} />
              </div>
            </div>
            <div>
              <p className="text-xs text-text-muted mb-2">{t('settings.hours_closedDays')}</p>
              <div className="flex gap-2 flex-wrap">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    onClick={() => toggleBulkClosedDay(i)}
                    className={cn(
                      'w-9 h-9 rounded-full text-sm font-semibold transition-all duration-150',
                      bulkClosedDays[i]
                        ? 'bg-error/15 text-error'
                        : 'bg-surface-alt text-text-secondary border border-border',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted mt-2">{t('settings.hours_closedNote')}</p>
            </div>
          </div>
        ) : (
          /* 요일별 설정 */
          <div className="rounded-xl border border-border/60 overflow-hidden -mx-1">
            {DAY_LABELS.map((label, i) => {
              const s = daySchedules[i];
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5',
                    i !== DAY_LABELS.length - 1 && 'border-b border-border/40',
                  )}
                >
                  <span className="w-5 text-sm font-semibold text-text flex-shrink-0">
                    {label}
                  </span>
                  <Toggle
                    size="sm"
                    checked={s.isOpen}
                    onChange={(v) => updateDaySchedule(i, { isOpen: v })}
                  />
                  <span
                    className={cn(
                      'text-xs font-medium w-7 flex-shrink-0',
                      s.isOpen ? 'text-success' : 'text-error',
                    )}
                  >
                    {s.isOpen ? t('settings.hours_open') : t('settings.hours_closed')}
                  </span>
                  <div className="flex items-center gap-1 flex-1">
                    <TimeInput
                      value={s.openTime}
                      onChange={(v) => updateDaySchedule(i, { openTime: v })}
                      disabled={!s.isOpen}
                    />
                    <span className="text-text-muted text-xs">~</span>
                    <TimeInput
                      value={s.closeTime}
                      onChange={(v) => updateDaySchedule(i, { closeTime: v })}
                      disabled={!s.isOpen}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {feedback && (
          <div
            className={cn(
              'mt-3 rounded-xl border px-3 py-2 text-xs font-medium',
              feedback.tone === 'success'
                ? 'border-success/20 bg-success/10 text-success'
                : 'border-error/20 bg-error/10 text-error',
            )}
          >
            {feedback.message}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="rounded-lg border border-primary px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors disabled:opacity-40"
          >
            {isSaving ? '저장 중...' : t('settings.hours_save')}
          </button>
        </div>
      </Card>
    </Section>
  );
}
