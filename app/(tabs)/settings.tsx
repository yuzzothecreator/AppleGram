import { Avatar } from '@/components/Avatar';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Settings() {
  const { colors, spacing, radius, theme, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; tint?: string; onPress?: () => void }[] = [
    { icon: 'person-circle', label: 'Edit profile', onPress: () => user && router.push(`/profile/${user.id}`) },
    { icon: 'notifications', label: 'Notifications' },
    { icon: 'lock-closed', label: 'Privacy & Security' },
    { icon: 'cloud-done', label: 'Data & Storage' },
    { icon: 'sparkles', label: 'AI preferences' },
    { icon: 'card', label: 'Payments & Subscriptions' },
    { icon: 'help-circle', label: 'Help' },
  ];

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40 }}
    >
      <Text style={[styles.screenTitle, { color: colors.text, paddingHorizontal: spacing.lg }]}>Settings</Text>

      {user && (
        <Pressable
          onPress={() => router.push(`/profile/${user.id}`)}
          style={[styles.profile, { backgroundColor: colors.surface, marginHorizontal: spacing.lg, borderRadius: radius.lg }]}
        >
          <Avatar id={user.id} name={user.displayName} uri={user.avatarUrl} size={60} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: colors.text }]}>{user.displayName}</Text>
            <Text style={[styles.handle, { color: colors.textMuted }]}>
              @{user.username} · {user.phone ?? user.email}
            </Text>
          </View>
          {user.isPremium && <Ionicons name="star" size={20} color={colors.warning} />}
        </Pressable>
      )}

      <View style={[styles.group, { backgroundColor: colors.surface, marginHorizontal: spacing.lg, borderRadius: radius.lg }]}>
        <View style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: colors.primaryMuted }]}>
            <Ionicons name="moon" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Dark mode</Text>
          <Switch value={theme === 'dark'} onValueChange={toggle} />
        </View>
      </View>

      <View style={[styles.group, { backgroundColor: colors.surface, marginHorizontal: spacing.lg, borderRadius: radius.lg }]}>
        {rows.map((r, i) => (
          <Pressable
            key={r.label}
            onPress={r.onPress}
            style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.primaryMuted }]}>
              <Ionicons name={r.icon} size={18} color={colors.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{r.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={signOut}
        style={[styles.signOut, { marginHorizontal: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface }]}
      >
        <Ionicons name="log-out" size={20} color={colors.danger} />
        <Text style={{ color: colors.danger, fontWeight: '700', fontSize: 16 }}>Sign out</Text>
      </Pressable>

      <Text style={[styles.version, { color: colors.textMuted }]}>Teleprompt v0.1.0 (MVP)</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenTitle: { fontSize: 26, fontWeight: '800', marginBottom: 16 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 16 },
  name: { fontSize: 18, fontWeight: '700' },
  handle: { fontSize: 13, marginTop: 2 },
  group: { marginBottom: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 13 },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 16 },
  signOut: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, marginTop: 4 },
  version: { textAlign: 'center', marginTop: 20, fontSize: 12 },
});
