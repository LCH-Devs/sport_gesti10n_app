import { ActivityIndicator, View } from "react-native";
import { Redirect, Stack, usePathname } from "expo-router";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/context/AuthContext";
import { Brand } from "@/constants/theme";

function AuthGate() {
  const { session, restoring } = useAuth();
  const pathname = usePathname();
  const isLoginRoute = pathname === '/login';
  const isChangePasswordRoute = pathname === '/cambiar-clave';

  if (restoring) {
    return null;
  }

  if (!session && !isLoginRoute) {
    return <Redirect href="/login" />;
  }

  if (session?.must_change_password && !isChangePasswordRoute) {
    return <Redirect href={'/cambiar-clave' as never} />;
  }

  if (session && !session.must_change_password && (isLoginRoute || isChangePasswordRoute)) {
    return <Redirect href="/(tabs)" />;
  }

  return null;
}

function SplashGate({ children }: { children: React.ReactNode }) {
  const { restoring } = useAuth();
  if (restoring) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.surface }}>
        <ActivityIndicator color={Brand.primary} size="large" />
      </View>
    );
  }
  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <SplashGate>
          <AuthGate />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="cambiar-clave" options={{ headerShown: false }} />
          </Stack>
        </SplashGate>
      </AuthProvider>
    </LanguageProvider>
  );
}
