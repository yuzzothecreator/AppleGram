import { Avatar } from '@/components/Avatar';
import { getUser } from '@/services/chatService';
import { useTheme } from '@/theme/ThemeContext';
import { Chat } from '@/types';
import { formatTime } from '@/utils/format';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function ChatListItem({ chat, onPress }: { chat: Chat; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  const peer = chat.peerId ? getUser(chat.peerId) : undefined;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { paddingHorizontal: spacing.lg, paddingVertical: 10 },
        pressed && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <Avatar id={chat.id} name={chat.title} uri={chat.avatarUrl} online={peer?.isOnline} size={52} />

      <View style={[styles.center, { marginLeft: spacing.md }]}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {chat.title}
          </Text>
          <Text style={[styles.time, { color: colors.textMuted }]}>
            {formatTime(chat.lastMessage?.createdAt)}
          </Text>
        </View>
        <View style={styles.previewRow}>
          <Text numberOfLines={2} style={[styles.preview, { color: colors.textMuted }]}>
            {chat.lastMessage?.text ?? 'No messages yet'}
          </Text>
          {chat.unreadCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{chat.unreadCount}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  center: { flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 17, fontWeight: '600', flex: 1 },
  time: { fontSize: 15 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  preview: { fontSize: 15, flex: 1, lineHeight: 20 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
