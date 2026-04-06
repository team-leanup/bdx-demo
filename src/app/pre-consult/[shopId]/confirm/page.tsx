'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { calculatePreConsultPrice } from '@/lib/pre-consult-price';
import { dbCompletePreConsultation, dbCompletePreconsultationBooking, dbCreatePreConsultation, fetchShopPublicData, fetchBookingRequestById } from '@/lib/db';
import { getNowInKoreaIso } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PreConsultationData, DesignCategory } from '@/types/pre-consultation';

// ─── Label Maps ──────────────────────────────────────────────────────────────

function useLabelMaps() {
  const t = useT();
  return {
    category: {
      simple: t('preConsult.catSimple'),
      french: t('preConsult.catFrench'),
      magnet: t('preConsult.catMagnet'),
      art: t('preConsult.catArt'),
    } satisfies Record<DesignCategory, string>,
    nailStatus: {
      none: t('preConsult.nailNone'),
      existing: t('preConsult.nailExisting'),
    },
    removal: {
      none: '—',
      self_shop: t('preConsult.removalSelf'),
      other_shop: t('preConsult.removalOther'),
    },
    length: {
      keep: t('preConsult.lengthKeep'),
      shorten: t('preConsult.lengthShort'),
      extend: t('preConsult.lengthExtend'),
    },
    extensionLength: {
      natural: t('preConsult.extensionNatural'),
      medium: t('preConsult.extensionMedium'),
      long: t('preConsult.extensionLong'),
    },
    shape: {
      round: t('preConsult.shapeRound'),
      oval: t('preConsult.shapeOval'),
      square: t('preConsult.shapeSquare'),
      squoval: t('preConsult.shapeSquare'),
      almond: t('preConsult.shapeAlmond'),
      stiletto: t('preConsult.shapeAlmond'),
      coffin: t('preConsult.shapeAlmond'),
    },
    feel: {
      natural: t('preConsult.feelNatural'),
      french: t('preConsult.feelFrench'),
      trendy: t('preConsult.feelTrendy'),
      fancy: t('preConsult.feelFancy'),
    },
    addOn: {
      stone: t('preConsult.addOnStone'),
      parts: t('preConsult.addOnParts'),
      glitter: t('preConsult.addOnGlitter'),
      point_art: t('preConsult.addOnPointArt'),
    },
  };
}

// ─── Summary Row ─────────────────────────────────────────────────────────────

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps): React.ReactElement {
  return (
    <div className="flex justify-between items-center gap-2 py-1">
      <span className="text-xs text-text-muted flex-shrink-0">{label}</span>
      <span className="text-xs text-text font-medium text-right">{value}</span>
    </div>
  );
}

// ─── Price Row ────────────────────────────────────────────────────────────────

interface PriceRowProps {
  label: string;
  amount: number;
  won: string;
  muted?: boolean;
}

function PriceRow({ label, amount, won, muted = false }: PriceRowProps): React.ReactElement {
  return (
    <div className="flex justify-between items-center py-1">
      <span className={`text-sm ${muted ? 'text-text-muted' : 'text-text-secondary'}`}>{label}</span>
      <span className={`text-sm font-medium ${muted ? 'text-text-muted' : 'text-text'}`}>
        +{amount.toLocaleString('ko-KR')}{won}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PreConsultConfirmPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ shopId: string }>();
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const labels = useLabelMaps();

  const store = usePreConsultStore();
  const {
    selectedCategory,
    selectedPhotoUrl,
    nailStatus,
    removalPreference,
    lengthPreference,
    extensionLength,
    nailShape,
    designFeel,
    addOns,
    referenceImageUrls,
    styleKeywords,
    stylePreference,
    customerName,
    customerPhone,
    shopData,
    bookingId,
    isSubmitting,
  } = store;

  // 새로고침 시 shopData가 null(persist 제외)이면 shopId로 재조회
  useEffect(() => {
    if (!shopData && params.shopId) {
      fetchShopPublicData(params.shopId)
        .then((result) => {
          if (result) {
            store.setShopData(result, []);
          }
        })
        .catch(() => {
          // 조회 실패 — shopData 없이 graceful degradation
        });
    }
  }, [shopData, params.shopId, store]);

  const [name, setName] = useState(customerName);
  const [phone, setPhone] = useState(customerPhone);
  const [submitError, setSubmitError] = useState('');

  // bookingId로 예약 정보 자동 채우기
  useEffect(() => {
    if (!bookingId || (name && phone)) return;
    fetchBookingRequestById(bookingId, params.shopId as string).then((booking) => {
      if (booking) {
        if (!name && booking.customerName) setName(booking.customerName);
        if (!phone && booking.phone) setPhone(booking.phone);
      }
    });
  }, [bookingId, params.shopId, name, phone]);

  // ─── Price calculation ─────────────────────────────────────────────────────

  const priceEstimate =
    selectedCategory && shopData?.categoryPricing && shopData?.surcharges
      ? calculatePreConsultPrice({
          designCategory: selectedCategory,
          removalPreference: removalPreference,
          lengthPreference: lengthPreference,
          addOns: addOns,
          categoryPricing: shopData.categoryPricing,
          surcharges: shopData.surcharges,
        })
      : null;

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const formatPrice = (n: number): string => n.toLocaleString('ko-KR');

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (): Promise<void> => {
    if (usePreConsultStore.getState().isSubmitted) return;

    if (!name.trim() || !phone.trim()) {
      setSubmitError(t('preConsult.nameLabel') + ' / ' + t('preConsult.phoneLabel'));
      return;
    }
    if (!priceEstimate || !selectedCategory) {
      setSubmitError('상담 정보가 부족합니다');
      return;
    }

    store.setCustomerName(name.trim());
    store.setCustomerPhone(phone.trim());
    store.setSubmitting(true);
    setSubmitError('');

    const data: PreConsultationData = {
      designCategory: selectedCategory ?? undefined,
      selectedPhotoUrl: selectedPhotoUrl ?? undefined,
      nailStatus: nailStatus ?? undefined,
      removalPreference: removalPreference ?? undefined,
      lengthPreference: lengthPreference ?? undefined,
      extensionLength: extensionLength ?? undefined,
      nailShape: nailShape ?? undefined,
      designFeel: designFeel ?? undefined,
      stylePreference: stylePreference ?? undefined,
      styleKeyword: styleKeywords,
      addOns: addOns,
      referenceImageUrls: referenceImageUrls,
    };

    // 1. Create a pre-consultation record
    if (bookingId) {
      // bookingId가 있으면 booking_requests만 업데이트 (별도 pre_consultation 불필요)
      const bookingPayload = {
        ...data,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        referenceImages: referenceImageUrls,  // ConsultationType 필드명으로 매핑
      } as unknown as import('@/types/consultation').ConsultationType;
      const result = await dbCompletePreconsultationBooking(
        bookingId,
        bookingPayload,
        getNowInKoreaIso(),
      );
      if (result.success) {
        store.setSubmitted(bookingId);
        router.push(`/pre-consult/${params.shopId}/complete`);
      } else {
        store.setSubmitting(false);
        setSubmitError(result.error ?? '오류가 발생했어요');
      }
    } else {
      // bookingId 없으면 기존 플로우: pre_consultations 테이블에 신규 생성
      const createResult = await dbCreatePreConsultation(params.shopId, locale);
      if (!createResult.success || !createResult.id) {
        store.setSubmitting(false);
        setSubmitError(createResult.error ?? '오류가 발생했어요');
        return;
      }
      const result = await dbCompletePreConsultation(
        createResult.id,
        {
          data,
          confirmed_price: priceEstimate.minTotal,
          estimated_minutes: priceEstimate.estimatedMinutes,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          design_category: selectedCategory,
          reference_image_paths: referenceImageUrls,
        },
        params.shopId,
        locale,
      );
      if (result.success) {
        store.setSubmitted(createResult.id);
        router.push(`/pre-consult/${params.shopId}/complete`);
      } else {
        store.setSubmitting(false);
        setSubmitError(result.error ?? '오류가 발생했어요');
      }
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 px-4 pt-5 pb-10"
    >
      <div className="max-w-lg mx-auto flex flex-col gap-6">

        {/* ── Section 1: Final Summary ─────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col gap-3"
        >
          <h2 className="text-xl font-bold text-text">
            {t('preConsult.summaryTitle')}
          </h2>
          {locale !== 'ko' && (
            <p className="text-xs text-text-muted opacity-60 -mt-2">
              {tKo('preConsult.summaryTitle')}
            </p>
          )}

          <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-2">
            {/* Category badge + photo thumbnail */}
            <div className="flex items-start gap-3">
              {selectedPhotoUrl && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border flex-shrink-0">
                  <Image
                    src={selectedPhotoUrl}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              )}
              <div className="flex flex-col gap-1.5 min-w-0">
                {selectedCategory && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold w-fit">
                    {labels.category[selectedCategory]}
                  </span>
                )}
                {referenceImageUrls.length > 0 && (
                  <span className="text-[11px] text-text-muted">
                    📎 {t('preConsult.uploadTitle').split(' ')[0]} {referenceImageUrls.length}
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border my-1" />

            {/* Summary rows */}
            {nailStatus && (
              <SummaryRow
                label={t('preConsult.currentNailTitle').replace('을 알려주세요', '').replace('Tell us about your ', '').replace('请告诉我们您的', '').replace('現在のネイルの状態を', '')}
                value={labels.nailStatus[nailStatus] ?? nailStatus}
              />
            )}
            {removalPreference && removalPreference !== 'none' && (
              <SummaryRow
                label={t('preConsult.removalTitle').replace('어디서 받으셨나요?', '제거').replace('Where did you get them done?', 'Removal').replace('在哪里做的？', '去除').replace('どこでされましたか？', '除去')}
                value={labels.removal[removalPreference]}
              />
            )}
            {lengthPreference && (
              <SummaryRow
                label={t('preConsult.lengthTitle').split(' ').slice(0, 2).join(' ')}
                value={labels.length[lengthPreference] ?? lengthPreference}
              />
            )}
            {extensionLength && lengthPreference === 'extend' && (
              <SummaryRow
                label={t('preConsult.extensionNatural').split(' ')[0]}
                value={labels.extensionLength[extensionLength] ?? extensionLength}
              />
            )}
            {nailShape && (
              <SummaryRow
                label={t('preConsult.shapeTitle').split(' ')[0]}
                value={labels.shape[nailShape] ?? nailShape}
              />
            )}
            {designFeel && (
              <SummaryRow
                label={t('preConsult.feelTitle').split(' ')[0]}
                value={labels.feel[designFeel] ?? designFeel}
              />
            )}
            {addOns.length > 0 && (
              <SummaryRow
                label={t('preConsult.addOnTitle').split(' ')[0]}
                value={addOns.map((a) => labels.addOn[a] ?? a).join(', ')}
              />
            )}
          </div>
        </motion.section>

        {/* ── Section 2: Confirmed Price ────────────────────────────────────── */}
        {priceEstimate && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
            className="flex flex-col gap-3"
          >
            <h2 className="text-lg font-bold text-text">
              {t('preConsult.priceTitle')}
            </h2>
            {locale !== 'ko' && (
              <p className="text-xs text-text-muted opacity-60 -mt-2">
                {tKo('preConsult.priceTitle')}
              </p>
            )}

            <div className="rounded-2xl border border-border bg-surface p-4 flex flex-col gap-1">
              {/* Base price */}
              <PriceRow
                label={selectedCategory ? labels.category[selectedCategory] : '기본'}
                amount={priceEstimate.categoryBase}
                won={t('preConsult.won')}
              />

              {/* Removal surcharge */}
              {priceEstimate.removalSurcharge > 0 && removalPreference && removalPreference !== 'none' && (
                <PriceRow
                  label={labels.removal[removalPreference]}
                  amount={priceEstimate.removalSurcharge}
                  won={t('preConsult.won')}
                  muted
                />
              )}

              {/* Extension surcharge */}
              {priceEstimate.extensionSurcharge > 0 && (
                <PriceRow
                  label={t('preConsult.lengthExtend')}
                  amount={priceEstimate.extensionSurcharge}
                  won={t('preConsult.won')}
                  muted
                />
              )}

              {/* Add-on surcharge */}
              {priceEstimate.addOnSurcharge > 0 && (
                <PriceRow
                  label={addOns.map((a) => labels.addOn[a] ?? a).join(' + ')}
                  amount={priceEstimate.addOnSurcharge}
                  won={t('preConsult.won')}
                  muted
                />
              )}

              {/* Total */}
              <div className="h-px bg-border mt-2 mb-1" />
              <div className="flex justify-between items-center">
                <span className="font-bold text-text">{t('preConsult.estimatedPrice')}</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(priceEstimate.minTotal)}{t('preConsult.won')}
                </span>
              </div>

              {/* Estimated time */}
              <div className="flex justify-between items-center mt-0.5">
                <span className="text-xs text-text-muted">{t('preConsult.estimatedTime')}</span>
                <span className="text-xs text-text-secondary font-medium">
                  {priceEstimate.estimatedMinutes}{t('preConsult.min')}
                </span>
              </div>

              {/* Reassurance */}
              <p className="text-xs text-primary font-medium mt-2">{t('preConsult.priceNotice')}</p>
              <p className="text-[10px] text-text-muted">{t('preConsult.priceDisclaimer')}</p>

              {/* 샵 안내 문구 (온보딩에서 설정) */}
              {shopData?.customerNotice && (
                <div className="mt-3 pt-3 border-t border-border flex items-start gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4m0 4h.01" />
                  </svg>
                  <p className="text-xs text-text-secondary leading-relaxed">{shopData.customerNotice}</p>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* ── Section 3: Visit Guide ────────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center py-2"
        >
          <p className="text-sm text-text-secondary font-medium">
            {t('preConsult.visitGuide')}
          </p>
          {locale !== 'ko' && (
            <p className="text-[10px] text-text-muted opacity-60 mt-0.5">
              {tKo('preConsult.visitGuide')}
            </p>
          )}
        </motion.section>

        {/* ── Section 4: Booking Form ───────────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="flex flex-col gap-4"
        >
          <div>
            <h2 className="text-lg font-bold text-text">
              {bookingId && name && phone ? '예약 정보를 확인해주세요' : t('preConsult.bookingTitle')}
            </h2>
            {locale !== 'ko' && !(bookingId && name && phone) && (
              <p className="text-xs text-text-muted opacity-60 mt-0.5">
                {tKo('preConsult.bookingTitle')}
              </p>
            )}
          </div>

          {bookingId && name && phone ? (
            <div className="rounded-xl bg-surface-alt border border-border p-4 flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">{t('preConsult.nameLabel')}</span>
                <span className="text-sm font-semibold text-text">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-text-muted">{t('preConsult.phoneLabel')}</span>
                <span className="text-sm font-semibold text-text">{phone}</span>
              </div>
            </div>
          ) : (
            <>
              <Input
                label={t('preConsult.nameLabel')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={locale === 'ko' ? '홍길동' : 'Your name'}
                autoComplete="name"
              />

              <Input
                label={t('preConsult.phoneLabel')}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                autoComplete="tel"
              />
            </>
          )}

          {submitError && (
            <p className="text-xs text-error">{submitError}</p>
          )}

          <Button
            size="lg"
            fullWidth
            loading={isSubmitting}
            onClick={() => { void handleSubmit(); }}
            disabled={!name.trim() || !phone.trim() || isSubmitting}
          >
            {t('preConsult.bookingBtn')}
            {locale !== 'ko' && (
              <span className="block text-[10px] opacity-70 font-normal leading-none mt-0.5">
                {tKo('preConsult.bookingBtn')}
              </span>
            )}
          </Button>
        </motion.section>

      </div>
    </motion.div>
  );
}
