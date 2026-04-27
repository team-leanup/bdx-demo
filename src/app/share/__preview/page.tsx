'use client';

import { useRef } from 'react';
import { ShareCardImageTemplate } from '@/components/share-card/ShareCardImageTemplate';
import type { ConsultationType } from '@/types/consultation';

// 0423 공유카드 레이아웃 시각 검증용 임시 페이지 (public route)
export default function SharePreviewPage(): React.ReactElement {
  const ref916 = useRef<HTMLDivElement | null>(null);
  const ref34 = useRef<HTMLDivElement | null>(null);

  const sampleConsultation = {
    bodyPart: 'hand',
    designScope: 'full_art',
    nailShape: 'round',
    currentStep: 'summary',
  } as unknown as ConsultationType;

  const sampleImage =
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1080&auto=format';

  return (
    <div style={{ minHeight: '100vh', background: '#EFEAE3', padding: 32, display: 'flex', flexDirection: 'column', gap: 40, alignItems: 'center' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>공유카드 레이아웃 검증 (0423)</h1>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>9:16 — Story / Reels</h2>
        <div style={{ width: 540, height: 960, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.14)' }}>
          <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
            <ShareCardImageTemplate
              imageUrl={sampleImage}
              consultation={sampleConsultation}
              shopName="BDX Demo Nail"
              ratio="9:16"
              templateRef={ref916}
              shopId="shop-demo"
              createdAt={new Date().toISOString()}
              estimatedMinutes={80}
            />
          </div>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>3:4 — Feed</h2>
        <div style={{ width: 540, height: 720, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.14)' }}>
          <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
            <ShareCardImageTemplate
              imageUrl={sampleImage}
              consultation={sampleConsultation}
              shopName="BDX Demo Nail"
              ratio="3:4"
              templateRef={ref34}
              shopId="shop-demo"
              createdAt={new Date().toISOString()}
              estimatedMinutes={80}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
