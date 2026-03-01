export type UserRole = 'owner' | 'staff' | null;

export interface AuthState {
  role: UserRole;
  activeDesignerId: string | null;
  activeDesignerName: string | null;
  passwords: Record<string, string>; // designerId -> hashed password
}

export interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
}
