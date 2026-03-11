'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { useShopStore } from '@/store/shop-store';
import { formatPrice, formatMinutes, getNowInKoreaIso } from '@/lib/format';

const SERVICE_LABELS: Record<string, string> = {
  gel: '젤네일',
  acrylic: '아크릴',
  art: '네일아트',
  care: '케어',
  remove: '제거',
  pedi: '페디큐어',
  extension: '연장',
  repair: '리페어',
  overlay: '오버레이',
};

interface SummaryRowProps {
  icon: string;
  label: string;
  value: string;
}

function SummaryRow({ icon, label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-base leading-none flex-shrink-0">{icon}</span>
      <span className="text-sm text-text-secondary flex-1">{label}</span>
      <span className="text-sm font-semibold text-text">{value}</span>
    </div>
  );
}

export default function CompletePage() {
  const router = useRouter();
  const { setOnboardingComplete, shopSettings } = useAppStore();
  const setCurrentShopOnboardingComplete = useAuthStore((s) => s.setCurrentShopOnboardingComplete);
  const updateShop = useShopStore((s) => s.updateShop);

  const {
    shopName,
    selectedServices,
    baseHandPrice,
    baseFootPrice,
    surcharges,
    serviceStructure,
    timeSettings,
  } = shopSettings;

  const handleTour = () => {
    const onboardingCompletedAt = getNowInKoreaIso();
    updateShop({
      name: shopName || '우리 샵',
      phone: shopSettings.shopPhone || undefined,
      address: shopSettings.shopAddress || undefined,
      businessHours: shopSettings.businessHours,
      baseHandPrice,
      baseFootPrice,
      onboardingCompletedAt,
    });
    setOnboardingComplete(true);
    setCurrentShopOnboardingComplete(true);
    router.push('/home?tour=true');
  };

  const handleHome = () => {
    const onboardingCompletedAt = getNowInKoreaIso();
    updateShop({
      name: shopName || '우리 샵',
      phone: shopSettings.shopPhone || undefined,
      address: shopSettings.shopAddress || undefined,
      businessHours: shopSettings.businessHours,
      baseHandPrice,
      baseFootPrice,
      onboardingCompletedAt,
    });
    setOnboardingComplete(true);
    setCurrentShopOnboardingComplete(true);
    router.push('/home');
  };

  // Active surcharges (non-zero)
  const activeSurcharges: { label: string; value: number }[] = [
    ...(surcharges.selfRemoval > 0 ? [{ label: '자샵오프', value: surcharges.selfRemoval }] : []),
    ...(surcharges.otherRemoval > 0 ? [{ label: '타샵오프', value: surcharges.otherRemoval }] : []),
    ...(serviceStructure.gradation && surcharges.gradation > 0 ? [{ label: '그라데이션', value: surcharges.gradation }] : []),
    ...(serviceStructure.french && surcharges.french > 0 ? [{ label: '프렌치', value: surcharges.french }] : []),
    ...(serviceStructure.magnet && surcharges.magnet > 0 ? [{ label: '마그네틱', value: surcharges.magnet }] : []),
    ...(serviceStructure.pointFullArt && surcharges.pointArt > 0 ? [{ label: '포인트아트', value: surcharges.pointArt }] : []),
    ...(serviceStructure.pointFullArt && surcharges.fullArt > 0 ? [{ label: '풀아트', value: surcharges.fullArt }] : []),
    ...(serviceStructure.repair && surcharges.repairPer > 0 ? [{ label: '리페어/개', value: surcharges.repairPer }] : []),
    ...(serviceStructure.overlay && surcharges.overlay > 0 ? [{ label: '오버레이', value: surcharges.overlay }] : []),
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-8 py-12 max-w-2xl mx-auto w-full">
      {/* Checkmark animation */}
      <div className="relative flex items-center justify-center mb-8">
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

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex flex-col items-center text-center gap-5 w-full"
      >
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl md:text-3xl font-bold text-text">설정이 완료되었습니다!</h1>
          <p className="text-base text-text-secondary">이제 BDX를 시작할 준비가 되었어요.</p>
        </div>

        {/* Summary card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          className="w-full rounded-2xl border border-border bg-surface p-4 flex flex-col gap-4 text-left"
        >
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">설정 요약</p>

          {/* 매장명 */}
          <SummaryRow icon="🏪" label="매장명" value={shopName || '미입력'} />

          {/* 선택 서비스 */}
          <div className="flex items-start gap-3">
            <span className="text-base leading-none flex-shrink-0 mt-0.5">💅</span>
            <span className="text-sm text-text-secondary flex-shrink-0">선택 서비스</span>
            <div className="flex flex-wrap gap-1.5 ml-auto justify-end">
              {(selectedServices.length > 0 ? selectedServices : ['gel']).map((id) => (
                <span
                  key={id}
                  className="text-xs font-medium px-2 py-0.5 rounded-full border border-border bg-background text-text-secondary"
                >
                  {SERVICE_LABELS[id] ?? id}
                </span>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* 기본가 */}
          <SummaryRow icon="💰" label="핸드 기본가" value={formatPrice(baseHandPrice)} />
          <SummaryRow icon="🦶" label="페디큐어 기본가" value={formatPrice(baseFootPrice)} />

          {/* 활성 추가금 */}
          {activeSurcharges.length > 0 && (
            <>
              <div className="h-px bg-border" />
              <p className="text-xs font-semibold text-text-muted">활성 추가금</p>
              {activeSurcharges.map(({ label, value }) => (
                <SummaryRow key={label} icon="➕" label={label} value={formatPrice(value)} />
              ))}
            </>
          )}

          <div className="h-px bg-border" />

          {/* 기본 시술 시간 */}
          <SummaryRow icon="⏱️" label="기본 시술 시간" value={formatMinutes(timeSettings.baseHand)} />
        </motion.div>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-3 mt-2">
          <Button size="lg" fullWidth onClick={handleTour}>
            앱 둘러보기
          </Button>
          <Button size="lg" fullWidth variant="secondary" onClick={handleHome}>
            홈으로 이동
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
