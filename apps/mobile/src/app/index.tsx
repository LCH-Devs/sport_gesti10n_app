import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function HomeScreen() {
  const { session } = useAuth();
  return <Redirect href={(session ? '/(tabs)' : '/login') as never} />;
}
