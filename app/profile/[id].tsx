import { Avatar } from '@/components/Avatar';
import { getUser } from '@/services/chatService';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from '@/theme/ThemeContext';
import { formatLastSeen } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const me = useAuthStore((s) => s.user);
  const user = id === me?.id ? me : getUser(String(id));

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.textMuted }}>User not found.</Text>
      </View>
    );
  }

  const actions: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
    { icon: 'chatbubble', label: 'Message' },
    { icon: 'call', label: 'Call' },
    { icon: 'videocam', label: 'Video' },
    { icon: 'notifications-off', label: 'Mute' },
  ];

  const details = [
    { icon: 'at' as const, label: 'Username', value: `@${user.username}` },
    ...(user.phone ? [{ icon: 'call' as const, label: 'Phone', value: user.phone }] : []),
    ...(user.email ? [{ icon: 'mail' as const, label: 'Email', value: user.email }] : []),
    ...(user.bio ? [{ icon: 'information-circle' as const, label: 'Bio', value: user.bio }] : []),
  ];

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 40 }}>
      <Pressable onPress={() => router.back()} style={[styles.close, { backgroundColor: colors.surface }]}>
        <Ionicons name="close" size={22} color={colors.text} />
      </Pressable>

      <View style={[styles.hero, { backgroundColor: colors.surface, paddingTop: 60 }]}>
        <Avatar id={user.id} name={user.displayName} uri={user.avatarUrl} size={96} online={user.isOnline} />
        <Text style={[styles.name, { color: colors.text }]}>{user.displayName}</Text>
        <Text style={[styles.status, { color: user.isOnline ? colors.online : colors.textMuted }]}>
          {user.isBot ? 'bot' : formatLastSeen(user)}
        </Text>

        <View style={styles.actions}>
          {actions.map((a) => (
            <Pressable key={a.label} style={styles.action}>
              <View style={[styles.actionIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name={a.icon} size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.primary }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.group, { backgroundColor: colors.surface, marginHorizontal: spacing.lg, borderRadius: radius.lg }]}>
        {details.map((d, i) => (
          <View key={d.label} style={[styles.detail, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator }]}>
            <Ionicons name={d.icon} size={20} color={colors.textMuted} />
            <View>
              <Text style={[styles.detailValue, { color: colors.text }]}>{d.value}</Text>
              <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{d.label}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  close: { position: 'absolute', top: 16, left: 16, zIndex: 10, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  hero: { alignItems: 'center', paddingBottom: 20 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 12 },
  status: { fontSize: 14, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 22, marginTop: 20 },
  action: { alignItems: 'center', gap: 6 },
  actionIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 13, fontWeight: '600' },
  group: { marginTop: 16, overflow: 'hidden' },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  detailValue: { fontSize: 16 },
  detailLabel: { fontSize: 12, marginTop: 2 },
});
