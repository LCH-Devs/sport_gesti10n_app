import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const { session, restoring } = useAuth();
  if (restoring) return null;
  if (session?.must_change_password) return <Redirect href={'/cambiar-clave' as never} />;
  return <Redirect href={(session ? '/(tabs)' : '/login') as never} />;
}
