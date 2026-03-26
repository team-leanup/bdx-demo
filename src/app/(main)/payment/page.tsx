'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
export default function PaymentRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/records'); }, [router]);
  return null;
}
