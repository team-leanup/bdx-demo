'use client';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DesignScope, ExpressionType } from '@/types/consultation';
import { getNowInKoreaIso } from '@/lib/format';

export interface CustomPartItem {
  id: string;
  name: string;
  pricePerUnit: number;
}

export interface ColorPreset {
  id: string;
  name: string;
  hexCode: string;
}

export interface DesignPreset {
  id: string;
  name: string;
  i18nKey?: string;
  description?: string;
  designScope: DesignScope;
  expressions: ExpressionType[];
  hasParts: boolean;
  defaultParts?: { partId: string; quantity: number }[];
  imageUrl?: string;
  createdAt: string;
}

interface PartsStore {
  customParts: CustomPartItem[];
  colorPresets: ColorPreset[];
  designPresets: DesignPreset[];

  addPart: (name: string, price: number) => void;
  removePart: (id: string) => void;
  updatePart: (id: string, updates: Partial<CustomPartItem>) => void;

  addColorPreset: (name: string, hex: string) => void;
  removeColorPreset: (id: string) => void;

  addDesignPreset: (preset: Omit<DesignPreset, 'id' | 'createdAt'>) => void;
  updateDesignPreset: (id: string, updates: Partial<DesignPreset>) => void;
  removeDesignPreset: (id: string) => void;
}

const DEFAULT_CUSTOM_PARTS: CustomPartItem[] = [
  { id: 'preset-cubic', name: '큐빅', pricePerUnit: 2000 },
  { id: 'preset-swarovski', name: '스와로브스키', pricePerUnit: 3000 },
  { id: 'preset-pearl', name: '진주', pricePerUnit: 2000 },
  { id: 'preset-glitter', name: '글리터', pricePerUnit: 2000 },
  { id: 'preset-shell', name: '쉘', pricePerUnit: 2000 },
  { id: 'preset-foil', name: '호일', pricePerUnit: 1500 },
  { id: 'preset-sticker', name: '스티커', pricePerUnit: 1000 },
  { id: 'preset-charm', name: '참', pricePerUnit: 2500 },
];

const DEFAULT_COLOR_PRESETS: ColorPreset[] = [
  { id: 'color-rose', name: '로즈핑크', hexCode: '#F9A8D4' },
  { id: 'color-nude', name: '누드베이지', hexCode: '#D4B896' },
  { id: 'color-baby-blue', name: '베이비블루', hexCode: '#93C5FD' },
  { id: 'color-red', name: '레드', hexCode: '#EF4444' },
  { id: 'color-black', name: '블랙', hexCode: '#1A1A2E' },
  { id: 'color-white', name: '화이트', hexCode: '#FFFFFF' },
  { id: 'color-french-white', name: '프렌치화이트', hexCode: '#FFF5EE' },
  { id: 'color-glitter-gold', name: '글리터골드', hexCode: '#FFD700' },
];

const DEFAULT_DESIGN_PRESETS: DesignPreset[] = [
  {
    id: 'dp-001',
    name: '심플 원컬러',
    i18nKey: 'preset.simpleSolid',
    description: '깔끔한 단색으로 완성하는 베이직 스타일',
    designScope: 'solid_tone',
    expressions: ['solid'],
    hasParts: false,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'dp-002',
    name: '글리터 포인트',
    i18nKey: 'preset.glitterPoint',
    description: '단색 베이스에 글리터 포인트 2개',
    designScope: 'solid_point',
    expressions: ['solid', 'gradient'],
    hasParts: true,
    defaultParts: [{ partId: 'preset-glitter', quantity: 2 }],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'dp-003',
    name: '풀 아트 세트',
    i18nKey: 'preset.fullArtSet',
    description: '그라데이션 + 프렌치 + 큐빅 3개 + 진주 2개',
    designScope: 'full_art',
    expressions: ['gradient', 'french'],
    hasParts: true,
    defaultParts: [
      { partId: 'preset-cubic', quantity: 3 },
      { partId: 'preset-pearl', quantity: 2 },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const usePartsStore = create<PartsStore>()(
  persist(
    (set) => ({
      customParts: DEFAULT_CUSTOM_PARTS,
      colorPresets: DEFAULT_COLOR_PRESETS,
      designPresets: DEFAULT_DESIGN_PRESETS,

      addPart: (name, price) =>
        set((state) => ({
          customParts: [
            ...state.customParts,
            { id: `part-${Date.now()}`, name: name.trim(), pricePerUnit: price },
          ],
        })),

      removePart: (id) =>
        set((state) => ({
          customParts: state.customParts.filter((p) => p.id !== id),
        })),

      updatePart: (id, updates) =>
        set((state) => ({
          customParts: state.customParts.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),

      addColorPreset: (name, hex) =>
        set((state) => ({
          colorPresets: [
            ...state.colorPresets,
            { id: `color-${Date.now()}`, name: name.trim(), hexCode: hex },
          ],
        })),

      removeColorPreset: (id) =>
        set((state) => ({
          colorPresets: state.colorPresets.filter((c) => c.id !== id),
        })),

      addDesignPreset: (preset) =>
        set((state) => ({
          designPresets: [
            ...state.designPresets,
            {
              ...preset,
              id: `dp-${Date.now()}`,
            createdAt: getNowInKoreaIso(),
            },
          ],
        })),

      updateDesignPreset: (id, updates) =>
        set((state) => ({
          designPresets: state.designPresets.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),

      removeDesignPreset: (id) =>
        set((state) => ({
          designPresets: state.designPresets.filter((p) => p.id !== id),
        })),
    }),
    {
      name: 'bdx-parts',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
);
