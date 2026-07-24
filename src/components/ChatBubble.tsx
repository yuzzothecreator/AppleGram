import { Avatar } from '@/components/Avatar';
import { useTheme } from '@/theme/ThemeContext';
import { Message } from '@/types';
import { formatTime } from '@/utils/format';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StatusTicks } from '@/components/StatusTicks';

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  showTail?: boolean;
  senderName?: string;
}

export function ChatBubble({ message, isMine, showTail = true, senderName }: ChatBubbleProps) {
  const { colors, spacing } = useTheme();

  const bubbleColor = isMine ? colors.bubbleOut : colors.bubbleIn;
  const textColor = isMine ? colors.bubbleOutText : colors.bubbleInText;
  const metaColor = isMine ? 'rgba(255,255,255,0.75)' : colors.textMuted;

  return (
    <Animated.View
      entering={FadeInDown.duration(160)}
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
            borderBottomRightRadius: isMine && showTail ? 4 : 18,
            borderBottomLeftRadius: !isMine && showTail ? 4 : 18,
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
  row: { width: '100%', marginVertical: 1.5 },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 18,
  },
  sender: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  text: { fontSize: 17, lineHeight: 22 },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  time: { fontSize: 11 },
});
