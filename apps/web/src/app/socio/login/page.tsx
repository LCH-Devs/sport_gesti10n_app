'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SocioLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/entrar');
  }, [router]);
  return null;
}
