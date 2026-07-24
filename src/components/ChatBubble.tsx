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

export function ChatBubble({ message, isMine, showTail = true, senderName }: ChatBubbleProps) {
  const { colors, radius, spacing } = useTheme();

  const bubbleColor = isMine ? colors.bubbleOut : colors.bubbleIn;
  const textColor = isMine ? colors.bubbleOutText : colors.bubbleInText;
  const metaColor = isMine ? 'rgba(255,255,255,0.7)' : colors.textMuted;

  return (
    <Animated.View
      entering={FadeInDown.duration(180)}
      style={[
        styles.row,
        { justifyContent: isMine ? 'flex-end' : 'flex-start', paddingHorizontal: spacing.md },
      ]}
    >
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleColor,
            borderRadius: radius.lg,
            borderBottomRightRadius: isMine && showTail ? radius.sm : radius.lg,
            borderBottomLeftRadius: !isMine && showTail ? radius.sm : radius.lg,
          },
        ]}
      >
        {!isMine && senderName && (
          <Text style={[styles.sender, { color: colors.primary }]}>{senderName}</Text>
        )}

        {message.encrypted && (
          <Text style={[styles.lock, { color: metaColor }]}>🔒 encrypted</Text>
        )}

        <Text style={[styles.text, { color: textColor }]}>{message.text}</Text>

        <View style={styles.meta}>
          {message.selfDestructSeconds ? (
            <Text style={[styles.timer, { color: metaColor }]}>
              ⏱ {message.selfDestructSeconds}s
            </Text>
          ) : null}
          <Text style={[styles.time, { color: metaColor }]}>{formatTime(message.createdAt)}</Text>
          {isMine && <StatusTicks status={message.status} tint={metaColor} />}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', marginVertical: 2 },
  bubble: { maxWidth: '78%', paddingHorizontal: 12, paddingVertical: 8 },
  sender: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  lock: { fontSize: 11, marginBottom: 2 },
  text: { fontSize: 16, lineHeight: 21 },
  meta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 4, marginTop: 2 },
  time: { fontSize: 11 },
  timer: { fontSize: 11 },
});
