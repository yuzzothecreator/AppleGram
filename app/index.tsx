import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

/**
 * Splash screen. The AuthGate in the root layout redirects away from "/"
 * once it knows the auth + onboarding state, so this is only briefly visible.
 */
export default function Splash() {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View entering={FadeIn.duration(400)} style={styles.center}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Ionicons name="paper-plane" size={40} color={colors.onPrimary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Teleprompt</Text>
        <Text style={[styles.tag, { color: colors.textMuted }]}>Messaging, reimagined.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center' },
  logo: { width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: 0.5 },
  tag: { fontSize: 15, marginTop: 6 },
});
