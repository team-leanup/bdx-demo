'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Step3Redirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/consultation/canvas'); }, [router]);
  return null;
}
