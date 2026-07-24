import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Mode = 'phone' | 'email';

export default function Login() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { requestOtp, signInWithEmail } = useAuthStore();

  const [mode, setMode] = useState<Mode>('phone');
  const [phone, setPhone] = useState('+255 700 000 000');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      if (mode === 'phone') {
        await requestOtp(phone);
        router.push({ pathname: '/(auth)/otp', params: { phone } });
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 40 }]}
    >
      <View style={styles.header}>
        <View style={[styles.logo, { backgroundColor: colors.primary }]}>
          <Ionicons name="paper-plane" size={30} color={colors.onPrimary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Welcome to Teleprompt</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Sign in to continue. Demo OTP code is 123456.
        </Text>
      </View>

      <View style={[styles.tabs, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
        {(['phone', 'email'] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[
              styles.tab,
              { borderRadius: radius.sm },
              mode === m && { backgroundColor: colors.primary },
            ]}
          >
            <Text style={{ color: mode === m ? colors.onPrimary : colors.textSecondary, fontWeight: '700', textTransform: 'capitalize' }}>
              {m}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={{ paddingHorizontal: spacing.xl, gap: spacing.md, marginTop: spacing.xl }}>
        {mode === 'phone' ? (
          <Field icon="call" value={phone} onChange={setPhone} placeholder="Phone number" keyboardType="phone-pad" />
        ) : (
          <>
            <Field icon="mail" value={email} onChange={setEmail} placeholder="Email" keyboardType="email-address" />
            <Field icon="lock-closed" value={password} onChange={setPassword} placeholder="Password" secure />
          </>
        )}

        {error && <Text style={{ color: colors.danger }}>{error}</Text>}

        <Pressable
          onPress={submit}
          disabled={loading}
          style={[styles.cta, { backgroundColor: colors.primary, borderRadius: radius.md, opacity: loading ? 0.7 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.ctaText, { color: colors.onPrimary }]}>
              {mode === 'phone' ? 'Send code' : 'Sign in'}
            </Text>
          )}
        </Pressable>

        <Text style={[styles.terms, { color: colors.textMuted }]}>
          By continuing you agree to our Terms and Privacy Policy.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  icon,
  value,
  onChange,
  placeholder,
  keyboardType,
  secure,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  keyboardType?: 'phone-pad' | 'email-address';
  secure?: boolean;
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.field, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize="none"
        style={[styles.input, { color: colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: 'center', paddingHorizontal: 32, marginBottom: 32 },
  logo: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 8 },
  tabs: { flexDirection: 'row', marginHorizontal: 24, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, height: 52 },
  input: { flex: 1, fontSize: 16 },
  cta: { height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ctaText: { fontSize: 17, fontWeight: '700' },
  terms: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
