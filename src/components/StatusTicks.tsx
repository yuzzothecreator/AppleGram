import { useTheme } from '@/theme/ThemeContext';
import { MessageStatus } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

/** Telegram-style delivery indicators: sending / sent / delivered / seen / failed. */
export function StatusTicks({ status, tint }: { status: MessageStatus; tint?: string }) {
  const { colors } = useTheme();
  const color = tint ?? colors.textMuted;

  if (status === 'sending') return <ActivityIndicator size="small" color={color} />;
  if (status === 'failed') return <Ionicons name="alert-circle" size={14} color={colors.danger} />;

  const seen = status === 'seen';
  const single = status === 'sent';
  const checkColor = seen ? colors.primary : color;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name="checkmark" size={14} color={checkColor} />
      {!single && (
        <Ionicons name="checkmark" size={14} color={checkColor} style={{ marginLeft: -8 }} />
      )}
    </View>
  );
}
