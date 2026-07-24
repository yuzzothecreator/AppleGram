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

/** Telegram iOS chat row */
export function ChatListItem({ chat, onPress }: { chat: Chat; onPress: () => void }) {
  const { colors, spacing } = useTheme();
  const peer = chat.peerId ? getUser(chat.peerId) : undefined;
  const typeIcon = TYPE_ICON[chat.type];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: colors.surface },
        pressed && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <Avatar id={chat.id} name={chat.title} uri={chat.avatarUrl} online={peer?.isOnline} size={54} />

      <View style={[styles.center, { marginLeft: spacing.md, borderBottomColor: colors.separator }]}>
        <View style={styles.titleRow}>
          <View style={styles.nameRow}>
            {typeIcon ? (
              <Ionicons name={typeIcon} size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
            ) : null}
            <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              {chat.title}
            </Text>
          </View>
          <Text
            style={[
              styles.time,
              { color: chat.unreadCount > 0 ? colors.primary : colors.textMuted },
            ]}
          >
            {formatTime(chat.lastMessage?.createdAt)}
          </Text>
        </View>

        <View style={styles.previewRow}>
          <Text numberOfLines={1} style={[styles.preview, { color: colors.textMuted }]}>
            {chat.lastMessage?.text ?? 'No messages yet'}
          </Text>
          <View style={styles.badges}>
            {chat.muted ? <Ionicons name="volume-mute" size={14} color={colors.textMuted} /> : null}
            {chat.pinned ? <Ionicons name="pin" size={14} color={colors.textMuted} /> : null}
            {chat.unreadCount > 0 ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: chat.muted ? colors.textMuted : colors.primary },
                ]}
              >
                <Text style={styles.badgeText}>{chat.unreadCount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  center: {
    flex: 1,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: { fontSize: 17, fontWeight: '600', flexShrink: 1 },
  time: { fontSize: 14 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  preview: { fontSize: 15, flex: 1 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
