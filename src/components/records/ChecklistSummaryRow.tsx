'use client';

import React from 'react';
import { TagIconSvg } from '@/components/ui/TagIconSvg';
import type { DailyChecklist, NailShape } from '@/types/consultation';

interface ChecklistSummaryRowProps {
  checklist?: DailyChecklist;
}

const SHAPE_LABELS: Record<NailShape, string> = {
  round: '라운드',
  oval: '오벌',
  square: '스퀘어',
  squoval: '스퀘오벌',
  almond: '아몬드',
  stiletto: '스틸레토',
  coffin: '코핀',
};

const LENGTH_LABELS: Record<'short' | 'medium' | 'long', string> = {
  short: '짧게',
  medium: '보통',
  long: '길게',
};

const THICKNESS_LABELS: Record<'thin' | 'medium' | 'thick', string> = {
  thin: '얇게',
  medium: '보통',
  thick: '도톰',
};

const CUTICLE_LABELS: Record<'low' | 'medium' | 'high', string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

interface Pill {
  icon: string;
  label: string;
}

function buildPills(checklist: DailyChecklist): Pill[] {
  const pills: Pill[] = [];

  if (checklist.shape !== null) {
    pills.push({ icon: '💅', label: SHAPE_LABELS[checklist.shape] });
  }
  if (checklist.length !== null) {
    pills.push({ icon: '📏', label: LENGTH_LABELS[checklist.length] });
  }
  if (checklist.thickness !== null) {
    pills.push({ icon: '🪵', label: THICKNESS_LABELS[checklist.thickness] });
  }
  if (checklist.cuticleSensitivity !== null) {
    pills.push({ icon: '🩹', label: `큐티클 ${CUTICLE_LABELS[checklist.cuticleSensitivity]}` });
  }

  return pills;
}

export function ChecklistSummaryRow({ checklist }: ChecklistSummaryRowProps): React.ReactElement {
  if (!checklist) {
    return (
      <span className="text-xs text-text-muted">기록 없음</span>
    );
  }

  const pills = buildPills(checklist);

  if (pills.length === 0) {
    return (
      <span className="text-xs text-text-muted">기록 없음</span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {pills.map((pill) => (
        <span
          key={pill.label}
          className="flex items-center gap-1 rounded-full bg-surface-alt px-2.5 py-1 text-xs text-text-secondary"
        >
          <TagIconSvg icon={pill.icon} className="w-3 h-3" />
          <span>{pill.label}</span>
        </span>
      ))}
    </div>
  );
}
