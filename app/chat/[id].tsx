import { Avatar } from '@/components/Avatar';
import { ChatBubble } from '@/components/ChatBubble';
import { MessageInput } from '@/components/MessageInput';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useTheme } from '@/theme/ThemeContext';
import { Message } from '@/types';
import { formatLastSeen } from '@/utils/format';
import { getUser } from '@/services/chatService';
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
          : 'tap for info';

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
          <Text style={{ color: colors.primary, fontSize: 17 }}>Messages</Text>
        </Pressable>

        <Pressable
          style={styles.headerCenter}
          onPress={() => activeChat?.peerId && router.push(`/profile/${activeChat.peerId}`)}
        >
          <Avatar
            id={chatId}
            name={activeChat?.title ?? '…'}
            uri={activeChat?.avatarUrl}
            size={36}
            online={peer?.isOnline}
          />
          <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
            {activeChat?.title ?? 'Loading…'}
          </Text>
          <Text numberOfLines={1} style={[styles.headerSub, { color: colors.textMuted }]}>
            {subtitle}
          </Text>
        </Pressable>

        <Pressable hitSlop={8} style={{ width: 70, alignItems: 'flex-end' }}>
          <Ionicons name="videocam" size={24} color={colors.primary} />
        </Pressable>
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
          contentContainerStyle={{ paddingVertical: 12 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={{ paddingBottom: Math.max(insets.bottom, 8), backgroundColor: colors.surface }}>
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
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', width: 100 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  headerSub: { fontSize: 12 },
});
