'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IngresoComisionRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/ingreso');
  }, [router]);
  return null;
}
