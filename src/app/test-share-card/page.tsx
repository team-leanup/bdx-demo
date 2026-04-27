'use client';

import { useRef } from 'react';
import { ShareCardImageTemplate } from '@/components/share-card/ShareCardImageTemplate';
import type { ConsultationType } from '@/types/consultation';

// 0423 공유카드 레이아웃 시각 검증용 임시 페이지
export default function TestShareCardPage(): React.ReactElement {
  const ref916 = useRef<HTMLDivElement | null>(null);
  const ref34 = useRef<HTMLDivElement | null>(null);

  // ShareCardImageTemplate가 실제로 참조하는 필드만 최소한으로 채움
  const sampleConsultation = {
    bodyPart: 'hand',
    designScope: 'full_art',
    nailShape: 'round',
    currentStep: 'summary',
  } as unknown as ConsultationType;

  const sampleImage =
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1080&auto=format';

  return (
    <div className="min-h-dvh bg-surface-alt p-8 flex flex-col gap-10 items-center">
      <h1 className="text-2xl font-bold">공유카드 레이아웃 검증 (0423)</h1>

      <section id="card-916" className="flex flex-col gap-3 items-center">
        <h2 className="text-lg font-semibold">9:16 — Story / Reels</h2>
        <div style={{ width: 1080 * 0.5, height: 1920 * 0.5, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.14)' }}>
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

      <section id="card-34" className="flex flex-col gap-3 items-center">
        <h2 className="text-lg font-semibold">3:4 — Feed</h2>
        <div style={{ width: 1080 * 0.5, height: 1440 * 0.5, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.14)' }}>
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
