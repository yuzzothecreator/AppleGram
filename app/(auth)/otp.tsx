import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const LENGTH = 6;

export default function Otp() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const verifyOtp = useAuthStore((s) => s.verifyOtp);

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(TextInput | null)[]>([]);

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[i] = clean;
    setDigits(nextDigits);
    if (clean && i < LENGTH - 1) inputs.current[i + 1]?.focus();
    if (nextDigits.every((d) => d)) submit(nextDigits.join(''));
  };

  const submit = async (code: string) => {
    setError(null);
    setLoading(true);
    try {
      await verifyOtp(String(phone ?? ''), code);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message ?? 'Verification failed.');
      setDigits(Array(LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
      <Pressable onPress={() => router.back()} style={{ padding: 16 }}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>

      <View style={{ paddingHorizontal: spacing.xl }}>
        <Text style={[styles.title, { color: colors.text }]}>Enter the code</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          We sent a 6-digit code to {phone}. (Demo code: 123456)
        </Text>

        <View style={styles.boxes}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              value={d}
              onChangeText={(v) => setDigit(i, v)}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !digits[i] && i > 0) {
                  inputs.current[i - 1]?.focus();
                }
              }}
              keyboardType="number-pad"
              maxLength={1}
              autoFocus={i === 0}
              style={[
                styles.box,
                { color: colors.text, backgroundColor: colors.surface, borderRadius: radius.md, borderColor: d ? colors.primary : colors.border },
              ]}
            />
          ))}
        </View>

        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />}
        {error && <Text style={{ color: colors.danger, marginTop: 16 }}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '800' },
  subtitle: { fontSize: 14, marginTop: 8, lineHeight: 20 },
  boxes: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  box: { width: 48, height: 58, borderWidth: 1.5, textAlign: 'center', fontSize: 24, fontWeight: '700' },
});
