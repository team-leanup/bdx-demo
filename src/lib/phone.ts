export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D+/g, '');

  let result = digits;

  if (result.startsWith('0082')) {
    result = result.slice(4);
  } else if (result.startsWith('82')) {
    result = result.slice(2);
  }

  if (result.length === 10 && result.startsWith('10')) {
    result = '0' + result;
  }

  return result;
}

/**
 * 입력 중인 전화번호를 실시간 하이픈 포맷으로 변환.
 * - 사장님이 예약 카드/고객 카드에서 가독성 좋게 볼 수 있도록
 * - 저장 시에는 normalizePhone 으로 하이픈 제거 후 저장 권장
 *
 * 예:
 *  "01012345678"     → "010-1234-5678"
 *  "0212345678"      → "02-1234-5678"
 *  "0311234567"      → "031-123-4567"
 *  "01012"           → "010-12"
 *  "0101234"         → "010-1234"
 *  "010123456789"    → "010-1234-5678" (뒷자리 절단)
 */
export function formatPhoneInput(value: string): string {
  // 한글/영문/특수기호 등 숫자 외 모두 제거, 최대 11자리
  const digits = value.replace(/\D+/g, '').slice(0, 11);
  if (!digits) return '';

  // 02 (서울) — 2자리 지역번호
  if (digits.startsWith('02')) {
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    if (digits.length <= 9) return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }

  // 010/011/... 휴대폰 + 031/032/... 지역번호 — 3자리
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  // 11자리 (010-1234-5678) 또는 10자리 (010-123-4567, 031-123-4567)
  if (digits.length <= 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}
