import { StatusTicks } from '@/components/StatusTicks';
import { useTheme } from '@/theme/ThemeContext';
import { Message } from '@/types';
import { formatTime } from '@/utils/format';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  showTail?: boolean;
  senderName?: string;
  onLongPress?: () => void;
}

export function ChatBubble({
  message,
  isMine,
  showTail = true,
  senderName,
  onLongPress,
}: ChatBubbleProps) {
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
      <Pressable
        onLongPress={onLongPress}
        delayLongPress={280}
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleColor,
            borderBottomRightRadius: isMine && showTail ? 4 : 16,
            borderBottomLeftRadius: !isMine && showTail ? 4 : 16,
            shadowColor: colors.shadow,
            paddingHorizontal: message.kind === 'image' ? 4 : 10,
            paddingTop: message.kind === 'image' ? 4 : 6,
          },
        ]}
      >
        {!isMine && senderName ? (
          <Text style={[styles.sender, { color: colors.primary, paddingHorizontal: message.kind === 'image' ? 6 : 0 }]}>
            {senderName}
          </Text>
        ) : null}

        {message.replyPreview ? (
          <View
            style={[
              styles.reply,
              {
                borderLeftColor: colors.primary,
                backgroundColor: isMine ? 'rgba(0,0,0,0.06)' : colors.surfaceElevated,
                marginHorizontal: message.kind === 'image' ? 6 : 0,
              },
            ]}
          >
            <Text numberOfLines={2} style={[styles.replyText, { color: textColor }]}>
              {message.replyPreview.text || 'Photo'}
            </Text>
          </View>
        ) : null}

        {message.attachment?.url ? (
          <Image
            source={{ uri: message.attachment.url }}
            style={styles.image}
            contentFit="cover"
          />
        ) : null}

        {message.text ? (
          <Text
            style={[
              styles.text,
              {
                color: textColor,
                paddingHorizontal: message.kind === 'image' ? 6 : 0,
                marginTop: message.kind === 'image' ? 4 : 0,
              },
            ]}
          >
            {message.text}
          </Text>
        ) : null}

        <View style={[styles.meta, { paddingHorizontal: message.kind === 'image' ? 6 : 0 }]}>
          <Text style={[styles.time, { color: metaColor }]}>{formatTime(message.createdAt)}</Text>
          {isMine ? <StatusTicks status={message.status} tint={metaColor} /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', marginVertical: 2 },
  bubble: {
    maxWidth: '78%',
    paddingBottom: 5,
    borderRadius: 16,
    shadowOpacity: 0.08,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  sender: { fontSize: 13, fontWeight: '600', marginBottom: 2 },
  reply: {
    borderLeftWidth: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  replyText: { fontSize: 13, opacity: 0.85 },
  image: { width: 220, height: 220, borderRadius: 12 },
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
