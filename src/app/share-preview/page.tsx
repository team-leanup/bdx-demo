'use client';

import { useState } from 'react';
import { ShareCardGeneratorModal } from '@/components/share-card/ShareCardGeneratorModal';
import type { ConsultationType } from '@/types/consultation';

// 0424: 실제 모달을 그대로 띄워 QA
export default function SharePreviewPage(): React.ReactElement {
  const [open, setOpen] = useState(true);

  const sampleConsultation = {
    bodyPart: 'hand',
    designScope: 'solid_tone',
    nailShape: 'round',
    currentStep: 'summary',
  } as unknown as ConsultationType;

  return (
    <div style={{ minHeight: '100dvh', background: '#111' }}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', top: 16, left: 16, padding: '8px 12px', background: '#fff', borderRadius: 8, fontSize: 12 }}
      >
        모달 열기
      </button>

      <ShareCardGeneratorModal
        isOpen={open}
        onClose={() => setOpen(false)}
        record={{
          id: 'test-record',
          shopId: 'shop-demo',
          consultation: sampleConsultation,
          shareCardId: 'test-share-id',
          createdAt: new Date().toISOString(),
          estimatedMinutes: 95,
        }}
        portfolioPhotos={[
          {
            id: 'photo-1',
            imageDataUrl:
              'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=1080&auto=format',
            imagePath: null,
          },
        ]}
        shopName="BDX Demo Nail"
      />
    </div>
  );
}
