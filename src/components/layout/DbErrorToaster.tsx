'use client';

import { useEffect, useState } from 'react';
import { useReservationStore } from '@/store/reservation-store';
import { useRecordsStore } from '@/store/records-store';
import { usePortfolioStore } from '@/store/portfolio-store';

/**
 * 예약·기록·포트폴리오 스토어의 DB 쓰기 실패를 사용자에게 알리는 전역 토스트.
 * fire-and-forget DB 쓰기가 조용히 실패하는 것을 막기 위해 (main) 레이아웃에 1회 마운트.
 */
export function DbErrorToaster(): React.ReactElement | null {
  const reservationError = useReservationStore((s) => s.dbWriteError);
  const clearReservationError = useReservationStore((s) => s.clearDbWriteError);
  const recordError = useRecordsStore((s) => s.dbDeleteError);
  const clearRecordError = useRecordsStore((s) => s.clearDbDeleteError);
  const portfolioError = usePortfolioStore((s) => s.dbWriteError);
  const clearPortfolioError = usePortfolioStore((s) => s.clearDbWriteError);

  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (reservationError) setMessage('예약 정보 저장에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.');
  }, [reservationError]);

  useEffect(() => {
    if (recordError) setMessage('기록 삭제에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.');
  }, [recordError]);

  useEffect(() => {
    if (portfolioError) setMessage(portfolioError.message || '저장에 실패했어요. 다시 시도해주세요.');
  }, [portfolioError]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage(null);
      clearReservationError();
      clearRecordError();
      clearPortfolioError();
    }, 4500);
    return () => clearTimeout(timer);
  }, [message, clearReservationError, clearRecordError, clearPortfolioError]);

  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-24 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-error/30 bg-error/10 px-4 py-3 shadow-lg backdrop-blur lg:bottom-8"
    >
      <div className="flex items-start gap-2.5">
        <svg className="mt-0.5 h-5 w-5 shrink-0 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <p className="flex-1 text-sm font-medium text-text break-keep">{message}</p>
        <button
          type="button"
          onClick={() => {
            setMessage(null);
            clearReservationError();
            clearRecordError();
            clearPortfolioError();
          }}
          aria-label="닫기"
          className="shrink-0 text-text-muted hover:text-text"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
