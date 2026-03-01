'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    router.push('/onboarding');
  };

  const handleGoogleLogin = () => {
    router.push('/onboarding');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col items-center justify-center px-8 md:px-12 py-12 max-w-lg mx-auto w-full">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center mb-12"
        >
          <span className="text-5xl md:text-6xl font-black tracking-tight text-primary">
            BDX
          </span>
          <span className="text-sm font-medium text-primary/50 mt-1 tracking-widest uppercase">
            Beauty Decision eXperience
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
          className="w-full flex flex-col gap-4"
        >
          {/* Google login button */}
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl bg-[#4285F4] text-white font-semibold text-base hover:bg-[#3367D6] active:scale-[0.98] transition-all duration-200 shadow-md"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google로 시작하기
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted">또는</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email input */}
          <Input
            label="이메일"
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Password input */}
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Login button */}
          <Button size="lg" fullWidth onClick={handleLogin}>
            로그인
          </Button>
        </motion.div>

        {/* Sign up link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex items-center gap-2 mt-8"
        >
          <span className="text-sm text-text-muted">계정이 없으신가요?</span>
          <button
            onClick={() => router.push('/onboarding')}
            className="text-sm font-medium text-primary underline underline-offset-2"
          >
            회원가입
          </button>
        </motion.div>
      </div>
    </div>
  );
}
