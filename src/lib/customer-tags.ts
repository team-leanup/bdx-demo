import type { CustomerTag, TagAccent, TagCategory } from '@/types/customer';

type TagColorInput = Pick<CustomerTag, 'accent' | 'category'>;

export const CUSTOMER_TAG_ACCENTS = ['rose', 'amber', 'emerald', 'sky', 'slate'] as const satisfies readonly TagAccent[];

export const DEFAULT_TAG_ACCENT_BY_CATEGORY: Record<TagCategory, TagAccent> = {
  design: 'rose',
  shape: 'slate',
  length: 'sky',
  expression: 'amber',
  parts: 'emerald',
  color: 'rose',
  communication: 'sky',
  etc: 'amber',
};

const TAG_ACCENT_STYLES: Record<TagAccent, { chip: string; dot: string }> = {
  rose: {
    chip: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-400',
  },
  amber: {
    chip: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-400',
  },
  emerald: {
    chip: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-400',
  },
  sky: {
    chip: 'bg-sky-100 text-sky-700 border-sky-200',
    dot: 'bg-sky-400',
  },
  slate: {
    chip: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  },
};

export function resolveCustomerTagAccent(tag: TagColorInput): TagAccent {
  return tag.accent ?? DEFAULT_TAG_ACCENT_BY_CATEGORY[tag.category] ?? 'slate';
}

export function getCustomerTagChipClasses(tag: TagColorInput): string {
  return TAG_ACCENT_STYLES[resolveCustomerTagAccent(tag)].chip;
}

export function getCustomerTagDotClasses(accent: TagAccent): string {
  return TAG_ACCENT_STYLES[accent].dot;
}
