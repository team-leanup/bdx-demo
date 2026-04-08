'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { useShopStore } from '@/store/shop-store';
import { useOnboardingPhotoStore } from '@/store/onboarding-photo-store';
import { dbBatchInsertPortfolioPhotos } from '@/lib/db';
import { usePortfolioStore } from '@/store/portfolio-store';
import { getNowInKoreaIso } from '@/lib/format';
import type { PortfolioPhoto } from '@/types/portfolio';

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <path d="M3 9h18M9 21V9" />
      </svg>
    ),
    title: '포트폴리오 등록 완료',
    description: '등록된 디자인이 고객에게 바로 보여져요',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: '가격표 설정 완료',
    description: '고객이 가격을 미리 확인할 수 있어요',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: '안내 문구 설정 완료',
    description: '고객에게 자동으로 안내돼요',
  },
];

export default function CompletePage() {
  const router = useRouter();
  const { shopSettings, setShopSettings } = useAppStore();
  const currentShopId = useAuthStore((s) => s.currentShopId);
  const setCurrentShopOnboardingComplete = useAuthStore((s) => s.setCurrentShopOnboardingComplete);
  const updateShop = useShopStore((s) => s.updateShop);
  const { photos, featuredIds, reset: resetPhotos } = useOnboardingPhotoStore();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(false);

  const { shopName, baseHandPrice, baseFootPrice } = shopSettings;

  useEffect(() => {
    if (!shopName || shopName.trim() === '') {
      router.replace('/onboarding');
    }
  }, [shopName, router]);

  const commitDB = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const onboardingCompletedAt = getNowInKoreaIso();

      // 1. Shop 기본 정보 + 설정 저장
      await updateShop({
        name: shopName || '우리 샵',
        phone: shopSettings.shopPhone || undefined,
        address: shopSettings.shopAddress || undefined,
        businessHours: shopSettings.businessHours,
        baseHandPrice,
        baseFootPrice,
        onboardingCompletedAt,
      });

      // 2. categoryPricing + customerNotice DB 저장
      await setShopSettings({
        categoryPricing: shopSettings.categoryPricing,
        customerNotice: shopSettings.customerNotice,
        surcharges: shopSettings.surcharges,
      });

      // 3. 포트폴리오 사진 저장
      if (photos.length > 0 && currentShopId) {
        const portfolioPhotos: PortfolioPhoto[] = photos.map((p) => ({
          id: p.id,
          shopId: currentShopId,
          customerId: 'onboarding',
          kind: 'reference' as const,
          createdAt: onboardingCompletedAt,
          imageDataUrl: p.dataUrl,
          styleCategory: p.category,
          isFeatured: featuredIds.includes(p.id),
          isPublic: true,
        }));

        if (currentShopId === 'shop-demo') {
          // 데모 모드: 포트폴리오 스토어에 직접 저장
          usePortfolioStore.getState().setPhotos(portfolioPhotos);
        } else {
          // 실제 모드: Supabase Storage + DB 업로드
          await dbBatchInsertPortfolioPhotos(portfolioPhotos);
        }
      }

      setCurrentShopOnboardingComplete(true);
      resetPhotos();
    } catch {
      setError(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreview = async () => {
    await commitDB();
    if (!error) router.push(currentShopId ? `/pre-consult/${currentShopId}` : '/home');
  };

  const handleHome = async () => {
    await commitDB();
    if (!error) router.push('/home');
  };

  const handleFieldMode = async () => {
    await commitDB();
    if (!error) router.push('/field-mode');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-112px)] px-5 py-12 max-w-xl mx-auto w-full">
      {/* Checkmark animation */}
      <div className="relative flex items-center justify-center mb-10">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1 + i * 0.3, opacity: 0 }}
            transition={{
              duration: 1.2,
              delay: 0.3 + i * 0.15,
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
            className="absolute rounded-full border-2 border-primary"
            style={{ width: 80, height: 80 }}
          />
        ))}

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
          className="w-24 h-24 rounded-full flex items-center justify-center z-10"
          style={{ backgroundColor: 'var(--color-primary)' }}
        >
          <motion.svg width="44" height="36" viewBox="0 0 44 36" fill="none">
            <motion.path
              d="M4 18L16 30L40 4"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            />
          </motion.svg>
        </motion.div>
      </div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.35 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-text mb-2">이제 상담이 훨씬 쉬워질 거예요</h1>
        <p className="text-sm text-text-secondary">고객이 직접 고르고, 더 빠르게 결정하게 됩니다</p>
      </motion.div>

      {/* Feature highlights */}
      <div className="w-full flex flex-col gap-3 mb-10">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.5 + i * 0.1 }}
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-4 py-3.5"
          >
            {/* Icon container */}
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary-light, color-mix(in srgb, var(--color-primary) 12%, transparent))' }}
            >
              <span style={{ color: 'var(--color-primary)' }}>{feature.icon}</span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text">{feature.title}</p>
              <p className="text-xs text-text-secondary mt-0.5">{feature.description}</p>
            </div>

            {/* Check badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.65 + i * 0.1 }}
              className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
            >
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L4 7L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-error text-center mb-4">저장 중 오류가 발생했어요. 다시 시도해 주세요.</p>
      )}

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.85 }}
        className="w-full flex flex-col gap-3"
      >
        <Button size="lg" fullWidth onClick={handleFieldMode} disabled={isSaving}>
          {isSaving ? '저장 중...' : '현장모드 시작'}
        </Button>
        <Button size="lg" fullWidth variant="secondary" onClick={handlePreview} disabled={isSaving}>
          고객 화면 미리보기
        </Button>
        <Button size="lg" fullWidth variant="ghost" onClick={handleHome} disabled={isSaving}>
          홈으로
        </Button>
      </motion.div>
    </div>
  );
}
