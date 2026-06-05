import { ImageResponse } from 'next/og';
import { fetchShopPublicData, getShopLogoPublicUrl } from '@/lib/db';

// 카톡/SNS 공유 썸네일. Next.js 규약 파일 — 자동으로 og:image / twitter:image 메타에 주입된다.
// 손님이 링크를 받았을 때 "낯선 URL"이 아닌 샵 로고가 큰 가로 카드로 보이게 해 신뢰감을 준다.
export const runtime = 'nodejs';
export const alt = '네일 사전상담 — BDX';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const TAGLINE = '방문 전 원하시는 디자인을 미리 골라보세요';

// satori는 variable/woff2(Pretendard) 폰트를 못 쓰므로, 카드에 들어갈 글자만
// Google Fonts(Noto Sans KR)에서 subset으로 받아 한글을 렌더한다. 실패하면 폰트 없이(폴백) 진행.
async function loadGoogleFont(weight: 400 | 700, text: string): Promise<ArrayBuffer | null> {
  try {
    const url = `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@${weight}&text=${encodeURIComponent(text)}`;
    const cssRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/src:\s*url\(([^)]+)\)\s*format\(['"]?(?:opentype|truetype|woff2?)['"]?\)/);
    if (!match) return null;
    const fontRes = await fetch(match[1]);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}): Promise<ImageResponse> {
  const { shopId } = await params;
  const shopData = await fetchShopPublicData(shopId).catch(() => null);
  const shopName = shopData?.name?.trim() || 'BDX';

  // 로고 로드 — PNG/JPG만 data URI로 삽입. SVG·실패·미설정이면 이니셜 폴백.
  let logoSrc: string | null = null;
  if (shopData?.logoUrl) {
    try {
      const res = await fetch(getShopLogoPublicUrl(shopData.logoUrl));
      const ct = res.headers.get('content-type') ?? '';
      if (res.ok && ct.startsWith('image/') && !ct.includes('svg')) {
        const buf = await res.arrayBuffer();
        logoSrc = `data:${ct};base64,${Buffer.from(buf).toString('base64')}`;
      }
    } catch {
      logoSrc = null;
    }
  }

  const text = `${shopName}${TAGLINE}BDX`;
  const [regular, bold] = await Promise.all([loadGoogleFont(400, text), loadGoogleFont(700, text)]);
  const fonts = [
    regular ? { name: 'Noto Sans KR', data: regular, weight: 400 as const, style: 'normal' as const } : null,
    bold ? { name: 'Noto Sans KR', data: bold, weight: 700 as const, style: 'normal' as const } : null,
  ].filter((f): f is NonNullable<typeof f> => f !== null);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          fontFamily: '"Noto Sans KR"',
          position: 'relative',
        }}
      >
        {/* 상단 accent 바 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 14,
            backgroundColor: '#F472B6',
            display: 'flex',
          }}
        />

        {/* 로고 — 핑크 원/테두리 없이 비율 유지로 크게. 로고 없으면 이니셜 폴백 */}
        {logoSrc ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={logoSrc}
            width={860}
            height={400}
            style={{ objectFit: 'contain', marginTop: 28, marginBottom: 32 }}
            alt=""
          />
        ) : (
          <div
            style={{
              display: 'flex',
              width: 240,
              height: 240,
              borderRadius: 120,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#FDF2F8',
              marginBottom: 40,
              fontSize: 130,
              fontWeight: 700,
              color: '#F472B6',
            }}
          >
            {shopName.slice(0, 1)}
          </div>
        )}

        {/* 샵 이름 */}
        <div
          style={{
            display: 'flex',
            maxWidth: 1000,
            fontSize: 54,
            fontWeight: 700,
            color: '#171717',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          {shopName}
        </div>

        {/* 안내 문구 */}
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 400, color: '#6b7280' }}>{TAGLINE}</div>

        {/* 브랜드 워드마크 — flow 배치(absolute 겹침 방지) */}
        <div
          style={{
            display: 'flex',
            marginTop: 18,
            fontSize: 22,
            fontWeight: 700,
            color: '#F472B6',
            letterSpacing: 3,
          }}
        >
          BDX
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
      ...(fonts.length > 0 ? { fonts } : {}),
    },
  );
}
