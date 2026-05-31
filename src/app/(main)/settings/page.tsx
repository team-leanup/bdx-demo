'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, LanguageSelector, Toggle, TimeInput, AddressInput } from '@/components/ui';
import { FeatureDiscovery } from '@/components/onboarding/FeatureDiscovery';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { MembershipPlansSection } from '@/components/settings/MembershipPlansSection';
import { RevisitMessageSection } from '@/components/settings/RevisitMessageSection';
import { CustomPartsManager } from '@/components/settings/CustomPartsManager';
import { StaffSection } from '@/components/settings/StaffSection';
import { OperatingHoursSection } from '@/components/settings/OperatingHoursSection';
import { IconShop, IconService, IconPalette, IconGear } from '@/components/icons';
import { useAppStore } from '@/store/app-store';
import type { CategoryPricingSettings, CustomCategory } from '@/types/shop';
import { MAX_CUSTOM_CATEGORIES } from '@/types/pre-consultation';
import { useAuthStore } from '@/store/auth-store';
import { Modal } from '@/components/ui/Modal';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { useShopStore } from '@/store/shop-store';
import { DEFAULT_BASE_PRICES } from '@/data/service-options';
import { formatPrice } from '@/lib/format';
import { resolveMenuCategoryLabel } from '@/lib/labels';
import { resizeImageToBase64 } from '@/lib/image-utils';
import { getShopLogoPublicUrl } from '@/lib/db';
import type { ServiceStructure } from '@/types/shop';

// 사전상담/현장모드 UI에 실제 매핑되는 토글만 노출.
// 매핑할 UI가 없는 gradation/repair/overlay는 제거 (사장님 혼란 방지).
// pointFullArt도 추가 — 사전상담 카테고리 '아트' 카드 + 추가옵션 '포인트아트'에 매핑됨.
const SERVICE_TOGGLE_ITEMS: { key: keyof ServiceStructure; label: string; description: string }[] = [
  { key: 'removal', label: '오프 (제거)', description: '자샵오프, 타샵오프 선택 옵션' },
  { key: 'french', label: '프렌치', description: '프렌치 네일 표현 기법' },
  { key: 'magnet', label: '자석 / 마그넷', description: '자석젤·캣아이 등 마그네틱 시술' },
  { key: 'pointFullArt', label: '아트 (포인트/풀아트)', description: '포인트·풀아트 시술' },
  { key: 'parts', label: '파츠', description: '파츠 (스톤, 참 등) 옵션' },
  { key: 'extension', label: '연장', description: '네일 연장 서비스' },
];

type TabId = 'shop' | 'service' | 'theme' | 'app';

const TAB_ICONS: Record<string, React.ReactNode> = {
  shop: <IconShop className="w-4 h-4" />,
  service: <IconService className="w-4 h-4" />,
  theme: <IconPalette className="w-4 h-4" />,
  app: <IconGear className="w-4 h-4" />,
};

const TAB_IDS: TabId[] = ['shop', 'service', 'theme', 'app'];

// CustomPartsManager → src/components/settings/CustomPartsManager.tsx 로 분리됨

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 px-4 md:px-0 text-xs font-semibold uppercase tracking-wider text-text-muted">
        {title}
      </p>
      {children}
    </div>
  );
}

// StaffSection → src/components/settings/StaffSection.tsx 로 분리됨


// 운영 정보 섹션 (매장 탭 내부)

// OperatingHoursSection → src/components/settings/OperatingHoursSection.tsx 로 분리됨


// StorageManagementSection → src/components/settings/StorageManagementSection.tsx 로 분리됨

function isValidBookingUrl(url: string): boolean {
  if (!url) return true; // empty is ok
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export default function SettingsPage() {
  const router = useRouter();
  const t = useT();
  const { shopSettings, setShopSettings } = useAppStore();
  const { role, logout, currentShopId } = useAuthStore();
  const isDemoMode = currentShopId === 'shop-demo';
  const shop = useShopStore((s) => s.shop);
  const updateShop = useShopStore((s) => s.updateShop);

  const [activeTab, setActiveTab] = useState<TabId>('shop');

  

  // 매장 정보 편집
  const [editingShop, setEditingShop] = useState(false);
  const [isSavingShop, setIsSavingShop] = useState(false);
  const [shopFeedback, setShopFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  // 0531 회의: 매장 로고 업로드 (고객 화면·첫 화면에 노출)
  const uploadShopLogo = useShopStore((s) => s.uploadShopLogo);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoPublicUrl = shop?.logoUrl ? getShopLogoPublicUrl(shop.logoUrl) : null;
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const base64 = await resizeImageToBase64(file, 400);
      const result = await uploadShopLogo(base64);
      setShopFeedback(
        result.success
          ? { tone: 'success', message: '로고가 저장됐어요' }
          : { tone: 'error', message: result.error ?? '로고 저장에 실패했어요' },
      );
    } catch {
      setShopFeedback({ tone: 'error', message: '로고 업로드 중 오류가 발생했어요' });
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };
  const [shopName, setShopName] = useState(shopSettings.shopName || shop?.name || '');
  const [shopPhone, setShopPhone] = useState(shopSettings.shopPhone || shop?.phone || '');
  const [shopAddress, setShopAddress] = useState(shopSettings.shopAddress || shop?.address || '');
  const [shopAddressDetail, setShopAddressDetail] = useState(shopSettings.shopAddressDetail || '');
  const [kakaoTalkUrl, setKakaoTalkUrl] = useState(shopSettings.kakaoTalkUrl || '');
  const [naverReservationUrl, setNaverReservationUrl] = useState(shopSettings.naverReservationUrl || '');

  // 서비스 가격 인라인 편집
  const [editingPrices, setEditingPrices] = useState(false);

  // N-20: 편집 중 이탈 시 브라우저 경고
  useEffect(() => {
    const isEditing = editingShop || editingPrices;
    if (!isEditing) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [editingShop, editingPrices]);
  // 오프 추가금: baseOff* 와 surcharges.*Removal 두 표현이 있어 온보딩(surcharges) 값도 폴백으로 읽는다.
  // 저장 시 handleSavePrices 가 두 표현을 모두 동기화하므로 이후로는 항상 일치.
  const [priceOffSame, setPriceOffSame] = useState(String(shopSettings.baseOffSameShop ?? shopSettings.surcharges.selfRemoval ?? DEFAULT_BASE_PRICES.offSameShop));
  const [priceOffOther, setPriceOffOther] = useState(String(shopSettings.baseOffOtherShop ?? shopSettings.surcharges.otherRemoval ?? DEFAULT_BASE_PRICES.offOtherShop));
  const [priceExtension, setPriceExtension] = useState(String(shopSettings.surcharges.extension ?? DEFAULT_BASE_PRICES.extension));
  const [priceWrapping, setPriceWrapping] = useState(String(shopSettings.surcharges.wrapping ?? 5000));
  // [CRITICAL SSOT] 계산 엔진은 surcharges.pointArt를 읽으므로,
  // 설정 화면도 그 값을 초기값으로 표시한다. (baseSolidPointPrice는 save 시 함께 동기화)
  const [priceSolidPoint, setPriceSolidPoint] = useState(String(shopSettings.surcharges.pointArt ?? DEFAULT_BASE_PRICES.solidPoint));
  const [priceDeposit, setPriceDeposit] = useState(String(shopSettings.depositAmount ?? 10000));
  const [monthlyTarget, setMonthlyTarget] = useState(String(shopSettings.monthlyTargetRevenue ?? ''));
  const [savedPrices, setSavedPrices] = useState({
    offSameShop: shopSettings.baseOffSameShop ?? shopSettings.surcharges.selfRemoval ?? DEFAULT_BASE_PRICES.offSameShop,
    offOtherShop: shopSettings.baseOffOtherShop ?? shopSettings.surcharges.otherRemoval ?? DEFAULT_BASE_PRICES.offOtherShop,
    extension: shopSettings.surcharges.extension ?? DEFAULT_BASE_PRICES.extension,
    wrapping: shopSettings.surcharges.wrapping ?? 5000,
    solidPoint: shopSettings.surcharges.pointArt ?? DEFAULT_BASE_PRICES.solidPoint,
  });

  const [categoryPricingEdit, setCategoryPricingEdit] = useState<CategoryPricingSettings>(shopSettings.categoryPricing);
  const [customCategoriesEdit, setCustomCategoriesEdit] = useState<CustomCategory[]>(shopSettings.customCategories ?? []);
  const [editingCategoryPricing, setEditingCategoryPricing] = useState(false);

  const handleSavePrices = () => {
    const offSameShop = parseInt(priceOffSame, 10);
    const offOtherShop = parseInt(priceOffOther, 10);
    const extension = parseInt(priceExtension, 10);
    const wrapping = parseInt(priceWrapping, 10);
    const solidPoint = parseInt(priceSolidPoint, 10);
    const deposit = parseInt(priceDeposit, 10) || 0;
    const targetRevenue = parseInt(monthlyTarget, 10) || 0;
    // 0528 M8: deposit/monthlyTarget도 음수 차단 (0은 허용)
    if (deposit < 0 || targetRevenue < 0) return;
    if ([offSameShop, offOtherShop, extension, wrapping, solidPoint].some((v) => isNaN(v) || v < 0)) return;
    setSavedPrices({ offSameShop, offOtherShop, extension, wrapping, solidPoint });
    setShopSettings({
      depositAmount: deposit,
      monthlyTargetRevenue: targetRevenue > 0 ? targetRevenue : undefined,
      baseOffSameShop: offSameShop,
      baseOffOtherShop: offOtherShop,
      // SSOT: baseSolidPointPrice는 화면 표시용이고, 실제 계산은 surcharges.pointArt를 사용.
      // 두 값을 항상 동기화해서 설정 화면 표시값과 계산값이 동일하게 유지한다.
      baseSolidPointPrice: solidPoint,
      surcharges: {
        ...shopSettings.surcharges,
        // [CRITICAL 0530] 자샵/타샵 오프는 두 표현(baseOff* = 상담, surcharges.*Removal = 사전상담·현장모드)이
        // 따로 존재한다. 설정 저장 시 둘을 모두 동기화하지 않으면 오프 가격이 사전상담/현장 시술엔
        // 온보딩 값이 그대로 남아 "연동 안 됨" 이 된다.
        selfRemoval: offSameShop,
        otherRemoval: offOtherShop,
        extension,
        wrapping,
        // [CRITICAL] solidPoint 설정값을 surcharges에도 저장 — 계산 엔진이 이 값을 읽음
        pointArt: solidPoint,
      },
    });
    setEditingPrices(false);
  };

  const handleCancelPrices = () => {
    setPriceOffSame(String(savedPrices.offSameShop));
    setPriceOffOther(String(savedPrices.offOtherShop));
    setPriceExtension(String(savedPrices.extension));
    setPriceWrapping(String(savedPrices.wrapping));
    setPriceSolidPoint(String(savedPrices.solidPoint));
    setPriceDeposit(String(shopSettings.depositAmount ?? 10000));
    setMonthlyTarget(String(shopSettings.monthlyTargetRevenue ?? ''));
    setEditingPrices(false);
  };

  const handleSaveCategoryPricing = () => {
    // 추가 카테고리는 한국어 이름 + 양수 가격이 있는 것만 저장
    const cleanedCustom = customCategoriesEdit
      .filter((c) => c.name.trim().length > 0 && c.price >= 0 && c.time >= 0)
      .map((c, idx) => ({ ...c, name: c.name.trim(), order: idx }));
    void setShopSettings({
      categoryPricing: categoryPricingEdit,
      customCategories: cleanedCustom,
    });
    setCustomCategoriesEdit(cleanedCustom);
    setEditingCategoryPricing(false);
  };

  const handleCancelCategoryPricing = () => {
    setCategoryPricingEdit(shopSettings.categoryPricing);
    setCustomCategoriesEdit(shopSettings.customCategories ?? []);
    setEditingCategoryPricing(false);
  };

  const handleAddCustomCategory = () => {
    if (customCategoriesEdit.length >= MAX_CUSTOM_CATEGORIES) return;
    const nextIdx = customCategoriesEdit.length;
    // 빠른 더블탭/연속 호출에도 충돌 안 나도록 crypto.randomUUID 사용
    const rand =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().slice(0, 8)
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    setCustomCategoriesEdit((prev) => [
      ...prev,
      {
        id: `custom-${rand}`,
        name: '',
        price: 0,
        time: 60,
        order: nextIdx,
      },
    ]);
  };

  const handleUpdateCustomCategory = (id: string, patch: Partial<CustomCategory>) => {
    setCustomCategoriesEdit((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const handleRemoveCustomCategory = (id: string) => {
    setCustomCategoriesEdit((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSaveShop = async () => {
    if (!shopName.trim()) {
      setShopFeedback({ tone: 'error', message: '매장명을 입력해 주세요.' });
      return;
    }

    setIsSavingShop(true);
    setShopFeedback(null);

    const [shopResult, settingsResult] = await Promise.all([
      updateShop({
        name: shopName.trim(),
        phone: shopPhone.trim() || undefined,
        address: shopAddress.trim() || undefined,
      }),
      setShopSettings({
        shopName: shopName.trim(),
        shopPhone: shopPhone.trim(),
        shopAddress: shopAddress.trim(),
        shopAddressDetail: shopAddressDetail.trim(),
      }),
    ]);

    setIsSavingShop(false);

    if (!shopResult.success || !settingsResult.success) {
      setShopFeedback({
        tone: 'error',
        message: shopResult.error ?? settingsResult.error ?? '운영 정보 저장에 실패했습니다. 다시 시도해 주세요.',
      });
      return;
    }

    setEditingShop(false);
    setShopFeedback({ tone: 'success', message: '운영 정보가 저장되었습니다.' });
  };

  const handleLogout = () => {
    void logout().then(() => {
      router.push('/login');
    });
  };

  const TABS: { id: TabId; label: string }[] = TAB_IDS.map((id) => ({
    id,
    label: t(`settings.tabs_${id}`),
  }));

  // Staff can only see 테마/앱 tabs
  const visibleTabs = role === 'staff'
    ? TABS.filter((tab) => ['theme', 'app'].includes(tab.id))
    : TABS;

  // If current active tab is not visible (staff restriction), reset
  const effectiveTab = visibleTabs.some((tab) => tab.id === activeTab) ? activeTab : visibleTabs[0]?.id ?? 'theme';

  const tabContent = (
    <>
      {isDemoMode && (
        <div className="mx-4 md:mx-0 mb-3 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
          <svg className="h-4 w-4 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-xs text-amber-700">
            현재 데모 모드로 이용 중이에요. 설정을 변경하셔도 실제 데이터에는 반영되지 않으니 참고해 주세요.
          </p>
        </div>
      )}
      {/* ── 매장 탭 ── */}
      {effectiveTab === 'shop' && (
        <>
          {/* 매장 정보 */}
          <Section title={t('settings.shop_title')}>
            <Card className="mx-4 md:mx-0">
              {shopFeedback && (
                <div
                  className={cn(
                    'mb-3 rounded-xl border px-3 py-2 text-xs font-medium',
                    shopFeedback.tone === 'success'
                      ? 'border-success/20 bg-success/10 text-success'
                      : 'border-error/20 bg-error/10 text-error',
                  )}
                >
                  {shopFeedback.message}
                </div>
              )}

              {/* 매장 로고 — 고객 화면·첫 화면에 표시 */}
              <div className="mb-4 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl border border-border bg-surface-alt overflow-hidden flex items-center justify-center flex-shrink-0">
                  {logoPublicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPublicUrl} alt="매장 로고" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl" aria-hidden="true">🏪</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="shop-logo-input"
                    className="inline-flex w-fit cursor-pointer items-center rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-alt"
                  >
                    {logoUploading ? '업로드 중...' : logoPublicUrl ? '로고 변경' : '로고 추가'}
                  </label>
                  <input
                    id="shop-logo-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleLogoChange(e)}
                    disabled={logoUploading}
                  />
                  <span className="text-xs text-text-muted">고객 화면·첫 화면에 표시돼요</span>
                </div>
              </div>

              {!editingShop ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-text">{shopName}</h2>
                      <p className="mt-0.5 text-sm text-text-secondary">{shopPhone}</p>
                    </div>
                    <button
                      onClick={() => {
                        setShopFeedback(null);
                        setEditingShop(true);
                      }}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary"
                    >
                      {t('settings.shop_edit')}
                    </button>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 text-sm">
                    <div className="flex gap-2">
                      <span className="flex-shrink-0 text-text-muted">{t('settings.shop_address')}</span>
                      <span className="break-words min-w-0 flex-1 text-text">
                        {shopAddress}
                        {shopAddressDetail && ` ${shopAddressDetail}`}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">{t('settings.shop_name')}</label>
                    <Input
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder={t('settings.shop_name')}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-text-secondary">{t('settings.shop_phone')}</label>
                    <Input
                      value={shopPhone}
                      onChange={(e) => setShopPhone(e.target.value)}
                      placeholder={t('settings.shop_phone')}
                    />
                  </div>
                  <AddressInput
                    label={t('settings.shop_address')}
                    value={{ address: shopAddress, addressDetail: shopAddressDetail }}
                    onChange={(addr, detail) => {
                      setShopAddress(addr);
                      setShopAddressDetail(detail);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setShopName(shopSettings.shopName || shop?.name || '');
                        setShopPhone(shopSettings.shopPhone || shop?.phone || '');
                        setShopAddress(shopSettings.shopAddress || shop?.address || '');
                        setShopAddressDetail(shopSettings.shopAddressDetail || '');
                        setEditingShop(false);
                      }}
                      disabled={isSavingShop}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => void handleSaveShop()} disabled={isSavingShop}>
                      {isSavingShop ? '저장 중...' : '운영 정보 저장'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </Section>

          {/* 예약 채널 연결 섹션 — 2026-04-17 회의 결정으로 UI 숨김.
              이제 BDX 자체 공유 상담 링크로 예약을 받으므로 네이버/카카오 외부 링크는 불필요.
              (kakaoTalkUrl/naverReservationUrl state·저장 로직·DB 컬럼은 확장 가능성을 위해 보존) */}

          {/* 선생님 관리 */}
          <StaffSection />

          {/* 운영 정보 (영업시간 + 휴무일 통합) */}
          <OperatingHoursSection />
        </>
      )}

      {/* ── 서비스 탭 ── */}
      {effectiveTab === 'service' && (
        <div className="flex flex-col gap-6">
        {/* 0428 P1-7: 회원권 발견성 향상 — 서비스 탭 최상단으로 */}
        <Section title="회원권 상품">
          <MembershipPlansSection />
        </Section>

        <Section title={t('settings.service_title')}>
          <Card className="mx-4 md:mx-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-text">{t('settings.service_priceTable')}</span>
              {!editingPrices ? (
                <button
                  onClick={() => setEditingPrices(true)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-alt transition-colors"
                >
                  {t('settings.shop_edit')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelPrices}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-alt transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSavePrices}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                  >
                    {t('common.save')}
                  </button>
                </div>
              )}
            </div>

            {!editingPrices ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">자샵오프</span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.offSameShop)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">타샵오프</span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.offOtherShop)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">연장 추가금 <span className="text-text-muted">(손가락당)</span></span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.extension)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">랩핑 추가금 <span className="text-text-muted">(손가락당)</span></span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.wrapping)}</span>
                </div>
                <div className="my-1 border-t border-border/50" />
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('settings.service_solidPoint')}</span>
                  <span className="font-medium text-text">+{formatPrice(savedPrices.solidPoint)}</span>
                </div>
                <div className="my-1 border-t border-border/50" />
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">예약금</span>
                  <span className="font-medium text-text">{shopSettings.depositAmount > 0 ? formatPrice(shopSettings.depositAmount) : '없음'}</span>
                </div>
                <div className="my-1 border-t border-border/50" />
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">월 목표 매출</span>
                  <span className="font-medium text-text">
                    {shopSettings.monthlyTargetRevenue != null && shopSettings.monthlyTargetRevenue > 0
                      ? formatPrice(shopSettings.monthlyTargetRevenue)
                      : '미설정'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {[
                  { label: '자샵오프', value: priceOffSame, onChange: setPriceOffSame },
                  { label: '타샵오프', value: priceOffOther, onChange: setPriceOffOther },
                  { label: '연장 추가금 (손가락당)', value: priceExtension, onChange: setPriceExtension },
                  { label: '랩핑 추가금 (손가락당)', value: priceWrapping, onChange: setPriceWrapping },
                  { labelKey: 'service_solidPoint', value: priceSolidPoint, onChange: setPriceSolidPoint },
                  { label: '예약금', value: priceDeposit, onChange: setPriceDeposit },
                  { label: '월 목표 매출', value: monthlyTarget, onChange: setMonthlyTarget },
                ].map(({ labelKey, label, value, onChange }: {
                  labelKey?: string;
                  label?: string;
                  value: string;
                  onChange: (nextValue: string) => void;
                }) => (
                  <div key={labelKey || label} className="flex items-center gap-2">
                    <span className="flex-1 text-sm text-text-secondary">{labelKey ? t(`settings.${labelKey}`) : label}</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        min={0}
                        step={1000}
                        className="w-24 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-right text-text focus:outline-none focus:border-primary transition-colors"
                      />
                      <span className="text-xs text-text-muted">{t('home.stat_won')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="my-3 border-t border-border" />

            {/* 시술 종류 (기본 4개 + 사장님 추가, 최대 8개) */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-text">시술 종류</span>
                <p className="mt-0.5 text-xs text-text-muted">사전상담·현장모드·포트폴리오에서 사용됩니다 (최대 {4 + MAX_CUSTOM_CATEGORIES}개)</p>
              </div>
              {!editingCategoryPricing ? (
                <button
                  onClick={() => {
                    // 편집 진입 시 항상 현재 shopSettings로 재초기화 (stale state 방지)
                    setCategoryPricingEdit(shopSettings.categoryPricing);
                    setCustomCategoriesEdit(shopSettings.customCategories ?? []);
                    setEditingCategoryPricing(true);
                  }}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-alt transition-colors"
                >
                  {t('settings.shop_edit')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelCategoryPricing}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-alt transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSaveCategoryPricing}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                  >
                    {t('common.save')}
                  </button>
                </div>
              )}
            </div>

            {(['simple', 'french', 'magnet', 'art'] as const).map((cat) => {
              // 0530: 포트폴리오 메뉴판·사전상담과 동일한 라벨(심플 / 원컬러, 자석 / 마그넷)로 통일.
              // categoryLabels override 도 동일하게 반영 (resolveMenuCategoryLabel = SSOT).
              const catLabel = resolveMenuCategoryLabel(cat, shopSettings.categoryLabels);
              return (
                <div key={cat} className="flex items-center gap-2 mb-2">
                  <span className="w-28 flex-shrink-0 text-sm text-text-secondary whitespace-nowrap">{catLabel}</span>
                  {editingCategoryPricing ? (
                    <div className="flex flex-1 items-center gap-2">
                      <div className="flex items-center gap-1 flex-1">
                        <input
                          type="number"
                          value={categoryPricingEdit[cat].price}
                          onChange={(e) =>
                            setCategoryPricingEdit((prev) => ({
                              ...prev,
                              [cat]: { ...prev[cat], price: Number(e.target.value) },
                            }))
                          }
                          min={0}
                          step={1000}
                          className="w-24 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-right text-text focus:outline-none focus:border-primary transition-colors"
                        />
                        <span className="text-xs text-text-muted">{t('home.stat_won')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={categoryPricingEdit[cat].time}
                          onChange={(e) =>
                            setCategoryPricingEdit((prev) => ({
                              ...prev,
                              [cat]: { ...prev[cat], time: Number(e.target.value) },
                            }))
                          }
                          min={0}
                          step={10}
                          className="w-16 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-right text-text focus:outline-none focus:border-primary transition-colors"
                        />
                        <span className="text-xs text-text-muted">분</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-1 items-center justify-between">
                      <span className="text-sm font-medium text-text">{formatPrice(shopSettings.categoryPricing[cat].price)}</span>
                      <span className="text-xs text-text-muted">{shopSettings.categoryPricing[cat].time}분</span>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 사장님이 추가한 시술 종류 */}
            {(editingCategoryPricing ? customCategoriesEdit : (shopSettings.customCategories ?? [])).map((cat) => (
              editingCategoryPricing ? (
                <div key={cat.id} className="mt-2 rounded-xl border border-border bg-surface-alt p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => handleUpdateCustomCategory(cat.id, { name: e.target.value })}
                      placeholder="이름 (필수, 한국어)"
                      maxLength={20}
                      className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomCategory(cat.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-rose-50 hover:text-rose-500 transition-colors"
                      aria-label={`${cat.name || '시술 종류'} 삭제`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a2 2 0 012-2h2a2 2 0 012 2v3" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        value={cat.price}
                        onChange={(e) => handleUpdateCustomCategory(cat.id, { price: Number(e.target.value) })}
                        min={0}
                        step={1000}
                        className="w-24 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-right text-text focus:outline-none focus:border-primary transition-colors"
                      />
                      <span className="text-xs text-text-muted">{t('home.stat_won')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={cat.time}
                        onChange={(e) => handleUpdateCustomCategory(cat.id, { time: Number(e.target.value) })}
                        min={0}
                        step={10}
                        className="w-16 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-right text-text focus:outline-none focus:border-primary transition-colors"
                      />
                      <span className="text-xs text-text-muted">분</span>
                    </div>
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-text-muted hover:text-text-secondary">다국어 이름 (선택) · 미입력 시 한국어로 표시</summary>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={cat.nameEn ?? ''}
                        onChange={(e) => handleUpdateCustomCategory(cat.id, { nameEn: e.target.value })}
                        placeholder="English"
                        maxLength={30}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                      />
                      <input
                        type="text"
                        value={cat.nameZh ?? ''}
                        onChange={(e) => handleUpdateCustomCategory(cat.id, { nameZh: e.target.value })}
                        placeholder="中文"
                        maxLength={20}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                      />
                      <input
                        type="text"
                        value={cat.nameJa ?? ''}
                        onChange={(e) => handleUpdateCustomCategory(cat.id, { nameJa: e.target.value })}
                        placeholder="日本語"
                        maxLength={20}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                      />
                    </div>
                    <input
                      type="text"
                      value={cat.description ?? ''}
                      onChange={(e) => handleUpdateCustomCategory(cat.id, { description: e.target.value })}
                      placeholder="짧은 설명 (예: 영롱한 캣아이·자석젤)"
                      maxLength={40}
                      className="mt-2 w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-text focus:outline-none focus:border-primary transition-colors"
                    />
                  </details>
                </div>
              ) : (
                <div key={cat.id} className="flex items-center gap-2 mb-2">
                  <span className="w-28 flex-shrink-0 text-sm text-text-secondary truncate">{cat.name}</span>
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm font-medium text-text">{formatPrice(cat.price)}</span>
                    <span className="text-xs text-text-muted">{cat.time}분</span>
                  </div>
                </div>
              )
            ))}

            {/* 추가하기 버튼 — 편집 모드일 때만, 최대 4개까지 */}
            {editingCategoryPricing && customCategoriesEdit.length < MAX_CUSTOM_CATEGORIES && (
              <button
                type="button"
                onClick={handleAddCustomCategory}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface px-3 py-2.5 text-sm font-semibold text-text-secondary hover:border-primary hover:text-primary transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                시술 종류 추가 ({customCategoriesEdit.length}/{MAX_CUSTOM_CATEGORIES})
              </button>
            )}

            <div className="my-3 border-t border-border" />

            <div className="mb-2">
              <p className="text-xs font-medium text-text-secondary">{t('settings.service_customParts')}</p>
              <p className="text-xs text-text-muted mt-0.5">{t('settings.service_customPartsDesc')}</p>
            </div>
            <CustomPartsManager />

            <Card className="mx-4 md:mx-0">
              <div className="mb-3">
                <span className="text-sm font-medium text-text">시술 항목 관리</span>
                <p className="mt-0.5 text-xs text-text-muted">현재 매장에서 제공 중인 시술을 선택하세요. OFF한 항목은 상담 시 표시되지 않습니다.</p>
              </div>

              <div className="flex flex-col gap-0">
                {SERVICE_TOGGLE_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center justify-between border-b border-border/50 py-3 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-text">{item.label}</p>
                      <p className="text-xs text-text-muted">{item.description}</p>
                    </div>
                    <Toggle
                      checked={shopSettings.serviceStructure[item.key]}
                      onChange={(checked) => {
                        void setShopSettings({
                          serviceStructure: {
                            ...shopSettings.serviceStructure,
                            [item.key]: checked,
                          },
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </Card>
        </Section>

        <Section title="고객 알림">
          <RevisitMessageSection />
        </Section>
        </div>
      )}

      {/* ── 테마 탭 ── */}
      {effectiveTab === 'theme' && (
        <Section title={t('settings.theme_title')}>
          <Card className="mx-4 md:mx-0">
            <p className="mb-3 text-sm font-medium text-text">{t('settings.theme_select')}</p>
            <ThemeSelector />
          </Card>
        </Section>
      )}

      {/* ── 앱 탭 ── */}
      {effectiveTab === 'app' && (
        <div className="flex flex-col gap-6">
          {/* 언어 설정 */}
          <Section title={t('settings.language')}>
            <Card className="mx-4 md:mx-0">
              <LanguageSelector />
            </Card>
          </Section>

          {/* 앱 정보 */}
          <Section title={t('settings.app_title')}>
            <Card className="mx-4 md:mx-0">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">{t('settings.version')}</span>
                  <span className="font-medium text-text">1.0.0</span>
                </div>

                {isDemoMode ? (
                  <button
                    onClick={async () => {
                      await logout();
                      router.push('/login');
                    }}
                    className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-3 py-3 text-left transition-colors hover:bg-primary/10"
                  >
                    <svg className="h-5 w-5 flex-shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-primary">데모 모드 나가기</p>
                      <p className="mt-0.5 text-xs text-text-muted">로그인 화면으로 돌아갑니다</p>
                    </div>
                    <svg className="h-4 w-4 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      await logout();
                      const { loginAsDemo } = useAuthStore.getState();
                      await loginAsDemo();
                      router.push('/home');
                    }}
                    className="flex items-center gap-3 rounded-xl border border-border px-3 py-3 text-left transition-colors hover:bg-surface-alt"
                  >
                    <svg className="h-5 w-5 flex-shrink-0 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text">데모 모드로 전환</p>
                      <p className="mt-0.5 text-xs text-text-muted">Mock 데이터로 전체 기능을 체험합니다</p>
                    </div>
                    <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}

                <div className="border-t border-border pt-3">
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={handleLogout}
                    className="text-error hover:bg-error/10"
                  >
                    {t('settings.logout')}
                  </Button>
                </div>
              </div>
            </Card>
          </Section>
        </div>
      )}
    </>
  );

  return (
    <div className="flex flex-col pb-8">
      <FeatureDiscovery
        featureId="settings-intro"
        icon={
          <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
        title={t('settings.title')}
        description={"매장 정보, 서비스 가격, 파츠 등록, 테마 변경 등을\n관리하세요."}
      />
      {/* 헤더 */}
      <div className="px-4 md:px-0 pt-4 pb-3">
        <h1 className="text-2xl font-bold text-text">{t('settings.title')}</h1>
      </div>

      {/* Tablet: side-by-side layout */}
      <div className="md:flex md:flex-row md:gap-6">
        {/* Mobile horizontal tab bar (hidden on md) */}
        <div className="md:hidden sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex overflow-x-auto scrollbar-hide px-4 gap-1">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabId)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 transition-colors duration-150',
                  effectiveTab === tab.id
                    ? 'border-primary text-primary shadow-sm'
                    : 'border-transparent text-text-muted',
                )}
              >
                <span className="leading-none">{TAB_ICONS[tab.id]}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tablet vertical tab list (hidden on mobile) */}
        <div className="hidden md:flex md:flex-col md:w-44 md:flex-shrink-0 md:pt-2 md:gap-1">
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-colors duration-150 text-left',
                effectiveTab === tab.id
                  ? 'bg-primary/10 text-primary shadow-sm'
                  : 'text-text-muted hover:bg-surface-alt hover:text-text',
              )}
            >
              <span className="leading-none">{TAB_ICONS[tab.id]}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 flex flex-col gap-6 pt-5 md:pt-0 md:min-w-0">
          {tabContent}
        </div>
      </div>
    </div>
  );
}
