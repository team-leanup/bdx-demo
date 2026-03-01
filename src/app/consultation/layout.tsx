import type { ReactNode } from 'react';
import { ConsultationLocaleButton } from '@/components/consultation/ConsultationLocaleButton';

export default function ConsultationLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-dvh bg-background flex flex-col">
      <ConsultationLocaleButton />
      {children}
    </div>
  );
}
