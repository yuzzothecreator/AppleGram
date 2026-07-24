import { Avatar } from '@/components/Avatar';
import { getUser } from '@/services/chatService';
import { useTheme } from '@/theme/ThemeContext';
import { Chat } from '@/types';
import { formatTime } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const TYPE_ICON: Partial<Record<Chat['type'], keyof typeof Ionicons.glyphMap>> = {
  group: 'people',
  channel: 'megaphone',
  secret: 'lock-closed',
  ai: 'sparkles',
  bot: 'hardware-chip',
};

export function ChatListItem({ chat, onPress }: { chat: Chat; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  const peer = chat.peerId ? getUser(chat.peerId) : undefined;
  const typeIcon = TYPE_ICON[chat.type];

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.separator }}
      style={({ pressed }) => [
        styles.row,
        { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
        pressed && { backgroundColor: colors.surface },
      ]}
    >
      <Avatar id={chat.id} name={chat.title} uri={chat.avatarUrl} online={peer?.isOnline} />

      <View style={[styles.center, { marginHorizontal: spacing.md }]}>
        <View style={styles.titleRow}>
          {typeIcon && (
            <Ionicons name={typeIcon} size={15} color={colors.textMuted} style={{ marginRight: 4 }} />
          )}
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {chat.title}
          </Text>
        </View>
        <Text numberOfLines={1} style={[styles.preview, { color: colors.textMuted }]}>
          {chat.lastMessage?.text ?? 'Tap to start chatting'}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.time, { color: colors.textMuted }]}>
          {formatTime(chat.lastMessage?.createdAt)}
        </Text>
        <View style={styles.badges}>
          {chat.pinned && <Ionicons name="pin" size={14} color={colors.textMuted} />}
          {chat.muted && <Ionicons name="notifications-off" size={14} color={colors.textMuted} />}
          {chat.unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{chat.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  preview: { fontSize: 14, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  time: { fontSize: 12 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
