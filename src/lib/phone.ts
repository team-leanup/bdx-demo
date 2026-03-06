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
