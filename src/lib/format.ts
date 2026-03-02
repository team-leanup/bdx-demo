/**
 * 가격을 한국 원화 형식으로 포맷팅
 * @example formatPrice(85000) → "₩85,000"
 */
export function formatPrice(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

/**
 * 숫자를 원화 문자열로 포맷팅 (₩ 없이)
 * @example formatPriceNumber(85000) → "85,000"
 */
export function formatPriceNumber(amount: number): string {
  return amount.toLocaleString('ko-KR');
}

/**
 * ISO 날짜 문자열을 한국어 형식으로 포맷팅
 * @example formatDate("2026-02-20") → "2026년 2월 20일"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * ISO 날짜 문자열을 짧은 형식으로 포맷팅
 * @example formatDateShort("2026-02-20") → "2/20"
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
  });
}

/**
 * 날짜를 YYYY.MM.DD 형식으로 포맷팅
 * @example formatDateDot("2026-02-20") → "2026.02.20"
 */
export function formatDateDot(dateStr: string): string {
  if (dateStr && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [year, month, day] = dateStr.split('-');
    return `${year}.${month}.${day.slice(0, 2)}`;
  }
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 날짜를 YYYY.MM.DD (요일) 형식으로 포맷팅
 * @example formatDateDotWithDay("2026-02-20") → "2026.02.20 (금)"
 */
export function formatDateDotWithDay(dateStr: string): string {
  const d = new Date(dateStr);
  const DAY = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${DAY[d.getDay()]})`;
}

/**
 * 날짜를 YYYY.MM.DD HH:mm 형식으로 포맷팅
 * @example formatDateDotWithTime("2026-02-20T14:30:00") → "2026.02.20 14:30"
 */
export function formatDateDotWithTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * ISO 시간 문자열을 한국어 형식으로 포맷팅
 * @example formatTime("14:30") → "오후 2:30"
 */
export function formatTime(timeStr: string): string {
  if (!timeStr || !timeStr.includes(':')) return timeStr ?? '';
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (isNaN(hour) || isNaN(minute)) return timeStr;
  const period = hour < 12 ? '오전' : '오후';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${period} ${displayHour}:${String(minute).padStart(2, '0')}`;
}

/**
 * 전화번호를 한국 형식으로 포맷팅
 * @example formatPhone("01012345678") → "010-1234-5678"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * 분을 시간/분 형식으로 포맷팅
 * @example formatMinutes(90) → "1시간 30분"
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}시간`;
  }
  return `${hours}시간 ${mins}분`;
}

/**
 * 상대 시간 포맷팅 (방문일 표시)
 * @example formatRelativeDate("2026-02-20") → "6일 전"
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
}
