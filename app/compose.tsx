import { Avatar } from '@/components/Avatar';
import { searchUsers, startDirectChat } from '@/services/chatService';
import { useChatStore } from '@/store/chatStore';
import { useTheme } from '@/theme/ThemeContext';
import { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

export default function ComposeScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const upsertChat = useChatStore((s) => s.upsertChat);

  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const q = query.trim();
    if (q.length < 1) {
      setUsers([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      searchUsers(q)
        .then((list) => {
          if (!cancelled) setUsers(list);
        })
        .catch((e) => {
          if (!cancelled) setError(e.message ?? 'Search failed');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const openChat = async (user: User) => {
    setError(null);
    setStartingId(user.id);
    try {
      const chat = await startDirectChat(user.id);
      upsertChat(chat);
      router.replace(`/chat/${chat.id}`);
    } catch (e: any) {
      setError(e.message ?? 'Could not start chat');
      setStartingId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.separator }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ color: colors.primary, fontSize: 17 }}>Cancel</Text>
        </Pressable>
        <Text style={[styles.title, { color: colors.text }]}>New Message</Text>
        <View style={{ width: 54 }} />
      </View>

      <View style={[styles.toRow, { borderBottomColor: colors.separator }]}>
        <Text style={[styles.toLabel, { color: colors.textMuted }]}>To:</Text>
        <TextInput
          autoFocus
          value={query}
          onChangeText={setQuery}
          placeholder="Name or email"
          placeholderTextColor={colors.textMuted}
          style={[styles.toInput, { color: colors.text }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {error ? (
        <Text style={{ color: colors.danger, padding: spacing.lg }}>{error}</Text>
      ) : null}

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}

      <FlatList
        data={users}
        keyExtractor={(u) => u.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openChat(item)}
            disabled={startingId === item.id}
            style={({ pressed }) => [
              styles.userRow,
              { backgroundColor: pressed ? colors.surfaceElevated : colors.surface },
            ]}
          >
            <Avatar id={item.id} name={item.displayName} uri={item.avatarUrl} size={44} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>
                {item.displayName}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 14 }}>@{item.username}</Text>
            </View>
            {startingId === item.id ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          query.trim().length > 0 && !loading ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>No people found</Text>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: '600' },
  toRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  toLabel: { fontSize: 17 },
  toInput: { flex: 1, fontSize: 17, paddingVertical: 0 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },
});
