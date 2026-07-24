import { ChatBubble } from '@/components/ChatBubble';
import { MessageInput } from '@/components/MessageInput';
import { askAssistant } from '@/services/aiService';
import { useTheme } from '@/theme/ThemeContext';
import { Message } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AI_ID = 'u_ai';
const ME = 'u_me';

const SUGGESTIONS = ['Summarize my last chat', 'Draft a reply', 'Translate text', 'Write a to-do list'];

export default function AIAssistant() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Message>>(null);
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      chatId: 'ai',
      senderId: AI_ID,
      kind: 'text',
      text: "Hi, I'm Teleprompt AI. Ask me anything, or pick a suggestion below.",
      status: 'seen',
      createdAt: new Date().toISOString(),
    },
  ]);

  const send = async (text: string) => {
    const mine: Message = {
      id: `m_${Date.now()}`,
      chatId: 'ai',
      senderId: ME,
      kind: 'text',
      text,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, mine]);
    setThinking(true);
    const reply = await askAssistant(text);
    setThinking(false);
    setMessages((prev) => [
      ...prev,
      {
        id: `ai_${Date.now()}`,
        chatId: 'ai',
        senderId: AI_ID,
        kind: 'text',
        text: reply,
        status: 'seen',
        createdAt: new Date().toISOString(),
      },
    ]);
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.chatBackground, paddingTop: insets.top }]}
    >
      <View style={[styles.header, { backgroundColor: colors.surface, paddingHorizontal: spacing.lg }]}>
        <View style={[styles.aiAvatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="sparkles" size={18} color={colors.onPrimary} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Teleprompt AI</Text>
          <Text style={[styles.headerSub, { color: thinking ? colors.primary : colors.textMuted }]}>
            {thinking ? 'thinking…' : 'always available'}
          </Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <ChatBubble message={item} isMine={item.senderId === ME} />
        )}
        contentContainerStyle={{ paddingVertical: 12 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={[styles.suggestions, { paddingHorizontal: spacing.md }]}>
        {messages.length <= 1 &&
          SUGGESTIONS.map((s) => (
            <Pressable
              key={s}
              onPress={() => send(s)}
              style={[styles.chip, { backgroundColor: colors.surface }]}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>{s}</Text>
            </Pressable>
          ))}
      </View>

      <View style={{ paddingBottom: insets.bottom }}>
        <MessageInput onSend={send} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  aiAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 12 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18 },
});
