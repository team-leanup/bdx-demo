/**
 * 사전상담 링크를 복사할 때 URL과 함께 클립보드에 담는 안내 문구.
 * 손님이 카톡/문자로 링크를 처음 받았을 때 "낯선 링크"가 아닌 우리 샵의 사전상담임을
 * 한눈에 알 수 있게 한다. (사장님 → 손님 공유용이라 한국어 고정)
 */
export function buildPreConsultShareMessage(url: string, shopName?: string | null): string {
  const title = shopName ? `${shopName} 네일 사전상담 💅` : '네일 사전상담 💅';
  return `${title}\n방문 전 원하시는 디자인을 미리 골라보세요!\n${url}`;
}
