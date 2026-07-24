import { Avatar } from '@/components/Avatar';
import { ChatBubble } from '@/components/ChatBubble';
import { MessageInput } from '@/components/MessageInput';
import { getUser } from '@/services/chatService';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useTheme } from '@/theme/ThemeContext';
import { Message } from '@/types';
import { formatLastSeen } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Telegram iOS conversation screen */
export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = String(id);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<FlatList<Message>>(null);
  const me = useAuthStore((s) => s.user);

  const { activeChat, openChat, send, subscribe, messagesByChat, loadingMessages } = useChatStore();
  const messages = messagesByChat[chatId] ?? [];
  const loading = loadingMessages[chatId];

  useEffect(() => {
    openChat(chatId);
    const unsub = subscribe(chatId);
    return unsub;
  }, [chatId, openChat, subscribe]);

  const peer = activeChat?.peerId ? getUser(activeChat.peerId) : undefined;
  const subtitle =
    activeChat?.type === 'channel'
      ? `${activeChat.subscriberCount?.toLocaleString() ?? 0} subscribers`
      : activeChat?.type === 'group'
        ? `${activeChat.members?.length ?? 0} members`
        : peer
          ? formatLastSeen(peer)
          : 'last seen recently';

  const handleSend = (text: string) => {
    if (!me) return;
    send(chatId, me.id, text);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.chatBackground }]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            paddingTop: insets.top,
            borderBottomColor: colors.separator,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </Pressable>

        <Pressable
          style={styles.headerInfo}
          onPress={() => activeChat?.peerId && router.push(`/profile/${activeChat.peerId}`)}
        >
          <Avatar
            id={chatId}
            name={activeChat?.title ?? '…'}
            uri={activeChat?.avatarUrl}
            size={40}
            online={peer?.isOnline}
          />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
              {activeChat?.title ?? 'Loading…'}
            </Text>
            <Text numberOfLines={1} style={[styles.headerSub, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable hitSlop={8}>
            <Ionicons name="call" size={22} color={colors.primary} />
          </Pressable>
          <Pressable hitSlop={8}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      {loading && messages.length === 0 ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => {
            const prev = messages[index - 1];
            const isMine = item.senderId === me?.id;
            const showSender =
              activeChat?.type !== 'direct' && !isMine && prev?.senderId !== item.senderId;
            return (
              <ChatBubble
                message={item}
                isMine={isMine}
                senderName={showSender ? getUser(item.senderId)?.displayName : undefined}
              />
            );
          }}
          contentContainerStyle={{ paddingVertical: 10 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={{ paddingBottom: Math.max(insets.bottom, 4), backgroundColor: colors.surface }}>
        <MessageInput onSend={handleSend} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { paddingHorizontal: 2 },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 2 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSub: { fontSize: 13, marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 10 },
});
