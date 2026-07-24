import { updateMyProfile } from '@/services/chatService';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeContext';
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

export default function EditProfile() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateMyProfile({
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
      });
      setUser(updated);
      router.back();
    } catch (e: any) {
      setError(e.message ?? 'Could not save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
    >
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ color: colors.primary, fontSize: 17 }}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <Pressable onPress={save} disabled={loading} hitSlop={8}>
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={{ color: colors.primary, fontSize: 17, fontWeight: '600' }}>Done</Text>
          )}
        </Pressable>
      </View>

      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <Field label="Name" value={displayName} onChange={setDisplayName} />
        <Field label="Username" value={username} onChange={setUsername} autoCapitalize="none" />
        <Field label="Bio" value={bio} onChange={setBio} multiline />
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChange,
  multiline,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences';
}) {
  const { colors, radius } = useTheme();
  return (
    <View style={[styles.field, { backgroundColor: colors.surface, borderRadius: radius.md }]}>
      <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        style={{ color: colors.text, fontSize: 17, minHeight: multiline ? 72 : undefined }}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: '600' },
  field: { paddingHorizontal: 14, paddingVertical: 10 },
});
