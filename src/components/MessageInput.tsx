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

/** Telegram iOS composer: attach · Message · send / mic */
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
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.separator }]}>
      <Pressable onPress={onAttach} hitSlop={8} style={styles.iconBtn}>
        <Ionicons name="attach" size={26} color={colors.textMuted} style={{ transform: [{ rotate: '-45deg' }] }} />
      </Pressable>

      <View
        style={[
          styles.inputWrap,
          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Message"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[styles.input, { color: colors.text }]}
        />
        <Pressable hitSlop={6} style={styles.emojiBtn}>
          <Ionicons name="happy-outline" size={22} color={colors.textMuted} />
        </Pressable>
      </View>

      <Pressable
        onPress={canSend ? handleSend : onVoice}
        hitSlop={8}
        style={[styles.sendBtn, { backgroundColor: colors.primary }]}
      >
        <Ionicons name={canSend ? 'arrow-up' : 'mic'} size={20} color={colors.onPrimary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: { paddingBottom: 8, paddingHorizontal: 2 },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 40,
    paddingLeft: 12,
    paddingRight: 6,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
  },
  emojiBtn: { paddingBottom: 9, paddingHorizontal: 4 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
