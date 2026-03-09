'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button, Input } from '@/components/ui';

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isReady = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = (): void => {
    router.push('/onboarding');
  };

  const handleGoogleLogin = (): void => {
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-text">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col">
        <div className="flex flex-1 items-center justify-center px-6 py-16 sm:px-8 lg:px-12">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-[360px]"
          >
            <div className="mb-10 flex flex-col items-center text-center">
              <img src="/bdx-logo/bdx-symbol.svg" alt="BDX" className="h-20" />
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleGoogleLogin}
                className="flex h-[52px] w-full items-center justify-center gap-3 rounded-[14px] border border-[#d7dce3] bg-white px-4 text-[15px] font-semibold text-slate-800 transition-colors duration-200 hover:border-[#c6ccd5] hover:bg-slate-50 active:scale-[0.995]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M21.805 10.023h-9.72v3.955h5.573c-.24 1.273-.96 2.35-2.045 3.068v2.548h3.305c1.935-1.782 3.047-4.41 3.047-7.545 0-.677-.06-1.329-.16-2.026z" />
                  <path fill="#34A853" d="M12.084 22c2.76 0 5.08-.915 6.773-2.474l-3.305-2.548c-.916.614-2.086.978-3.468.978-2.664 0-4.923-1.798-5.73-4.215H2.938v2.629A10.224 10.224 0 0012.084 22z" />
                  <path fill="#FBBC05" d="M6.354 13.741A6.144 6.144 0 015.988 12c0-.603.131-1.183.366-1.741V7.63H2.938A10.224 10.224 0 001.854 12c0 1.642.393 3.198 1.084 4.37l3.416-2.629z" />
                  <path fill="#EA4335" d="M12.084 6.044c1.5 0 2.848.516 3.91 1.53l2.932-2.932C17.157 2.998 14.844 2 12.084 2A10.224 10.224 0 002.938 7.63l3.416 2.629c.807-2.417 3.066-4.215 5.73-4.215z" />
                </svg>
                Google 로그인
              </button>

              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-[#d9dde4]" />
                <span className="text-[11px] font-medium text-slate-400">또는</span>
                <div className="h-px flex-1 bg-[#d9dde4]" />
              </div>

              <div className="flex flex-col gap-3.5">
                <Input
                  id="login-email"
                  label="이메일"
                  type="email"
                  placeholder="manager@bdx.kr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-[52px] rounded-[14px] border-[#d7dce3] bg-white px-4 text-[15px] placeholder:text-slate-400 hover:border-[#c6ccd5] focus-visible:ring-primary/20"
                />
                <Input
                  id="login-password"
                  label="비밀번호"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-[52px] rounded-[14px] border-[#d7dce3] bg-white px-4 text-[15px] placeholder:text-slate-400 hover:border-[#c6ccd5] focus-visible:ring-primary/20"
                />
              </div>

              <Button
                size="lg"
                fullWidth
                onClick={handleLogin}
                disabled={!isReady}
                className="mt-2 h-[52px] rounded-[14px] bg-primary text-[15px] font-semibold text-white shadow-none hover:bg-primary-dark"
              >
                로그인
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-500">
              <span>계정이 없으신가요?</span>
              <button
                onClick={() => router.push('/onboarding')}
                className="font-semibold text-primary transition-colors hover:text-primary-dark"
              >
                회원가입
              </button>
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
