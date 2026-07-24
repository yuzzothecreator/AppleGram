import { ChatListItem } from '@/components/ChatListItem';
import { FloatingButton } from '@/components/FloatingButton';
import { useChatStore } from '@/store/chatStore';
import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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

export default function ChatList() {
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { chats, loadingChats, loadChats } = useChatStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadChats();
  }, [loadChats]);

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
        <Text style={[styles.title, { color: colors.text }]}>Teleprompt</Text>
        <Pressable hitSlop={8}>
          <Ionicons name="camera-outline" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.search, { backgroundColor: colors.surface, borderRadius: radius.md, marginHorizontal: spacing.lg }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search chats and messages"
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
          ItemSeparatorComponent={() => (
            <View style={[styles.sep, { backgroundColor: colors.separator, marginLeft: 84 }]} />
          )}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>No chats found.</Text>
          }
        />
      )}

      <FloatingButton icon="create" onPress={() => router.push('/(tabs)/ai')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  title: { fontSize: 26, fontWeight: '800' },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, height: 42, marginTop: 4, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  sep: { height: StyleSheet.hairlineWidth },
  empty: { textAlign: 'center', marginTop: 40 },
});
