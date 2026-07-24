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
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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

  const {
    activeChat,
    openChat,
    send,
    sendImage,
    removeMessage,
    setChatPrefs,
    subscribe,
    notifyTyping,
    messagesByChat,
    loadingMessages,
    typingByChat,
  } = useChatStore();
  const messages = messagesByChat[chatId] ?? [];
  const loading = loadingMessages[chatId];
  const typing = typingByChat[chatId] ?? [];
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [menuMsg, setMenuMsg] = useState<Message | null>(null);

  useEffect(() => {
    openChat(chatId);
    const unsub = subscribe(chatId);
    return unsub;
  }, [chatId, openChat, subscribe]);

  const peer = activeChat?.peerId ? getUser(activeChat.peerId) : undefined;
  const typingLabel =
    typing.length === 1
      ? 'typing...'
      : typing.length > 1
        ? 'several people are typing...'
        : null;
  const subtitle =
    typingLabel ??
    (activeChat?.type === 'channel'
      ? `${activeChat.subscriberCount?.toLocaleString() ?? 0} subscribers`
      : activeChat?.type === 'group'
        ? `${activeChat.members?.length ?? 0} members`
        : peer
          ? formatLastSeen(peer)
          : 'last seen recently');

  const handleSend = (text: string) => {
    if (!me) return;
    send(chatId, me.id, text, replyTo?.id);
    setReplyTo(null);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo access to send images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0] || !me) return;
    const asset = result.assets[0];
    await sendImage(chatId, me.id, asset.uri, {
      mimeType: asset.mimeType,
      fileName: asset.fileName ?? 'photo.jpg',
      replyToId: replyTo?.id,
    });
    setReplyTo(null);
  };

  const onDelete = async () => {
    if (!menuMsg) return;
    const idToDelete = menuMsg.id;
    setMenuMsg(null);
    try {
      await removeMessage(chatId, idToDelete);
    } catch (e: any) {
      Alert.alert('Could not delete', e.message ?? 'Try again');
    }
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
            <Text
              numberOfLines={1}
              style={[
                styles.headerSub,
                { color: typingLabel ? colors.primary : colors.textMuted },
              ]}
            >
              {subtitle}
            </Text>
          </View>
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable
            hitSlop={8}
            onPress={() =>
              setChatPrefs(chatId, { muted: !activeChat?.muted }).catch(() => {})
            }
          >
            <Ionicons
              name={activeChat?.muted ? 'notifications-off' : 'notifications-outline'}
              size={22}
              color={colors.primary}
            />
          </Pressable>
          <Pressable
            hitSlop={8}
            onPress={() =>
              setChatPrefs(chatId, { pinned: !activeChat?.pinned }).catch(() => {})
            }
          >
            <Ionicons
              name={activeChat?.pinned ? 'pin' : 'pin-outline'}
              size={22}
              color={colors.primary}
            />
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
                onLongPress={() => setMenuMsg(item)}
              />
            );
          }}
          contentContainerStyle={{ paddingVertical: 10 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={{ paddingBottom: Math.max(insets.bottom, 4), backgroundColor: colors.surface }}>
        <MessageInput
          onSend={handleSend}
          onAttach={pickImage}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onTypingChange={(isTyping) => notifyTyping(chatId, isTyping)}
        />
      </View>

      <Modal transparent visible={!!menuMsg} animationType="fade" onRequestClose={() => setMenuMsg(null)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuMsg(null)}>
          <View style={[styles.menu, { backgroundColor: colors.surfaceElevated }]}>
            <Pressable
              style={styles.menuItem}
              onPress={() => {
                if (menuMsg) setReplyTo(menuMsg);
                setMenuMsg(null);
              }}
            >
              <Ionicons name="arrow-undo" size={20} color={colors.text} />
              <Text style={{ color: colors.text, fontSize: 16 }}>Reply</Text>
            </Pressable>
            {menuMsg?.senderId === me?.id && !menuMsg?.id.startsWith('temp_') ? (
              <Pressable style={styles.menuItem} onPress={onDelete}>
                <Ionicons name="trash" size={20} color={colors.danger} />
                <Text style={{ color: colors.danger, fontSize: 16 }}>Delete</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      </Modal>
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
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 40,
  },
  menu: { borderRadius: 14, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
});
