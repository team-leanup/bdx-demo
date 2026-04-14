'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';
import { useShopStore } from '@/store/shop-store';
import { useAuthStore } from '@/store/auth-store';
import type { Designer } from '@/types/shop';

interface ProfileSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PinInputProps {
  pin: string;
  error: boolean;
}

function PinDots({ pin, error }: PinInputProps) {
  return (
    <motion.div
      className="flex gap-4 justify-center"
      animate={error ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={[
            'w-4 h-4 rounded-full border-2 transition-all duration-150',
            i < pin.length
              ? error
                ? 'bg-red-400 border-red-400'
                : 'bg-white border-white'
              : 'bg-transparent border-white/40',
          ].join(' ')}
        />
      ))}
    </motion.div>
  );
}

export function ProfileSwitcher({ isOpen, onClose }: ProfileSwitcherProps) {
  const designers = useShopStore((s) => s.designers).filter((d) => d.isActive);
  const activeDesignerId = useAuthStore((s) => s.activeDesignerId);
  const checkPassword = useAuthStore((s) => s.checkPassword);
  const switchToDesigner = useAuthStore((s) => s.switchToDesigner as ((id: string, name: string, role: Designer['role']) => void) | undefined);

  const [pinTarget, setPinTarget] = useState<Designer | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const pinInputRef = useRef<HTMLInputElement>(null);

  const handleClose = useCallback(() => {
    setPinTarget(null);
    setPin('');
    setError(false);
    onClose();
  }, [onClose]);

  const handlePinSubmit = useCallback(async () => {
    if (!pinTarget) return;
    if (await checkPassword(pinTarget.id, pin)) {
      switchToDesigner?.(pinTarget.id, pinTarget.name, pinTarget.role);
      setPinTarget(null);
      setPin('');
      setError(false);
      onClose();
    } else {
      setError(true);
      setPin('');
    }
  }, [pinTarget, pin, checkPassword, switchToDesigner, onClose]);

  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit();
    }
  }, [pin, handlePinSubmit]);

  useEffect(() => {
    if (pinTarget && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [pinTarget]);

  useEffect(() => {
    if (!isOpen) {
      setPinTarget(null);
      setPin('');
      setError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const handleSelect = (designer: Designer) => {
    if (designer.id === activeDesignerId) {
      handleClose();
      return;
    }
    setPinTarget(designer);
    setPin('');
    setError(false);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setError(false);
    setPin(val);
  };

  const gridCols =
    designers.length <= 2
      ? 'grid-cols-2'
      : designers.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-2 sm:grid-cols-3';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="profile-switcher-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <AnimatePresence mode="wait">
            {!pinTarget ? (
              /* Profile grid screen */
              <motion.div
                key="profile-grid"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-8 px-6 w-full max-w-sm"
              >
                <h1 className="text-white text-2xl font-bold tracking-tight text-center">
                  누가 사용하나요?
                </h1>

                {designers.length === 0 ? (
                  <p className="text-white/50 text-sm text-center">
                    활성화된 디자이너가 없습니다.
                  </p>
                ) : (
                  <div className={`grid ${gridCols} gap-4 w-full justify-items-center`}>
                    {designers.map((designer) => {
                      const isActive = designer.id === activeDesignerId;
                      return (
                        <motion.button
                          key={designer.id}
                          type="button"
                          onClick={() => handleSelect(designer)}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex flex-col items-center gap-2.5 p-3 rounded-2xl transition-colors w-full max-w-[120px]"
                        >
                          <div
                            className={[
                              'rounded-2xl p-0.5 transition-all duration-200',
                              isActive
                                ? 'ring-2 ring-primary ring-offset-2 ring-offset-black/90'
                                : 'ring-2 ring-transparent',
                            ].join(' ')}
                          >
                            <ProfileAvatar
                              designerId={designer.id}
                              name={designer.name}
                              size="lg"
                              className="w-16 h-16"
                            />
                          </div>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-white text-sm font-semibold leading-tight text-center">
                              {designer.name}
                            </span>
                            {isActive && (
                              <span className="text-primary text-[10px] font-medium">
                                현재 사용 중
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleClose}
                  className="text-white/40 hover:text-white/70 text-sm transition-colors mt-2"
                >
                  닫기
                </button>
              </motion.div>
            ) : (
              /* PIN input screen */
              <motion.div
                key="pin-input"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -8 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center gap-8 px-6 w-full max-w-xs"
              >
                <div className="flex flex-col items-center gap-3">
                  <ProfileAvatar
                    designerId={pinTarget.id}
                    name={pinTarget.name}
                    size="lg"
                    className="w-20 h-20"
                  />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-white text-lg font-semibold">
                      {pinTarget.name}
                    </span>
                    <span className="text-white/50 text-sm">PIN을 입력하세요</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 w-full">
                  <PinDots pin={pin} error={error} />

                  {/* Hidden actual input */}
                  <input
                    ref={pinInputRef}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={pin}
                    onChange={handlePinChange}
                    className="sr-only"
                    aria-label="PIN 입력"
                    autoComplete="off"
                  />

                  <AnimatePresence>
                    {error && (
                      <motion.p
                        key="pin-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-red-400 text-sm font-medium text-center"
                      >
                        PIN이 틀렸어요
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Numeric keypad for mobile */}
                  <div className="grid grid-cols-3 gap-3 mt-2 w-full">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, idx) => {
                      if (key === '') {
                        return <div key={idx} />;
                      }
                      return (
                        <motion.button
                          key={key}
                          type="button"
                          whileTap={{ scale: 0.88 }}
                          onClick={() => {
                            if (key === '⌫') {
                              setPin((prev) => prev.slice(0, -1));
                              setError(false);
                            } else if (pin.length < 4) {
                              setPin((prev) => prev + key);
                            }
                          }}
                          className={[
                            'h-14 rounded-2xl flex items-center justify-center text-white font-semibold text-xl transition-colors',
                            key === '⌫'
                              ? 'bg-white/10 hover:bg-white/20 text-base'
                              : 'bg-white/15 hover:bg-white/25',
                          ].join(' ')}
                        >
                          {key}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPinTarget(null);
                    setPin('');
                    setError(false);
                  }}
                  className="text-white/40 hover:text-white/70 text-sm transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  뒤로
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
