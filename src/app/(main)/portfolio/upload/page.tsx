'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import { UploadPhotoForm } from '@/components/portfolio/UploadPhotoForm';

export default function PortfolioUploadPage(): React.ReactElement {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 pb-24 md:gap-6 md:px-6 md:pb-8">
      <div className="flex items-center gap-3 px-4 pt-4">
        <button
          type="button"
          onClick={() => router.push('/portfolio')}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-surface-alt text-text-secondary"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div>
          <h1 className="text-lg font-bold text-text">사진 업로드</h1>
          <p className="text-sm text-text-muted">포트폴리오에 사용할 사진을 등록하세요.</p>
        </div>
      </div>

      <Card className="mx-0 rounded-none border-0 p-0 shadow-none md:mx-4 md:w-full md:max-w-3xl md:self-center md:rounded-[28px] md:border md:border-border md:shadow-md">
        <UploadPhotoForm
          onCancel={() => router.push('/portfolio')}
          onSuccess={() => router.push('/portfolio')}
        />
      </Card>
    </div>
  );
}
