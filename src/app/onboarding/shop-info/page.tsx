'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppStore } from '@/store/app-store';
import { useOnboardingPhotoStore } from '@/store/onboarding-photo-store';
import { resizeImageToBase64 } from '@/lib/image-utils';

export default function ShopInfoPage() {
  const router = useRouter();
  const { shopSettings, setShopSettings } = useAppStore();
  const { setPendingLogoDataUrl, pendingLogoDataUrl } = useOnboardingPhotoStore();

  const [shopName, setShopName] = useState(shopSettings.shopName || '');
  const [phone, setPhone] = useState(shopSettings.shopPhone || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(pendingLogoDataUrl);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canProceed = shopName.trim().length > 0;

  const MAX_LOGO_BYTES = 4 * 1024 * 1024; // 4MB

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);
    // 4MB 크기 검증
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError('4MB 이하 이미지만 선택할 수 있어요');
      e.target.value = '';
      return;
    }
    try {
      const dataUrl = await resizeImageToBase64(file, 400);
      setLogoPreview(dataUrl);
      setPendingLogoDataUrl(dataUrl);
    } catch {
      setLogoError('이미지를 불러오지 못했어요. 다시 시도해 주세요');
    }
    // 같은 파일 재선택 가능하도록 초기화
    e.target.value = '';
  };

  const handleNext = () => {
    if (!canProceed) return;
    setShopSettings({ shopName: shopName.trim(), shopPhone: phone });
    router.push('/onboarding/portfolio-upload');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 md:px-0 py-4 md:py-6"
    >
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text">기본 정보</h1>
        <p className="text-sm text-text-secondary">고객과 연결되는 기본 정보예요</p>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {/* 매장 로고 */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text">
            매장 로고
            <span className="ml-1.5 text-xs font-normal text-text-muted">(선택)</span>
          </label>
          <div className="flex items-center gap-4">
            {/* 미리보기 / 플레이스홀더 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-dashed border-border bg-surface-alt flex items-center justify-center overflow-hidden hover:border-primary transition-colors"
              aria-label="로고 이미지 선택"
            >
              {logoPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={logoPreview}
                  alt="매장 로고 미리보기"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-6 h-6 text-text-muted"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 20.25h18A.75.75 0 0021.75 21V6.75A.75.75 0 0021 6H3a.75.75 0 00-.75.75V20.25c0 .414.336.75.75.75z"
                  />
                </svg>
              )}
            </button>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sm font-medium text-primary underline underline-offset-2 text-left"
              >
                {logoPreview ? '다시 선택' : '이미지 선택'}
              </button>
              {logoPreview && (
                <button
                  type="button"
                  onClick={() => {
                    setLogoPreview(null);
                    setPendingLogoDataUrl(null);
                  }}
                  className="text-xs text-text-muted text-left hover:text-error transition-colors"
                >
                  제거
                </button>
              )}
              <p className="text-xs text-text-muted">JPEG, PNG, WebP · 4MB 이하</p>
              {logoError && (
                <p className="text-xs text-error">{logoError}</p>
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>

        <Input
          label="매장명"
          placeholder="매장명을 입력하세요"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
        />
        <Input
          label="연락처"
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <div className="pt-6">
        <Button size="lg" fullWidth onClick={handleNext} disabled={!canProceed}>
          다음
        </Button>
      </div>
    </motion.div>
  );
}
