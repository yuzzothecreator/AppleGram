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
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0;

  const handleSend = () => {
    if (!canSend) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={[styles.container, { borderTopColor: colors.separator, backgroundColor: colors.surface }]}>
      <Pressable onPress={onAttach} hitSlop={8} style={styles.iconBtn}>
        <Ionicons name="add" size={28} color={colors.primary} />
      </Pressable>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="iMessage"
        placeholderTextColor={colors.textMuted}
        multiline
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      />

      <Pressable
        onPress={canSend ? handleSend : onVoice}
        hitSlop={8}
        style={[
          styles.sendBtn,
          { backgroundColor: canSend ? colors.primary : colors.surfaceElevated },
        ]}
      >
        <Ionicons
          name={canSend ? 'arrow-up' : 'mic'}
          size={18}
          color={canSend ? colors.onPrimary : colors.textMuted}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { paddingBottom: 6 },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 36,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 17,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
