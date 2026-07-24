import { useTheme } from '@/theme/ThemeContext';
import { SmartReply } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

/** AI smart-reply chip row shown above the keyboard. */
export function SmartReplies({
  replies,
  onPick,
}: {
  replies: SmartReply[];
  onPick: (text: string) => void;
}) {
  const { colors, radius } = useTheme();
  if (!replies.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={{ backgroundColor: colors.surface }}
    >
      {replies.map((r) => (
        <Pressable
          key={r.id}
          onPress={() => onPick(r.text)}
          style={[styles.chip, { backgroundColor: colors.primaryMuted, borderRadius: radius.pill }]}
        >
          <Ionicons name="sparkles" size={13} color={colors.primary} />
          <Text style={[styles.text, { color: colors.primary }]}>{r.text}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7 },
  text: { fontSize: 14, fontWeight: '600' },
});
