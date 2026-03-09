export type UserRole = 'owner' | 'staff' | null;

export interface AuthState {
  isInitialized: boolean;
  role: UserRole;
  currentShopId: string | null;
  currentShopOnboardingComplete: boolean;
  activeDesignerId: string | null;
  activeDesignerName: string | null;
  passwords: Record<string, string>; // designerId -> hashed password
}

export interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallbackPath?: string;
}
