import type { ConsultationType } from '@/types/consultation';

interface TimeBreakdown {
  base: number;
  off: number;
  extension: number;
  design: number;
  expression: number;
  parts: number;
  total: number;
}

/**
 * 상담 내용을 기반으로 예상 시술 시간을 계산합니다 (단위: 분)
 */
export function estimateTime(
  consultation: ConsultationType,
  customerDurationPreference?: 'short' | 'normal' | 'long',
): number {
  return calculateTimeBreakdown(consultation, customerDurationPreference).total;
}

export function calculateTimeBreakdown(
  consultation: ConsultationType,
  customerDurationPreference?: 'short' | 'normal' | 'long',
): TimeBreakdown {
  // 기본 시간 (핸드: 60분, 페디큐어: 90분)
  const base = consultation.bodyPart === 'hand' ? 60 : 90;

  // 오프 추가 시간
  let off = 0;
  if (consultation.offType === 'same_shop') off = 10;
  else if (consultation.offType === 'other_shop') off = 20;

  // 연장/리페어 추가 시간
  let extension = 0;
  if (consultation.extensionType === 'repair') {
    const count = consultation.repairCount ?? 1;
    extension = count * 5;
  } else if (consultation.extensionType === 'extension') {
    extension = 30;
  }

  // 디자인 범위 추가 시간
  const designTimeMap: Record<string, number> = {
    solid_tone: 0,
    solid_point: 20,
    full_art: 40,
    monthly_art: 35,
  };
  const design = designTimeMap[consultation.designScope] ?? 0;

  // 표현 기법 추가 시간
  let expression = 0;
  for (const expr of consultation.expressions) {
    if (expr === 'gradient') expression += 10;
    else if (expr === 'french') expression += 10;
    else if (expr === 'magnetic') expression += 5;
  }

  // 파츠 추가 시간
  let parts = 0;
  if (consultation.hasParts && consultation.partsSelections.length > 0) {
    const totalParts = consultation.partsSelections.reduce(
      (sum, sel) => sum + sel.quantity,
      0,
    );
    // 파츠 2개당 5분 추가
    parts = Math.ceil(totalParts / 2) * 5;
  }

  const subtotal = base + off + extension + design + expression + parts;

  // 고객 소요 시간 선호 보정
  const preference = customerDurationPreference;
  let total: number;
  if (preference === 'short') {
    total = Math.round(subtotal * 0.9);
  } else if (preference === 'long') {
    total = subtotal + 20;
  } else {
    total = subtotal;
  }

  return { base, off, extension, design, expression, parts, total };
}

/**
 * HH:mm 시간 문자열에 분을 더해 새로운 HH:mm 문자열을 반환합니다.
 * 자정(24:00) 초과 시 "23:59"로 clamp.
 */
export function addMinutesToTime(time: string, minutes: number): string | null {
  if (!time || !time.includes(':')) return null;
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  const total = h * 60 + m + minutes;
  if (total >= 24 * 60) return '23:59';
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

/**
 * 두 HH:mm 시간 문자열 사이의 분 차이를 반환합니다. (timeB - timeA)
 */
export function calcGapMinutes(timeA: string, timeB: string): number {
  const [ah, am] = timeA.split(':').map(Number);
  const [bh, bm] = timeB.split(':').map(Number);
  return (bh * 60 + bm) - (ah * 60 + am);
}

/**
 * 분을 시:분 형식의 문자열로 변환
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}분`;
  if (mins === 0) return `${hours}시간`;
  return `${hours}시간 ${mins}분`;
}
