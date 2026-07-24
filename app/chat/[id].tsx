import { Avatar } from '@/components/Avatar';
import { ChatBubble } from '@/components/ChatBubble';
import { MessageInput } from '@/components/MessageInput';
import { SmartReplies } from '@/components/SmartReplies';
import { getSmartReplies, getUser } from '@/services/chatService';
import { useChatStore } from '@/store/chatStore';
import { useTheme } from '@/theme/ThemeContext';
import { Message, SmartReply } from '@/types';
import { formatLastSeen } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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

const ME = 'u_me';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = String(id);
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const listRef = useRef<FlatList<Message>>(null);

  const { activeChat, openChat, send, subscribe, messagesByChat, loadingMessages } = useChatStore();
  const messages = messagesByChat[chatId] ?? [];
  const loading = loadingMessages[chatId];
  const [smartReplies, setSmartReplies] = useState<SmartReply[]>([]);

  useEffect(() => {
    openChat(chatId);
    const unsub = subscribe(chatId);
    return unsub;
  }, [chatId, openChat, subscribe]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last && last.senderId !== ME) {
      getSmartReplies().then(setSmartReplies);
    } else {
      setSmartReplies([]);
    }
  }, [messages.length]);

  const peer = activeChat?.peerId ? getUser(activeChat.peerId) : undefined;
  const subtitle =
    activeChat?.type === 'channel'
      ? `${activeChat.subscriberCount?.toLocaleString()} subscribers`
      : activeChat?.type === 'group'
        ? `${activeChat.members?.length ?? 0} members`
        : formatLastSeen(peer);

  const handleSend = (text: string) => {
    send(chatId, ME, text);
    setSmartReplies([]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.chatBackground }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, paddingTop: insets.top, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={{ paddingRight: 4 }}>
          <Ionicons name="chevron-back" size={28} color={colors.primary} />
        </Pressable>
        <Pressable
          style={styles.headerInfo}
          onPress={() => activeChat?.peerId && router.push(`/profile/${activeChat.peerId}`)}
        >
          <Avatar id={chatId} name={activeChat?.title ?? '…'} uri={activeChat?.avatarUrl} size={40} online={peer?.isOnline} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.headerTitle, { color: colors.text }]}>
              {activeChat?.isEncrypted ? '🔒 ' : ''}{activeChat?.title ?? 'Loading…'}
            </Text>
            <Text numberOfLines={1} style={[styles.headerSub, { color: colors.textMuted }]}>{subtitle}</Text>
          </View>
        </Pressable>
        <Pressable hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
        </Pressable>
      </View>

      {/* Messages */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item, index }) => {
            const prev = messages[index - 1];
            const isMine = item.senderId === ME;
            const showSender = activeChat?.type !== 'direct' && !isMine && prev?.senderId !== item.senderId;
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

      <SmartReplies replies={smartReplies} onPick={handleSend} />

      <View style={{ paddingBottom: insets.bottom }}>
        <MessageInput onSend={handleSend} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
});
