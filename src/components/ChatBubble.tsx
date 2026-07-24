import { StatusTicks } from '@/components/StatusTicks';
import { useTheme } from '@/theme/ThemeContext';
import { Message } from '@/types';
import { formatTime } from '@/utils/format';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  showTail?: boolean;
  senderName?: string;
}

/** Telegram iOS bubble: green outgoing (light), blue-gray (dark), white/dark incoming. */
export function ChatBubble({ message, isMine, showTail = true, senderName }: ChatBubbleProps) {
  const { colors, spacing, theme } = useTheme();

  const bubbleColor = isMine ? colors.bubbleOut : colors.bubbleIn;
  const textColor = isMine ? colors.bubbleOutText : colors.bubbleInText;
  const metaColor = isMine
    ? theme === 'dark'
      ? 'rgba(255,255,255,0.65)'
      : '#62A965'
    : colors.textMuted;

  return (
    <Animated.View
      entering={FadeInDown.duration(140)}
      style={[
        styles.row,
        {
          justifyContent: isMine ? 'flex-end' : 'flex-start',
          paddingHorizontal: spacing.md,
        },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleColor,
            borderBottomRightRadius: isMine && showTail ? 4 : 16,
            borderBottomLeftRadius: !isMine && showTail ? 4 : 16,
            shadowColor: colors.shadow,
          },
        ]}
      >
        {!isMine && senderName ? (
          <Text style={[styles.sender, { color: colors.primary }]}>{senderName}</Text>
        ) : null}

        <Text style={[styles.text, { color: textColor }]}>{message.text}</Text>

        <View style={styles.meta}>
          <Text style={[styles.time, { color: metaColor }]}>{formatTime(message.createdAt)}</Text>
          {isMine ? <StatusTicks status={message.status} tint={metaColor} /> : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', marginVertical: 2 },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 5,
    borderRadius: 16,
    shadowOpacity: 0.08,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sender: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  text: { fontSize: 16, lineHeight: 21 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 3,
    marginTop: 1,
  },
  time: { fontSize: 11 },
});
