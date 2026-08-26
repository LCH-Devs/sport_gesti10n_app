'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MiembroAccesoRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/ingreso');
  }, [router]);
  return null;
}
