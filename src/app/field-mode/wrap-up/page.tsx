'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useT } from '@/lib/i18n';
import { useFieldModeStore } from '@/store/field-mode-store';
import { useCustomerStore } from '@/store/customer-store';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useRecordsStore } from '@/store/records-store';
import { getTodayInKorea } from '@/lib/format';
import { PhotoCapture } from '@/components/field-mode/PhotoCapture';
import { Button } from '@/components/ui/Button';
import { ShareCardGeneratorModal } from '@/components/share-card/ShareCardGeneratorModal';
import { useAuthStore } from '@/store/auth-store';
import { useAppStore } from '@/store/app-store';

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ChecklistRowProps {
  label: string;
  active: boolean;
}

function ChecklistRow({ label, active }: ChecklistRowProps): React.ReactElement {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
          active ? 'bg-success text-white' : 'bg-surface-alt text-text-muted'
        }`}
      >
        ✓
      </div>
      <span className={`text-sm font-medium ${active ? 'text-text' : 'text-text-muted'}`}>
        {label}
      </span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WrapUpPage(): React.ReactElement {
  const router = useRouter();
  const t = useT();

  // Field mode store
  const customerName = useFieldModeStore((s) => s.customerName);
  const customerPhone = useFieldModeStore((s) => s.customerPhone);
  const customerId = useFieldModeStore((s) => s.customerId);
  const afterPhotoUrls = useFieldModeStore((s) => s.afterPhotoUrls);
  const recordId = useFieldModeStore((s) => s.recordId);
  const selectedCategory = useFieldModeStore((s) => s.selectedCategory);
  const setCustomerInfo = useFieldModeStore((s) => s.setCustomerInfo);
  const addAfterPhoto = useFieldModeStore((s) => s.addAfterPhoto);
  const removeAfterPhoto = useFieldModeStore((s) => s.removeAfterPhoto);
  const reset = useFieldModeStore((s) => s.reset);

  // Customer store
  const customers = useCustomerStore((s) => s.customers);
  const createCustomer = useCustomerStore((s) => s.createCustomer);
  const getById = useCustomerStore((s) => s.getById);

  // Portfolio store
  const addPhoto = usePortfolioStore((s) => s.addPhoto);
  const hydrateRecordsFromDB = useRecordsStore((s) => s.hydrateFromDB);

  // customerId가 있는 경우 고객 정보를 store에서 읽어옴 (예약 연동 자동 매핑)
  const linkedCustomer = useMemo(
    () => (customerId ? getById(customerId) : undefined),
    [customerId, getById],
  );

  // Local form state: 이미 연결된 고객이 있으면 그 정보 사용
  const [localName, setLocalName] = useState(
    linkedCustomer?.name ?? customerName,
  );
  const [localPhone, setLocalPhone] = useState(
    linkedCustomer?.phone ?? customerPhone,
  );
  const [customerSaved, setCustomerSaved] = useState(!!customerId);
  const [isSaving, setIsSaving] = useState(false);
  const [isGoingHome, setIsGoingHome] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  const shopName = useAppStore((s) => s.shopSettings.shopName);
  const shopId = useAuthStore((s) => s.currentShopId ?? '');
  const getRecordById = useRecordsStore((s) => s.getRecordById);
  const currentRecord = useMemo(
    () => (recordId ? getRecordById(recordId) : undefined),
    [recordId, getRecordById],
  );
  const portfolioPhotos = usePortfolioStore(
    useShallow((s) => s.photos.filter((p) => p.recordId === recordId)),
  );

  // Redirect guard: if no recordId, we shouldn't be here
  // (handled via useEffect would cause flicker; do it inline with a render guard)
  const hasRecord = !!recordId;

  // ─── Customer match suggestion ──────────────────────────────────────────────
  const matchedCustomer = useMemo(() => {
    const phone = localPhone.replace(/[^0-9]/g, '');
    if (phone.length >= 4) {
      return customers.find((c) => c.phone?.replace(/[^0-9]/g, '').includes(phone));
    }
    if (localName.length >= 2) {
      return customers.find((c) => c.name.includes(localName));
    }
    return undefined;
  }, [localName, localPhone, customers]);

  const showSuggestion =
    matchedCustomer &&
    !customerSaved &&
    (matchedCustomer.id !== customerId);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSelectSuggestion = useCallback((): void => {
    if (!matchedCustomer) return;
    setLocalName(matchedCustomer.name);
    setLocalPhone(matchedCustomer.phone ?? '');
    setCustomerInfo(matchedCustomer.name, matchedCustomer.phone ?? '', matchedCustomer.id);
    setCustomerSaved(true);
  }, [matchedCustomer, setCustomerInfo]);

  const handleSaveCustomer = useCallback(async (): Promise<void> => {
    if (!localName.trim()) return;
    setIsSaving(true);

    try {
      const normalizedPhone = localPhone.replace(/[^0-9]/g, '');
      let existingCustomer = normalizedPhone.length >= 4
        ? customers.find((c) => c.phone?.replace(/[^0-9]/g, '') === normalizedPhone)
        : undefined;

      if (!existingCustomer && normalizedPhone.length === 0 && localName.trim().length >= 2) {
        existingCustomer = customers.find((c) => c.name === localName.trim());
      }

      if (existingCustomer) {
        setCustomerInfo(existingCustomer.name, existingCustomer.phone ?? '', existingCustomer.id);
        setCustomerSaved(true);
      } else {
        const newCustomer = createCustomer({
          name: localName.trim(),
          phone: localPhone.trim(),
        });
        setCustomerInfo(newCustomer.name, newCustomer.phone ?? '', newCustomer.id);
        setCustomerSaved(true);
      }

      // Update record with customerId
      const savedId = existingCustomer?.id ?? (localName.trim() ? useFieldModeStore.getState().customerId : null);
      if (savedId && recordId) {
        useRecordsStore.getState().updateRecord(recordId, { customerId: savedId });

        // Update customer stats
        const customer = useCustomerStore.getState().getById(savedId);
        const rec = useRecordsStore.getState().getRecordById(recordId);
        if (customer && rec) {
          const newVisitCount = customer.visitCount + 1;
          const newTotalSpend = customer.totalSpend + rec.finalPrice;
          const today = getTodayInKorea();
          useCustomerStore.getState().updateCustomer(savedId, {
            visitCount: newVisitCount,
            totalSpend: newTotalSpend,
            averageSpend: Math.round(newTotalSpend / newVisitCount),
            lastVisitDate: today,
            treatmentHistory: [
              ...customer.treatmentHistory,
              {
                recordId,
                date: today,
                bodyPart: 'hand',
                designScope: rec.consultation?.designScope ?? '기타',
                price: rec.finalPrice,
                designerName: '',
                imageUrls: [],
              },
            ],
          });
        }
      }
    } finally {
      setIsSaving(false);
    }
  }, [localName, localPhone, customers, createCustomer, setCustomerInfo, recordId]);

  const handleSkip = useCallback((): void => {
    setSkipped(true);
  }, []);

  const handleGoHome = useCallback(async (): Promise<void> => {
    setIsGoingHome(true);

    try {
      const CATEGORY_LABEL: Record<string, string> = {
        simple: '심플',
        french: '프렌치',
        magnet: '자석',
        art: '아트',
      };
      const rec = recordId ? useRecordsStore.getState().getRecordById(recordId) : null;

      // Save photos to portfolio
      for (const dataUrl of afterPhotoUrls) {
        await addPhoto({
          customerId: customerId ?? '',
          recordId: recordId ?? undefined,
          kind: 'treatment',
          imageDataUrl: dataUrl,
          styleCategory: selectedCategory ?? undefined,
          isPublic: true,
          price: rec?.finalPrice,
          serviceType: selectedCategory ? CATEGORY_LABEL[selectedCategory] : undefined,
        });
      }

      // Ensure record has customerId
      const currentCustomerId = useFieldModeStore.getState().customerId;
      const currentRecordId = useFieldModeStore.getState().recordId;
      if (currentCustomerId && currentRecordId) {
        useRecordsStore.getState().updateRecord(currentRecordId, { customerId: currentCustomerId });
      }

      // records store 재조회 (기록 탭 갱신)
      await hydrateRecordsFromDB();

      reset();
      router.push('/home');
    } catch {
      setIsGoingHome(false);
    }
  }, [afterPhotoUrls, addPhoto, customerId, recordId, selectedCategory, reset, router, hydrateRecordsFromDB]);

  // ─── Redirect if no record ───────────────────────────────────────────────────
  if (!hasRecord) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-6 pb-8">
        <p className="text-text-muted text-center">시술 기록이 없어요. 처음부터 다시 시작해주세요.</p>
        <Button variant="primary" onClick={() => router.push('/field-mode')}>
          돌아가기
        </Button>
      </div>
    );
  }

  // ─── Checklist state ─────────────────────────────────────────────────────────
  const currentCustomerId = customerId;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="px-5 pt-6 pb-8 max-w-lg mx-auto space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-black text-text tracking-tight">
          {t('fieldMode.wrapUpTitle')} ✓
        </h1>
        <p className="text-text-muted text-sm mt-1">
          STEP 9~11 · 마무리 단계
        </p>
      </motion.div>

      {/* Success banner */}
      <motion.div
        variants={itemVariants}
        className="bg-success/10 text-success rounded-2xl p-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🎉</span>
          <p className="font-semibold text-sm">{t('fieldMode.wrapUpBanner')}</p>
        </div>
      </motion.div>

      {/* Section 1: Customer Info */}
      {!skipped && (
        <motion.section variants={itemVariants} className="bg-surface rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-text">{t('fieldMode.customerInfoTitle')}</h2>
            <span className="text-xs bg-surface-alt text-text-muted rounded-full px-2 py-0.5">
              {t('fieldMode.customerInfoOptional')}
            </span>
          </div>

          {customerSaved ? (
            <div className="flex items-center gap-3 p-3 bg-success/5 border border-success/20 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                <span className="text-success text-sm">✓</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-success mb-0.5">
                  {customerId ? '고객 카드 연결됨' : '고객 정보 저장됨'}
                </p>
                <p className="text-sm font-semibold text-text truncate">
                  {localName}
                </p>
                {localPhone && (
                  <p className="text-xs text-text-muted">
                    {localPhone}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Name input */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={localName}
                  onChange={(e) => setLocalName(e.target.value)}
                  placeholder={t('fieldMode.customerName')}
                  className="w-full rounded-xl border border-border p-3 bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                />
                <input
                  type="tel"
                  value={localPhone}
                  onChange={(e) => setLocalPhone(e.target.value)}
                  placeholder={t('fieldMode.customerPhone')}
                  className="w-full rounded-xl border border-border p-3 bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors min-h-[44px]"
                />
              </div>

              {/* Search suggestion */}
              {showSuggestion && matchedCustomer && (
                <motion.button
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={handleSelectSuggestion}
                  className="w-full text-left p-3 bg-primary/5 border border-primary/20 rounded-xl transition-colors hover:bg-primary/10 active:scale-[0.99] min-h-[44px]"
                >
                  <p className="text-xs text-primary font-semibold mb-0.5">기존 고객 발견</p>
                  <p className="text-sm text-text font-medium">
                    {matchedCustomer.name}
                    {matchedCustomer.phone && (
                      <span className="text-text-muted font-normal ml-2">{matchedCustomer.phone}</span>
                    )}
                  </p>
                </motion.button>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={handleSkip}
                  className="text-text-muted underline text-sm min-h-[44px] px-1"
                >
                  {t('fieldMode.skipCustomerInfo')}
                </button>
                {localName.trim().length > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSaveCustomer}
                    loading={isSaving}
                    className="min-h-[44px]"
                  >
                    {t('common.save')}
                  </Button>
                )}
              </div>
            </>
          )}
        </motion.section>
      )}

      {/* Section 2: Photo Capture */}
      <motion.section variants={itemVariants} className="bg-surface rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-text">{t('fieldMode.photoSaveTitle')}</h2>
        <PhotoCapture
          photos={afterPhotoUrls}
          onAdd={addAfterPhoto}
          onRemove={removeAfterPhoto}
          maxPhotos={3}
        />
      </motion.section>

      {/* Section 3: Auto data checklist */}
      <motion.section variants={itemVariants} className="bg-surface rounded-2xl p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-text">{t('fieldMode.autoDataTitle')}</h2>
        <div className="space-y-3">
          <ChecklistRow
            label={t('fieldMode.autoDataRecord')}
            active={true}
          />
          <ChecklistRow
            label={t('fieldMode.autoDataCustomer')}
            active={!!currentCustomerId}
          />
          <ChecklistRow
            label={t('fieldMode.autoDataPortfolio')}
            active={afterPhotoUrls.length > 0}
          />
        </div>
      </motion.section>

      {/* Bottom CTA */}
      <motion.div variants={itemVariants} className="pt-2 flex flex-col gap-3">
        {recordId && (
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => setShowShareCard(true)}
            className="min-h-[56px]"
          >
            {t('fieldMode.createShareCard')}
          </Button>
        )}
        <Button
          variant="ghost"
          size="lg"
          fullWidth
          onClick={handleGoHome}
          loading={isGoingHome}
          className="min-h-[56px]"
        >
          {t('fieldMode.backToHome')}
        </Button>
      </motion.div>
      {currentRecord && (
        <ShareCardGeneratorModal
          isOpen={showShareCard}
          onClose={() => setShowShareCard(false)}
          record={{
            id: currentRecord.id,
            shopId: currentRecord.shopId || shopId,
            consultation: currentRecord.consultation,
            shareCardId: currentRecord.shareCardId,
          }}
          portfolioPhotos={portfolioPhotos.map((p) => ({
            id: p.id,
            imageDataUrl: p.imageDataUrl,
            imagePath: p.imagePath,
          }))}
          shopName={shopName}
        />
      )}
    </motion.div>
  );
}
