import { Avatar } from '@/components/Avatar';
import { listContacts, startDirectChat } from '@/services/chatService';
import { useChatStore } from '@/store/chatStore';
import { useTheme } from '@/theme/ThemeContext';
import { User } from '@/types';
import { formatLastSeen } from '@/utils/format';
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

/** Telegram-style Contacts tab */
export default function ContactsScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const upsertChat = useChatStore((s) => s.upsertChat);

  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listContacts());
    } catch (e: any) {
      setError(e.message ?? 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false),
    );
  }, [users, query]);

  const openChat = async (user: User) => {
    setOpeningId(user.id);
    try {
      const chat = await startDirectChat(user.id);
      upsertChat(chat);
      router.push(`/chat/${chat.id}`);
    } catch (e: any) {
      setError(e.message ?? 'Could not open chat');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.text }]}>Contacts</Text>
        <Pressable hitSlop={8} onPress={() => router.push('/compose')}>
          <Ionicons name="person-add-outline" size={24} color={colors.primary} />
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

      {error ? (
        <Text style={{ color: colors.danger, paddingHorizontal: spacing.lg, marginTop: 8 }}>
          {error}
        </Text>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openChat(item)}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: pressed ? colors.surfaceElevated : colors.surface },
              ]}
            >
              <Avatar
                id={item.id}
                name={item.displayName}
                uri={item.avatarUrl}
                size={48}
                online={item.isOnline}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>
                  {item.displayName}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 2 }}>
                  {item.isOnline ? 'online' : formatLastSeen(item)}
                </Text>
              </View>
              {openingId === item.id ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
              )}
            </Pressable>
          )}
          ItemSeparatorComponent={() => (
            <View style={[styles.sep, { backgroundColor: colors.separator, marginLeft: 76 }]} />
          )}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              No contacts yet. Create another account to chat with.
            </Text>
          }
          contentContainerStyle={{ paddingBottom: 40 }}
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
    paddingVertical: 10,
  },
  title: { fontSize: 28, fontWeight: '700' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 10,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sep: { height: StyleSheet.hairlineWidth },
  empty: { textAlign: 'center', marginTop: 48, paddingHorizontal: 32, fontSize: 15 },
});
