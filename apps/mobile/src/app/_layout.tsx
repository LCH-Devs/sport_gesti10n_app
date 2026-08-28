import { Redirect, Stack, usePathname } from "expo-router";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";

function AuthGate() {
  const { session } = useAuth();
  const pathname = usePathname();
  const isLoginRoute = pathname === '/login';

  if (!session && !isLoginRoute) {
    return <Redirect href="/login" />;
  }

  if (session && isLoginRoute) {
    return <Redirect href="/(tabs)" />;
  }

  return null;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthGate />
        <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      </AuthProvider>
    </LanguageProvider>
  );
}
