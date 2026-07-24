import { useTheme } from '@/theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

interface MessageInputProps {
  onSend: (text: string) => void;
  onAttach?: () => void;
  onVoice?: () => void;
}

export function MessageInput({ onSend, onAttach, onVoice }: MessageInputProps) {
  const { colors, radius, spacing } = useTheme();
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    onSend(text.trim());
    setText('');
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
      ]}
    >
      <Pressable onPress={onAttach} hitSlop={8} style={styles.iconBtn}>
        <Ionicons name="add-circle-outline" size={26} color={colors.textMuted} />
      </Pressable>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Message"
        placeholderTextColor={colors.textMuted}
        multiline
        style={[
          styles.input,
          { color: colors.text, backgroundColor: colors.surfaceElevated, borderRadius: radius.lg },
        ]}
      />

      <Pressable
        onPress={canSend ? handleSend : onVoice}
        hitSlop={8}
        style={[styles.sendBtn, { backgroundColor: colors.primary }]}
      >
        <Ionicons name={canSend ? 'send' : 'mic'} size={20} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  iconBtn: { paddingBottom: 8 },
  input: { flex: 1, maxHeight: 120, minHeight: 42, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, fontSize: 16 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
