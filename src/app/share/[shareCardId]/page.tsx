import { notFound } from 'next/navigation';
import { fetchShareCardPublicData } from '@/lib/db';
import { ShareCardClient } from './ShareCardClient';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ shareCardId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { shareCardId } = await params;
  const data = await fetchShareCardPublicData(shareCardId);

  if (!data) {
    return { title: 'Not Found' };
  }

  return {
    title: `${data.shopName}의 네일 디자인`,
    description: `${data.shopName}에서 진행한 네일 디자인을 확인해보세요`,
    openGraph: {
      title: `${data.shopName}의 네일 디자인`,
      description: `${data.shopName}에서 진행한 네일 디자인을 확인해보세요`,
      images: data.imageUrls.length > 0 ? [data.imageUrls[0]] : [],
    },
  };
}

export default async function ShareCardPage({ params }: Props): Promise<React.ReactElement> {
  const { shareCardId } = await params;
  const data = await fetchShareCardPublicData(shareCardId);

  if (!data) {
    notFound();
  }

  return <ShareCardClient data={data} shareCardId={shareCardId} />;
}
