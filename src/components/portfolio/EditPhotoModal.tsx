'use client';

import { useMemo, useState } from 'react';
import { Button, Input, Modal } from '@/components/ui';
import { cn } from '@/lib/cn';
import { usePortfolioStore } from '@/store/portfolio-store';
import { useAppStore } from '@/store/app-store';
import type { PortfolioPhoto, StyleCategory } from '@/types/portfolio';

const BUILTIN_STYLE_CATEGORIES: { value: StyleCategory; label: string }[] = [
  { value: 'simple', label: '심플 / 원컬러' },
  { value: 'french', label: '프렌치' },
  { value: 'magnet', label: '자석 / 마그넷' },
  { value: 'art', label: '아트' },
];

const PRESET_TAGS = ['봄', '여름', '가을', '겨울', '웨딩', '자석젤', '키치', '내추럴', '글리터', '심플', '화려한스타일', '이달의아트', '프렌치', '그라데이션', '마그네틱'];
const PRESET_COLORS = ['핑크', '누드', '베이지', '화이트', '블랙', '레드', '코랄', '브라운', '퍼플', '블루', '그린', '옐로우', '실버', '골드'];

interface EditPhotoModalProps {
  photo: PortfolioPhoto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditPhotoModal({ photo, isOpen, onClose, onSuccess }: EditPhotoModalProps): React.ReactElement {
  const updatePhotoMetadata = usePortfolioStore((s) => s.updatePhotoMetadata);
  const customCategories = useAppStore((s) => s.shopSettings.customCategories) ?? [];
  const styleCategories = useMemo(() => {
    const customs = customCategories.slice().sort((a, b) => a.order - b.order).map((c) => ({
      value: c.id as StyleCategory,
      label: c.description ? `${c.name} (${c.description})` : c.name,
    }));
    return [...BUILTIN_STYLE_CATEGORIES, ...customs];
  }, [customCategories]);
  const [styleCategory, setStyleCategory] = useState<StyleCategory | undefined>(photo.styleCategory);
  const [designType, setDesignType] = useState(photo.designType ?? '');
  const [price, setPrice] = useState<string>(photo.price?.toString() ?? '');
  const [note, setNote] = useState(photo.note ?? '');
  const [tags, setTags] = useState<string[]>(photo.tags ?? []);
  const [colorLabels, setColorLabels] = useState<string[]>(photo.colorLabels ?? []);
  const [takenAt, setTakenAt] = useState(photo.takenAt?.slice(0, 10) ?? photo.createdAt.slice(0, 10));
  const [isFeatured, setIsFeatured] = useState<boolean>(photo.isFeatured ?? false);
  const [customTag, setCustomTag] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTag = (tag: string): void => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const toggleColor = (color: string): void => {
    setColorLabels((prev) => (prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]));
  };

  const addCustomTag = (): void => {
    const v = customTag.trim();
    if (!v) return;
    if (!tags.includes(v)) setTags([...tags, v]);
    setCustomTag('');
  };

  const addCustomColor = (): void => {
    const v = customColor.trim();
    if (!v) return;
    if (!colorLabels.includes(v)) setColorLabels([...colorLabels, v]);
    setCustomColor('');
  };

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    setError(null);
    const numericPrice = price.trim() === '' ? undefined : Number(price.replace(/[^\d]/g, ''));
    const result = await updatePhotoMetadata(photo.id, {
      styleCategory,
      designType: designType.trim() || undefined,
      price: numericPrice && !Number.isNaN(numericPrice) ? numericPrice : undefined,
      note: note.trim() || undefined,
      tags,
      colorLabels,
      takenAt: takenAt || undefined,
      isFeatured,
    });
    setSaving(false);

    if (!result.success) {
      setError(result.error ?? '저장에 실패했어요');
      return;
    }
    onSuccess?.();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="사진 정보 수정">
      <div className="flex flex-col gap-5 p-5 max-h-[70vh] overflow-y-auto">
        {/* 시술 종류 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">시술 종류</label>
          <div className="grid grid-cols-2 gap-2">
            {styleCategories.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setStyleCategory(c.value)}
                className={cn(
                  'rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  styleCategory === c.value
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-text-secondary bg-surface hover:border-primary/40',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 디자인 타입 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">디자인 타입</label>
          <Input
            id="design-type"
            value={designType}
            onChange={(e) => setDesignType(e.target.value)}
            placeholder="예: 웨딩, 시럽, 키치"
          />
        </div>

        {/* 가격 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">가격</label>
          <Input
            id="price"
            type="number"
            inputMode="numeric"
            min={0}
            value={price}
            onChange={(e) => {
              // 0528 M1: 음수 입력 차단 (사전상담 가격 표시 오류 방지)
              const v = e.target.value;
              if (v === '' || /^[0-9]+$/.test(v)) setPrice(v);
            }}
            placeholder="예: 85000"
          />
        </div>

        {/* 촬영일 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">촬영일</label>
          <Input
            id="takenAt"
            type="date"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
          />
        </div>

        {/* 메모 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">메모 (선택)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="파츠·컬러 메모, 시술 노트 등"
            rows={3}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
        </div>

        {/* 태그 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-text-secondary">태그</label>
            <span className="text-xs text-text-muted">{tags.length}개</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                  tags.includes(tag)
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-text-secondary hover:border-primary/40 bg-surface',
                )}
              >
                {tag}
              </button>
            ))}
            {tags.filter((t) => !PRESET_TAGS.includes(t)).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="rounded-full px-3 py-1 text-xs font-medium border bg-primary text-white border-primary"
              >
                {tag} ×
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomTag();
                }
              }}
              placeholder="직접 입력 후 Enter"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={addCustomTag}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:border-primary/40"
            >
              추가
            </button>
          </div>
        </div>

        {/* 컬러 */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">컬러</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleColor(color)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                  colorLabels.includes(color)
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-text-secondary hover:border-primary/40 bg-surface',
                )}
              >
                {color}
              </button>
            ))}
            {colorLabels.filter((c) => !PRESET_COLORS.includes(c)).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => toggleColor(color)}
                className="rounded-full px-3 py-1 text-xs font-medium border bg-primary text-white border-primary"
              >
                {color} ×
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomColor();
                }
              }}
              placeholder="직접 입력 후 Enter"
              className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={addCustomColor}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:border-primary/40"
            >
              추가
            </button>
          </div>
        </div>

        {/* 대표 (메뉴판) 등록 */}
        <label className="flex items-center gap-3 rounded-xl border border-border bg-surface-alt px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="h-4 w-4"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-text">메뉴판에 등록 (대표 사진)</p>
            <p className="text-xs text-text-muted">고객 사전상담 갤러리에 노출돼요</p>
          </div>
        </label>

        {error && <p className="text-sm text-error">{error}</p>}
      </div>

      <div className="flex gap-3 border-t border-border p-4">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={saving}>
          취소
        </Button>
        <Button variant="primary" className="flex-1" onClick={handleSave} loading={saving} disabled={saving}>
          저장
        </Button>
      </div>
    </Modal>
  );
}
