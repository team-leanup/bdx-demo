'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useCustomerStore } from '@/store/customer-store';
import { useReservationStore } from '@/store/reservation-store';
import { useRecordsStore } from '@/store/records-store';
import { getStorageUsage, formatBytes } from '@/lib/storage-budget';
import { useT } from '@/lib/i18n';

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

export function StorageManagementSection(): React.ReactElement {
  const t = useT();
  const [storageInfo, setStorageInfo] = useState<{ key: string; label: string; bytes: number }[]>([]);
  const [confirmClearPortfolio, setConfirmClearPortfolio] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => { clearTimeout(clearTimerRef.current); }, []);

  const portfolioClearAll = usePortfolioStore((s) => s.clearAll);

  const refreshStorageInfo = React.useCallback(() => {
    const info = getStorageUsage();
    setStorageInfo(info.map((i) => ({ key: i.key, label: i.label, bytes: i.bytes })));
  }, []);

  React.useEffect(() => {
    refreshStorageInfo();
  }, [refreshStorageInfo]);

  const totalBytes = storageInfo.reduce((acc, item) => acc + (item.bytes || 0), 0);

  const handleClearPortfolio = () => {
    void (async () => {
      const result = await portfolioClearAll();

      setConfirmClearPortfolio(false);

      if (!result.success) {
        setClearSuccess(result.error ?? '포트폴리오 초기화에 실패했습니다');
        clearTimerRef.current = setTimeout(() => setClearSuccess(null), 2500);
        return;
      }

      setClearSuccess(t('settings.storage_cleared'));
      refreshStorageInfo();
      clearTimerRef.current = setTimeout(() => setClearSuccess(null), 2000);
    })();
  };

  const handleClearAll = () => {
    void (async () => {
      const portfolioResult = await portfolioClearAll();
      if (!portfolioResult.success) {
        setConfirmClearAll(false);
        setClearSuccess(portfolioResult.error ?? '포트폴리오 초기화에 실패했습니다');
        clearTimerRef.current = setTimeout(() => setClearSuccess(null), 2500);
        return;
      }

      ['bdx-customers', 'bdx-reservations', 'bdx-records', 'bdx-portfolio'].forEach((k) => {
        try { localStorage.removeItem(k); } catch { /* noop */ }
      });

      useCustomerStore.setState({ customers: [] });
      useReservationStore.setState({ reservations: [] });
      useRecordsStore.setState({ records: [] });
      usePortfolioStore.setState({ photos: [] });

      setConfirmClearAll(false);
      setClearSuccess(t('settings.storage_cleared'));
      refreshStorageInfo();
      clearTimerRef.current = setTimeout(() => {
        setClearSuccess(null);
        window.location.reload();
      }, 1000);
    })();
  };

  return (
    <Section title={t('settings.storage_title')}>
      <Card className="mx-4 md:mx-0">
        <div className="mb-4">
          <p className="text-sm font-medium text-text mb-3">{t('settings.storage_usage')}</p>
          <div className="flex flex-col gap-2">
            {storageInfo.map((item) => (
              <div key={item.key} className="flex justify-between text-sm">
                <span className="text-text-secondary">{item.label}</span>
                <span className="font-medium text-text">{formatBytes(item.bytes)}</span>
              </div>
            ))}
            <div className="border-t border-border/50 pt-2 mt-1">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-text">{t('settings.storage_total')}</span>
                <span className="font-bold text-primary">{formatBytes(totalBytes)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setConfirmClearPortfolio(true)}
            className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-left transition-colors hover:bg-surface-alt"
          >
            <svg className="h-5 w-5 flex-shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <div className="flex-1">
              <span className="text-sm font-medium text-text block">{t('settings.storage_clearPortfolio')}</span>
              <span className="text-xs text-text-muted">{t('settings.storage_clearPortfolioDesc')}</span>
            </div>
            <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <Modal
            isOpen={confirmClearPortfolio}
            onClose={() => setConfirmClearPortfolio(false)}
            title="포트폴리오 초기화"
          >
            <div className="p-5">
              <p className="text-sm text-text-secondary mb-4">포트폴리오의 모든 사진이 삭제됩니다. 계속하시겠습니까?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmClearPortfolio(false)}
                  className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold text-text-secondary hover:bg-surface-alt transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => { handleClearPortfolio(); }}
                  className="flex-1 rounded-lg bg-warning/10 border border-warning/30 py-2 text-xs font-semibold text-warning hover:bg-warning/20 transition-colors"
                >
                  포트폴리오 초기화
                </button>
              </div>
            </div>
          </Modal>

          <button
            onClick={() => setConfirmClearAll(true)}
            className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-left transition-colors hover:bg-surface-alt"
          >
            <svg className="h-5 w-5 flex-shrink-0 text-error/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
            <div className="flex-1">
              <span className="text-sm font-medium text-error block">{t('settings.storage_clearAll')}</span>
              <span className="text-xs text-text-muted">{t('settings.storage_clearAllDesc')}</span>
            </div>
            <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <Modal
            isOpen={confirmClearAll}
            onClose={() => setConfirmClearAll(false)}
            title="전체 데이터 초기화"
          >
            <div className="p-5">
              <p className="text-sm text-text-secondary mb-4">로컬 캐시 데이터(예약, 고객, 기록)가 초기화됩니다. 서버에 저장된 데이터는 앱 재시작 시 복원될 수 있습니다. 계속하시겠습니까?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmClearAll(false)}
                  className="flex-1 rounded-lg border border-border py-2 text-xs font-semibold text-text-secondary hover:bg-surface-alt transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => { handleClearAll(); }}
                  className="flex-1 rounded-lg bg-error/10 border border-error/30 py-2 text-xs font-semibold text-error hover:bg-error/20 transition-colors"
                >
                  전체 데이터 초기화
                </button>
              </div>
            </div>
          </Modal>
        </div>

        {clearSuccess && (
          <div className="mt-3 rounded-lg bg-success/10 border border-success/30 px-3 py-2 text-center">
            <span className="text-sm font-medium text-success">{clearSuccess}</span>
          </div>
        )}
      </Card>
    </Section>
  );
}
