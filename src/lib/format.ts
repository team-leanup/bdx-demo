export const KOREA_TIME_ZONE = 'Asia/Seoul';

function isDateOnlyString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function createKoreanDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, second));
}

export function parseKoreanDateString(dateStr: string): Date {
  if (!isDateOnlyString(dateStr)) {
    return new Date(dateStr);
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  return createKoreanDate(year, month, day, 12);
}

function toKoreanDateValue(value: string | Date): Date {
  return typeof value === 'string' ? parseKoreanDateString(value) : value;
}

function getKoreanDateParts(value: string | Date): Record<string, string> {
  const date = toKoreanDateValue(value);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: KOREA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  return formatter.formatToParts(date).reduce<Record<string, string>>((parts, part) => {
    if (part.type !== 'literal') {
      parts[part.type] = part.value;
    }
    return parts;
  }, {});
}

export function toKoreanDateString(value: string | Date): string {
  const parts = getKoreanDateParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getTodayInKorea(): string {
  return toKoreanDateString(new Date());
}

export function formatNowInKorea(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: KOREA_TIME_ZONE,
    ...options,
  }).format(new Date());
}

export function getCurrentHourInKorea(): number {
  return Number(getKoreanDateParts(new Date()).hour);
}

export function getCurrentTimeInKorea(): { hour: number; minute: number } {
  const parts = getKoreanDateParts(new Date());
  return {
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function toKoreanTimeString(isoString: string): string {
  const parts = getKoreanDateParts(isoString);
  return `${parts.hour}:${parts.minute}`;
}

export function getNowInKoreaIso(): string {
  const parts = getKoreanDateParts(new Date());
  return createKoreanDate(
    Number(parts.year),
    Number(parts.month),
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  ).toISOString();
}

export function addDaysInKorea(dateStr: string, days: number): string {
  const date = parseKoreanDateString(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return toKoreanDateString(date);
}

export function getKoreanWeekStart(dateStr: string): string {
  const weekday = getKoreanDateWeekday(dateStr);
  const diff = weekday === 0 ? -6 : 1 - weekday;
  return addDaysInKorea(dateStr, diff);
}

function getKoreanDateWeekday(value: string | Date): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: KOREA_TIME_ZONE,
    weekday: 'short',
  }).format(toKoreanDateValue(value));

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return weekdayMap[weekday] ?? 0;
}

export function getRelativeDayDiffInKorea(dateStr: string): number {
  const today = parseKoreanDateString(getTodayInKorea());
  const date = parseKoreanDateString(toKoreanDateString(dateStr));
  const diffMs = today.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * 언어별 통화 환율 (KRW 기준, 근사값)
 */
const CURRENCY_CONFIG: Record<string, { symbol: string; rate: number; code: string; locale: string }> = {
  ko: { symbol: '₩', rate: 1, code: 'KRW', locale: 'ko-KR' },
  en: { symbol: '$', rate: 0.00072, code: 'USD', locale: 'en-US' },
  zh: { symbol: '¥', rate: 0.0052, code: 'CNY', locale: 'zh-CN' },
  ja: { symbol: '¥', rate: 0.11, code: 'JPY', locale: 'ja-JP' },
};

/**
 * 원화 금액을 해당 locale 통화로 변환하여 포맷팅
 * @example formatLocaleCurrency(85000, 'zh') → "¥442"
 */
export function formatLocaleCurrency(amountKRW: number, locale: string): string {
  const config = CURRENCY_CONFIG[locale] ?? CURRENCY_CONFIG.ko;
  if (locale === 'ko') {
    return `₩${amountKRW.toLocaleString('ko-KR')}`;
  }
  const converted = amountKRW * config.rate;
  // JPY는 소수점 없이, 나머지는 소수점 2자리 (단, 0이면 생략)
  const formatted = locale === 'ja'
    ? `${config.symbol}${Math.round(converted).toLocaleString(config.locale)}`
    : `${config.symbol}${converted.toLocaleString(config.locale, { minimumFractionDigits: converted % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;
  return formatted;
}

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
  const date = toKoreanDateValue(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KOREA_TIME_ZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * ISO 날짜 문자열을 짧은 형식으로 포맷팅
 * @example formatDateShort("2026-02-20") → "2/20"
 */
export function formatDateShort(dateStr: string): string {
  const date = toKoreanDateValue(dateStr);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KOREA_TIME_ZONE,
    month: 'numeric',
    day: 'numeric',
  }).format(date);
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
  return toKoreanDateString(dateStr).replace(/-/g, '.');
}

/**
 * 날짜를 YYYY.MM.DD (요일) 형식으로 포맷팅
 * @example formatDateDotWithDay("2026-02-20") → "2026.02.20 (금)"
 */
export function formatDateDotWithDay(dateStr: string): string {
  const d = parseKoreanDateString(toKoreanDateString(dateStr));
  const DAY = ['일', '월', '화', '수', '목', '금', '토'];
  const dateOnly = toKoreanDateString(dateStr);
  const [year, month, day] = dateOnly.split('-');
  return `${year}.${month}.${day} (${DAY[getKoreanDateWeekday(d)]})`;
}

/**
 * 날짜를 YYYY.MM.DD HH:mm 형식으로 포맷팅
 * @example formatDateDotWithTime("2026-02-20T14:30:00") → "2026.02.20 14:30"
 */
export function formatDateDotWithTime(dateStr: string): string {
  const parts = getKoreanDateParts(dateStr);
  return `${parts.year}.${parts.month}.${parts.day} ${parts.hour}:${parts.minute}`;
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
 * 날짜를 한국어 일간 스케줄 레이블로 포맷팅
 * @example formatDayLabelKo("2026-03-02") → "3월 2일 (월요일)"
 */
export function formatDayLabelKo(dateStr: string): string {
  const d = parseKoreanDateString(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const parts = getKoreanDateParts(d);
  const month = Number(parts.month);
  const day = Number(parts.day);
  const weekday = WEEKDAYS[getKoreanDateWeekday(d)];
  return `${month}월 ${day}일 (${weekday})`;
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
 * 분을 시간/분 형식으로 포맷팅 (locale-aware)
 * @example formatMinutes(90) → "1시간 30분"
 * @example formatMinutes(90, 'en') → "1h 30min"
 * @example formatMinutes(90, 'zh') → "1小时30分钟"
 * @example formatMinutes(90, 'ja') → "1時間30分"
 */
export function formatMinutes(minutes: number, locale?: string): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  switch (locale) {
    case 'en':
      return h > 0 ? (m > 0 ? `${h}h ${m}min` : `${h}h`) : `${m}min`;
    case 'zh':
      return h > 0 ? (m > 0 ? `${h}小时${m}分钟` : `${h}小时`) : `${m}分钟`;
    case 'ja':
      return h > 0 ? (m > 0 ? `${h}時間${m}分` : `${h}時間`) : `${m}分`;
    default: // ko
      return h > 0 ? (m > 0 ? `${h}시간 ${m}분` : `${h}시간`) : `${m}분`;
  }
}

/**
 * 상대 시간 포맷팅 (방문일 표시)
 * @example formatRelativeDate("2026-02-20") → "6일 전"
 */
export function formatRelativeDate(dateStr: string): string {
  const diffDays = getRelativeDayDiffInKorea(dateStr);

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}개월 전`;
  return `${Math.floor(diffDays / 365)}년 전`;
}
