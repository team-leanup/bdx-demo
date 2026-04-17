'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import type { ConsultationLinkPublicData } from '@/types/consultation-link';
import { computeAvailableDates } from '@/lib/consultation-link-slots';

function CalendarIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

interface Props {
  link: ConsultationLinkPublicData;
  selectedDate: string | null;
  selectedTime: string | null;
  onSelect: (date: string, time: string) => void;
}

export function SlotPicker({ link, selectedDate, selectedTime, onSelect }: Props): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();

  const availableDates = useMemo(() => computeAvailableDates(link), [link]);

  const [openDate, setOpenDate] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDate) setOpenDate(selectedDate);
    else if (availableDates.length > 0 && !openDate) setOpenDate(availableDates[0].date);
  }, [selectedDate, availableDates, openDate]);

  if (availableDates.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 text-center">
        <p className="text-sm text-text-muted">
          {t('preConsult.noAvailableSlots')}
        </p>
        {locale !== 'ko' && (
          <p className="text-[11px] text-text-muted opacity-60 mt-1">
            {tKo('preConsult.noAvailableSlots')}
          </p>
        )}
      </div>
    );
  }

  const activeDate = availableDates.find((d) => d.date === openDate) ?? availableDates[0];

  const formatDateShort = (dateStr: string, weekday: string): { md: string; wd: string } => {
    const [, m, d] = dateStr.split('-');
    const month = Number(m);
    const day = Number(d);
    if (locale === 'ko') return { md: `${month}.${day}`, wd: weekday };
    return { md: `${month}/${day}`, wd: weekday };
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <CalendarIcon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-text">{t('preConsult.selectDate')}</h3>
        {locale !== 'ko' && (
          <span className="text-[10px] text-text-muted opacity-60">{tKo('preConsult.selectDate')}</span>
        )}
      </div>

      {/* Date chips - horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
        {availableDates.map((d) => {
          const { md, wd } = formatDateShort(d.date, d.weekday);
          const isSelected = d.date === activeDate.date;
          return (
            <motion.button
              key={d.date}
              type="button"
              onClick={() => setOpenDate(d.date)}
              whileTap={{ scale: 0.96 }}
              className={`shrink-0 snap-start flex flex-col items-center justify-center min-w-[64px] h-[72px] rounded-xl border-2 transition-colors ${
                isSelected
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text-secondary'
              }`}
            >
              <span className={`text-[10px] font-semibold ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                {wd}
              </span>
              <span className="text-base font-bold leading-tight mt-0.5">{md}</span>
              <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                {d.slots.filter((s) => !s.isBooked).length}{locale === 'ko' ? '자리' : ' open'}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-1">
        <ClockIcon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-text">{t('preConsult.selectTime')}</h3>
        {locale !== 'ko' && (
          <span className="text-[10px] text-text-muted opacity-60">{tKo('preConsult.selectTime')}</span>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {activeDate.slots.map((slot) => {
          const isSelected = selectedDate === slot.date && selectedTime === slot.time;
          return (
            <motion.button
              key={`${slot.date}-${slot.time}`}
              type="button"
              disabled={slot.isBooked}
              onClick={() => onSelect(slot.date, slot.time)}
              whileTap={{ scale: 0.96 }}
              className={`h-11 rounded-lg border-2 text-sm font-semibold transition-colors ${
                slot.isBooked
                  ? 'border-border bg-background text-text-muted/40 line-through cursor-not-allowed'
                  : isSelected
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-surface text-text hover:border-primary/40'
              }`}
            >
              {slot.time}
            </motion.button>
          );
        })}
      </div>

      {activeDate.slots.every((s) => s.isBooked) && (
        <p className="text-xs text-text-muted text-center py-2">
          {t('preConsult.allBooked')}
        </p>
      )}
    </div>
  );
}
