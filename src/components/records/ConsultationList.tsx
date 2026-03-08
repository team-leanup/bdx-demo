'use client';

import type { ConsultationRecord } from '@/types/consultation';
import { ConsultationListItem } from './ConsultationListItem';

interface ConsultationListProps {
  records: ConsultationRecord[];
  onRecordClick: (recordId: string) => void;
  emptyTitle: string;
  emptyDescription: string;
}

export function ConsultationList({
  records,
  onRecordClick,
  emptyTitle,
  emptyDescription,
}: ConsultationListProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-border overflow-hidden mx-4 md:mx-0">
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-surface">
          <svg className="mb-3 h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-base font-medium text-text-secondary">{emptyTitle}</p>
          <p className="mt-1 text-sm text-text-muted">{emptyDescription}</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border bg-surface">
          {records.map((record) => (
            <ConsultationListItem
              key={record.id}
              record={record}
              onClick={() => onRecordClick(record.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
