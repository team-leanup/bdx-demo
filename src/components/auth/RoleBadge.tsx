'use client';

import { useAuthStore } from '@/store/auth-store';

export function RoleBadge() {
  const role = useAuthStore((s) => s.role);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const activeDesignerName = useAuthStore((s) => s.activeDesignerName);

  if (!isLoggedIn()) return null;

  const label = role === 'owner' ? '🔑 원장' : `👤 ${activeDesignerName ?? '선생님'}`;

  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
      {label}
    </span>
  );
}
