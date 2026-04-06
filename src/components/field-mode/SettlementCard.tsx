'use client';

import type { ReactNode } from 'react';

interface SettlementCardProps {
  icon: string;
  title: string;
  children: ReactNode;
}

export function SettlementCard({ icon, title, children }: SettlementCardProps): React.ReactElement {
  return (
    <div className="rounded-2xl bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-text">{title}</h3>
      </div>
      {children}
    </div>
  );
}
