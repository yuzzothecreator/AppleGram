import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'chatbubbles' as const,
    title: 'Fast, secure messaging',
    body: 'One-to-one chats, groups and broadcast channels with delivery and read receipts.',
  },
  {
    icon: 'sparkles' as const,
    title: 'Built-in AI assistant',
    body: 'Smart replies, instant summaries and voice-to-text — right inside your chats.',
  },
  {
    icon: 'lock-closed' as const,
    title: 'Private by design',
    body: 'Secret chats with self-destruct timers and end-to-end encryption.',
  },
  {
    icon: 'storefront' as const,
    title: 'Sell & earn',
    body: 'Marketplace, channel subscriptions and payments — monetize your community.',
  },
];

export default function Onboarding() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const next = async () => {
    if (index < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: width * (index + 1), animated: true });
    } else {
      await completeOnboarding();
      router.replace('/(auth)/login');
    }
  };

  const skip = async () => {
    await completeOnboarding();
    router.replace('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Pressable onPress={skip} style={styles.skip}>
        <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Skip</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((s) => (
          <View key={s.title} style={[styles.slide, { width }]}>
            <View style={[styles.icon, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name={s.icon} size={64} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{s.title}</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === index ? colors.primary : colors.border,
                width: i === index ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + spacing.lg }}>
        <Pressable
          onPress={next}
          style={[styles.cta, { backgroundColor: colors.primary, borderRadius: radius.md }]}
        >
          <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
            {index === SLIDES.length - 1 ? 'Get started' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skip: { alignSelf: 'flex-end', padding: 16 },
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, flex: 1 },
  icon: { width: 150, height: 150, borderRadius: 75, alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 14 },
  body: { fontSize: 16, lineHeight: 23, textAlign: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 24 },
  dot: { height: 8, borderRadius: 4 },
  cta: { height: 54, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 17, fontWeight: '700' },
});
