'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function IngresoSocioRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/miembro/acceso');
  }, [router]);
  return null;
}
