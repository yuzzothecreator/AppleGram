import { ChatListItem } from '@/components/ChatListItem';
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

export default function MessagesScreen() {
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
          <Text style={[styles.edit, { color: colors.primary }]}>Edit</Text>
        </Pressable>
        <Pressable hitSlop={8} onPress={() => router.push('/compose')}>
          <Ionicons name="create-outline" size={26} color={colors.primary} />
        </Pressable>
      </View>

      <Text style={[styles.largeTitle, { color: colors.text, paddingHorizontal: spacing.lg }]}>
        Messages
      </Text>

      <View
        style={[
          styles.search,
          {
            backgroundColor: colors.surfaceElevated,
            marginHorizontal: spacing.lg,
          },
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
            <View style={{ backgroundColor: colors.surface }}>
              <ChatListItem chat={item} onPress={() => router.push(`/chat/${item.id}`)} />
            </View>
          )}
          ItemSeparatorComponent={() => (
            <View style={{ backgroundColor: colors.surface }}>
              <View style={[styles.sep, { backgroundColor: colors.separator, marginLeft: 80 }]} />
            </View>
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 40 }}
          ListHeaderComponent={
            <View style={{ backgroundColor: colors.surface, height: 8 }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Messages</Text>
              <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
                {isApiConfigured
                  ? 'Tap the compose button to message someone.'
                  : 'Sign in with the API connected to start chatting.'}
              </Text>
              <Pressable
                onPress={() => router.push('/compose')}
                style={[styles.composeCta, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: colors.onPrimary, fontWeight: '600', fontSize: 17 }}>
                  Compose
                </Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    paddingBottom: 2,
  },
  edit: { fontSize: 17 },
  largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: 0.4, marginBottom: 8 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 10,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 17, paddingVertical: 0 },
  sep: { height: StyleSheet.hairlineWidth },
  emptyWrap: { alignItems: 'center', paddingHorizontal: 40, marginTop: 60, gap: 8 },
  emptyTitle: { fontSize: 22, fontWeight: '700' },
  emptyBody: { fontSize: 15, textAlign: 'center', lineHeight: 21 },
  composeCta: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
  },
});
