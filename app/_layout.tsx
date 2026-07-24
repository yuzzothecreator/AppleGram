import { useAuthStore } from '@/store/authStore';
import { ThemeProvider, useTheme } from '@/theme/ThemeContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Routes the user to the correct stack based on auth + onboarding state.
 * - Not onboarded         -> /onboarding
 * - Onboarded, signed out -> /(auth)/login
 * - Signed in             -> /(tabs)
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, initializing, onboardingDone, init } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (initializing) return;

    const group = segments[0];
    const inAuth = group === '(auth)';
    const inOnboarding = group === 'onboarding';

    if (!onboardingDone) {
      if (!inOnboarding) router.replace('/onboarding');
      return;
    }
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
      return;
    }
    if (user && (inAuth || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [user, initializing, onboardingDone, segments, router]);

  if (initializing) {
    return <SplashLoader />;
  }
  return <>{children}</>;
}

function SplashLoader() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function RootNavigator() {
  const { theme, colors } = useTheme();
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <AuthGate>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="compose" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="profile/[id]" options={{ presentation: 'modal' }} />
        </Stack>
      </AuthGate>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootNavigator />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
