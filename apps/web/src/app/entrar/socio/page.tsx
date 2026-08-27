'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EntrarSocioRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/entrar');
  }, [router]);
  return null;
}
