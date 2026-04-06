'use client';

import { motion } from 'framer-motion';
import { useT, useKo, useLocale } from '@/lib/i18n';
import { usePreConsultStore } from '@/store/pre-consult-store';
import { Button } from '@/components/ui/Button';
import type { NailCurrentStatus, RemovalPreference, LengthPreference, ExtensionLength, DesignFeel, StylePreference, StyleKeyword, AddOnOption } from '@/types/pre-consultation';
import type { NailShape } from '@/types/consultation';

interface ConsultReviewProps {
  onConfirm: () => void;
  onModify: (section: string) => void;
}

interface ReviewRowProps {
  label: string;
  value: string;
  section: string;
  modifyLabel: string;
  onModify: (section: string) => void;
}

function ReviewRow({ label, value, section, modifyLabel, onModify }: ReviewRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs text-text-muted">{label}</span>
        <span className="text-sm font-semibold text-text truncate">{value}</span>
      </div>
      <button
        type="button"
        onClick={() => onModify(section)}
        className="text-xs text-primary font-medium ml-4 flex-shrink-0 hover:underline"
      >
        {modifyLabel}
      </button>
    </div>
  );
}

// ── Translation helpers ───────────────────────────────────────────────────────

function useNailStatusLabel(status: NailCurrentStatus | null, t: (key: string) => string): string {
  if (!status) return '-';
  if (status === 'none') return t('preConsult.nailNone');
  return t('preConsult.nailExisting');
}

function useRemovalLabel(pref: RemovalPreference | null, t: (key: string) => string): string {
  if (!pref || pref === 'none') return '-';
  if (pref === 'self_shop') return t('preConsult.removalSelf');
  return t('preConsult.removalOther');
}

function useLengthLabel(pref: LengthPreference | null, ext: ExtensionLength | null, t: (key: string) => string): string {
  if (!pref) return '-';
  if (pref === 'keep') return t('preConsult.lengthKeep');
  if (pref === 'shorten') return t('preConsult.lengthShort');
  if (pref === 'extend') {
    const extLabel = ext === 'natural'
      ? t('preConsult.extensionNatural')
      : ext === 'medium'
        ? t('preConsult.extensionMedium')
        : ext === 'long'
          ? t('preConsult.extensionLong')
          : '';
    return `${t('preConsult.lengthExtend')}${extLabel ? ` · ${extLabel}` : ''}`;
  }
  return '-';
}

function useShapeLabel(shape: NailShape | null, t: (key: string) => string): string {
  if (!shape) return '-';
  const map: Record<string, string> = {
    round: t('preConsult.shapeRound'),
    oval: t('preConsult.shapeOval'),
    square: t('preConsult.shapeSquare'),
    almond: t('preConsult.shapeAlmond'),
  };
  return map[shape] ?? shape;
}

function useFeelLabel(feel: DesignFeel | null, t: (key: string) => string): string {
  if (!feel) return '-';
  const map: Record<DesignFeel, string> = {
    natural: t('preConsult.feelNatural'),
    french: t('preConsult.feelFrench'),
    trendy: t('preConsult.feelTrendy'),
    fancy: t('preConsult.feelFancy'),
  };
  return map[feel];
}

function useStyleLabel(pref: StylePreference | null, t: (key: string) => string): string {
  if (!pref) return '-';
  const map: Record<StylePreference, string> = {
    photo_match: t('preConsult.stylePhotoMatch'),
    natural_fit: t('preConsult.styleNaturalFit'),
    clean_subtle: t('preConsult.styleCleanSubtle'),
  };
  return map[pref];
}

function useKeywordsLabel(keywords: StyleKeyword[], t: (key: string) => string): string {
  if (!keywords.length) return '-';
  const map: Record<StyleKeyword, string> = {
    office_friendly: t('preConsult.kwOffice'),
    slim_fingers: t('preConsult.kwSlim'),
    tidy_look: t('preConsult.kwTidy'),
    subtle_point: t('preConsult.kwPoint'),
    more_fancy: t('preConsult.kwFancy'),
  };
  return keywords.map((k) => map[k]).join(', ');
}

function useAddOnsLabel(addOns: AddOnOption[], t: (key: string) => string): string {
  if (!addOns.length) return '-';
  const map: Record<AddOnOption, string> = {
    stone: t('preConsult.addOnStone'),
    parts: t('preConsult.addOnParts'),
    glitter: t('preConsult.addOnGlitter'),
    point_art: t('preConsult.addOnPointArt'),
  };
  return addOns.map((a) => map[a]).join(', ');
}

// ── Main component ────────────────────────────────────────────────────────────

export function ConsultReview({ onConfirm, onModify }: ConsultReviewProps): React.ReactElement {
  const t = useT();
  const tKo = useKo();
  const locale = useLocale();
  const store = usePreConsultStore();

  const nailStatusLabel = useNailStatusLabel(store.nailStatus, t);
  const removalLabel = useRemovalLabel(store.removalPreference, t);
  const lengthLabel = useLengthLabel(store.lengthPreference, store.extensionLength, t);
  const shapeLabel = useShapeLabel(store.nailShape, t);
  const feelLabel = useFeelLabel(store.designFeel, t);
  const styleLabel = useStyleLabel(store.stylePreference, t);
  const keywordsLabel = useKeywordsLabel(store.styleKeywords, t);
  const addOnsLabel = useAddOnsLabel(store.addOns, t);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      <div>
        <h3 className="text-base font-bold text-text">
          {t('preConsult.reviewTitle')}
        </h3>
        {locale !== 'ko' && (
          <p className="text-xs text-text-muted opacity-60 mt-0.5">
            {tKo('preConsult.reviewTitle')}
          </p>
        )}
      </div>

      {/* Design / Photo preview */}
      {store.selectedPhotoUrl && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-surface border border-border">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.selectedPhotoUrl} alt="selected design" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted">{t('consultation.designLabel')}</p>
            <p className="text-sm font-semibold text-text">
              {store.selectedCategory ? t(`preConsult.cat${store.selectedCategory.charAt(0).toUpperCase()}${store.selectedCategory.slice(1)}`) : '-'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onModify('upload')}
            className="text-xs text-primary font-medium flex-shrink-0 hover:underline"
          >
            {t('preConsult.modifyBtn')}
          </button>
        </div>
      )}

      {/* Reference images */}
      {store.referenceImageUrls.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">
              {t('preConsult.refPhotoLabel')} {store.referenceImageUrls.length}{t('preConsult.refPhotoUnit')}
            </p>
            <button
              type="button"
              onClick={() => onModify('upload')}
              className="text-xs text-primary font-medium hover:underline"
            >
              {t('preConsult.modifyBtn')}
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {store.referenceImageUrls.map((url) => (
              <div key={url} className="relative w-14 h-14 rounded-xl overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="reference" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary rows */}
      <div className="rounded-2xl bg-surface border border-border px-4 divide-y divide-border">
        <ReviewRow
          label="현재 네일"
          value={`${nailStatusLabel}${store.removalPreference && store.removalPreference !== 'none' ? ` · ${removalLabel}` : ''}`}
          section="nailStatus"
          modifyLabel={t('preConsult.modifyBtn')}
          onModify={onModify}
        />
        <ReviewRow
          label="길이"
          value={lengthLabel}
          section="length"
          modifyLabel={t('preConsult.modifyBtn')}
          onModify={onModify}
        />
        <ReviewRow
          label="모양"
          value={shapeLabel}
          section="shape"
          modifyLabel={t('preConsult.modifyBtn')}
          onModify={onModify}
        />
        <ReviewRow
          label="분위기"
          value={feelLabel}
          section="vibe"
          modifyLabel={t('preConsult.modifyBtn')}
          onModify={onModify}
        />
        <ReviewRow
          label="스타일"
          value={styleLabel}
          section="style"
          modifyLabel={t('preConsult.modifyBtn')}
          onModify={onModify}
        />
        {store.styleKeywords.length > 0 && (
          <ReviewRow
            label="키워드"
            value={keywordsLabel}
            section="style"
            modifyLabel={t('preConsult.modifyBtn')}
            onModify={onModify}
          />
        )}
        {store.addOns.length > 0 && (
          <ReviewRow
            label="추가 옵션"
            value={addOnsLabel}
            section="addons"
            modifyLabel={t('preConsult.modifyBtn')}
            onModify={onModify}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <Button size="lg" fullWidth onClick={onConfirm}>
          <span>{t('preConsult.confirmBtn')}</span>
          {locale !== 'ko' && (
            <span className="text-xs opacity-70 ml-1">{tKo('preConsult.confirmBtn')}</span>
          )}
        </Button>
        <Button variant="ghost" fullWidth onClick={() => onModify('upload')}>
          {t('preConsult.modifyBtn')}
        </Button>
      </div>
    </motion.div>
  );
}
