'use client';

import { useAuthStore } from '@/store/auth-store';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';

export function RoleBadge() {
  const role = useAuthStore((s) => s.role);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const activeDesignerName = useAuthStore((s) => s.activeDesignerName);

  if (!isLoggedIn()) return null;

  const name = activeDesignerName ?? '선생님';
  const suffix = role === 'owner' ? '원장' : name;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
      {activeDesignerId && (
        <ProfileAvatar designerId={activeDesignerId} name={name} size="sm" className="!w-5 !h-5 !text-[10px]" />
      )}
      {suffix}
    </span>
  );
}
