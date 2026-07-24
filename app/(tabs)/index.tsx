import { ChatListItem } from '@/components/ChatListItem';
import { FloatingButton } from '@/components/FloatingButton';
import { isApiConfigured } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Telegram iOS Chats tab */
export default function ChatsScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { chats, loadingChats, loadChats } = useChatStore();
  const [query, setQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    return chats.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.lastMessage?.text?.toLowerCase().includes(q),
    );
  }, [chats, query]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Pressable hitSlop={8}>
          <Text style={[styles.headerAction, { color: colors.primary }]}>Edit</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Chats</Text>
        <Pressable hitSlop={8} onPress={() => router.push('/compose')}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <View
        style={[
          styles.search,
          { backgroundColor: colors.surfaceElevated, marginHorizontal: spacing.lg },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {loadingChats ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ChatListItem chat={item} onPress={() => router.push(`/chat/${item.id}`)} />
          )}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name="chatbubbles" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No chats yet</Text>
              <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                {isApiConfigured
                  ? 'Tap the pencil to start a new conversation.'
                  : 'Connect the API, then start chatting.'}
              </Text>
            </View>
          }
        />
      )}

      <FloatingButton icon="pencil" onPress={() => router.push('/compose')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  headerAction: { fontSize: 17, width: 48 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 10,
    marginBottom: 4,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  emptyWrap: { alignItems: 'center', paddingHorizontal: 40, marginTop: 80, gap: 10 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyBody: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
});
