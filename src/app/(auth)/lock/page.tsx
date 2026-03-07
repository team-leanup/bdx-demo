'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { MOCK_DESIGNERS } from '@/data/mock-shop';
import type { UserRole } from '@/types/auth';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';

type RoleStep = 'select_role' | 'select_designer';

export default function LockPage() {
  const router = useRouter();
  const t = useT();
  const { login, checkPassword } = useAuthStore();

  const [step, setStep] = useState<RoleStep>('select_role');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'staff' | null>(null);
  const [selectedDesignerId, setSelectedDesignerId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const ownerDesigners = MOCK_DESIGNERS.filter((d) => d.role === 'owner' && d.isActive);
  const staffDesigners = MOCK_DESIGNERS.filter((d) => d.role === 'staff' && d.isActive);

  const handleRoleSelect = (role: 'owner' | 'staff') => {
    setSelectedRole(role);
    setPassword('');
    setError('');
    const list = role === 'owner' ? ownerDesigners : staffDesigners;
    setSelectedDesignerId(list.length === 1 ? list[0].id : '');
    setStep('select_designer');
  };

  const handleBack = () => {
    setStep('select_role');
    setSelectedRole(null);
    setSelectedDesignerId('');
    setPassword('');
    setError('');
  };

  const handleLogin = async () => {
    if (!selectedDesignerId || !selectedRole) return;
    if (!password) {
      setError(t('auth.passwordRequired'));
      return;
    }

    setLoading(true);
    setError('');

    await new Promise((r) => setTimeout(r, 300));

    const valid = checkPassword(selectedDesignerId, password);
    if (valid) {
      login(selectedDesignerId, selectedRole as UserRole);
      router.replace('/home');
    } else {
      setError(t('auth.passwordError'));
      setPassword('');
    }
    setLoading(false);
  };

  const designers = selectedRole === 'owner' ? ownerDesigners : staffDesigners;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center mb-8"
        >
          <span className="text-5xl font-black tracking-tight" style={{ color: '#F472B6' }}>BDX</span>
          <span className="text-xs font-medium mt-1.5 tracking-widest uppercase" style={{ color: 'rgba(244,114,182,0.5)' }}>
            Beauty Decision eXperience
          </span>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 'select_role' && (
            <motion.div
              key="role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <p className="text-center text-sm font-semibold text-text-secondary mb-2">
                {t('auth.selectRole')}
              </p>
              <button
                onClick={() => handleRoleSelect('owner')}
                className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border bg-surface hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">
                  🔑
                </div>
                <div>
                  <p className="font-bold text-text">{t('auth.owner')}</p>
                  <p className="text-xs text-text-muted mt-0.5">{t('auth.ownerDesc')}</p>
                </div>
              </button>
              <button
                onClick={() => handleRoleSelect('staff')}
                className="flex items-center gap-4 p-5 rounded-2xl border-2 border-border bg-surface hover:border-primary/60 hover:bg-primary/5 transition-all duration-200 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                  👤
                </div>
                <div>
                  <p className="font-bold text-text">{t('auth.staff')}</p>
                  <p className="text-xs text-text-muted mt-0.5">{t('auth.staffDesc')}</p>
                </div>
              </button>
            </motion.div>
          )}

          {step === 'select_designer' && (
            <motion.div
              key="designer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={handleBack}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-surface-alt transition-colors"
                >
                  <svg className="w-4 h-4 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </button>
                <p className="text-sm font-semibold text-text-secondary">
                  {t('auth.selectDesigner').replace('{role}', selectedRole === 'owner' ? t('auth.owner') : t('auth.staff'))}
                </p>
              </div>

              {/* Designer list */}
              <div className="flex flex-col gap-2">
                {designers.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDesignerId(d.id)}
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-150 text-left',
                      selectedDesignerId === d.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-surface hover:border-primary/40',
                    )}
                  >
                    <ProfileAvatar designerId={d.id} name={d.name} size="md" />
                    <span className={cn('font-semibold text-sm', selectedDesignerId === d.id ? 'text-primary' : 'text-text')}>
                      {d.name} {selectedRole === 'owner' ? t('auth.ownerSuffix') : t('auth.staffSuffix')}
                    </span>
                    {selectedDesignerId === d.id && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5l2.5 2.5 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Password input */}
              <div className="flex flex-col gap-2 mt-2">
                <label className="text-xs font-semibold text-text-secondary">{t('auth.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleLogin();
                  }}
                  maxLength={20}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                />
                {error && (
                  <p className="text-xs text-error font-medium">{error}</p>
                )}
                <p className="text-[11px] text-text-muted">{t('auth.defaultPassword')}</p>
              </div>

              <button
                onClick={handleLogin}
                disabled={!selectedDesignerId || loading}
                className="w-full py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-40 transition-all duration-150"
              >
                {loading ? t('auth.loggingIn') : t('auth.login')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
