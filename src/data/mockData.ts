import { Chat, Message, SmartReply, User } from '@/types';

export const CURRENT_USER: User = {
  id: 'u_me',
  username: 'you',
  displayName: 'You',
  phone: '+255 700 000 000',
  email: 'you@teleprompt.app',
  bio: 'Building the future of messaging.',
  isPremium: true,
  isOnline: true,
};

export const USERS: Record<string, User> = {
  u_me: CURRENT_USER,
  u_amina: {
    id: 'u_amina',
    username: 'amina',
    displayName: 'Amina Hassan',
    isOnline: true,
    bio: 'Product designer ✦',
  },
  u_john: {
    id: 'u_john',
    username: 'johnk',
    displayName: 'John Kessy',
    lastSeen: '2026-06-01T01:12:00Z',
    bio: 'Coffee + code',
  },
  u_devs: {
    id: 'u_devs',
    username: 'teleprompt_devs',
    displayName: 'Teleprompt Devs',
  },
  u_ai: {
    id: 'u_ai',
    username: 'teleprompt_ai',
    displayName: 'Teleprompt AI',
    isBot: true,
    bio: 'Your built-in assistant',
  },
  u_shop: {
    id: 'u_shop',
    username: 'skillshop',
    displayName: 'Skill Shop',
  },
};

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

function lastMsg(chatId: string, senderId: string, text: string, mins: number): Message {
  return {
    id: `m_${chatId}_last`,
    chatId,
    senderId,
    kind: 'text',
    text,
    status: 'seen',
    createdAt: minutesAgo(mins),
  };
}

export const CHATS: Chat[] = [
  {
    id: 'c_amina',
    type: 'direct',
    title: 'Amina Hassan',
    peerId: 'u_amina',
    unreadCount: 2,
    pinned: true,
    lastMessage: lastMsg('c_amina', 'u_amina', 'Did you see the new mockups? 🔥', 3),
  },
  {
    id: 'c_ai',
    type: 'ai',
    title: 'Teleprompt AI',
    peerId: 'u_ai',
    unreadCount: 0,
    lastMessage: lastMsg('c_ai', 'u_ai', 'Ask me anything — I can summarize chats too.', 18),
  },
  {
    id: 'c_devs',
    type: 'group',
    title: 'Teleprompt Devs',
    unreadCount: 5,
    members: [
      { userId: 'u_me', role: 'admin', joinedAt: minutesAgo(9000) },
      { userId: 'u_amina', role: 'member', joinedAt: minutesAgo(9000) },
      { userId: 'u_john', role: 'owner', joinedAt: minutesAgo(9000) },
    ],
    lastMessage: lastMsg('c_devs', 'u_john', 'Pushing the realtime branch tonight.', 41),
  },
  {
    id: 'c_announce',
    type: 'channel',
    title: 'Teleprompt Announcements',
    unreadCount: 1,
    subscriberCount: 12840,
    isSubscribed: true,
    lastMessage: lastMsg('c_announce', 'u_devs', 'v0.1 is live for beta testers 🎉', 120),
  },
  {
    id: 'c_secret',
    type: 'secret',
    title: 'John Kessy',
    peerId: 'u_john',
    unreadCount: 0,
    isEncrypted: true,
    selfDestructSeconds: 60,
    lastMessage: lastMsg('c_secret', 'u_john', '🔒 This message will self-destruct.', 200),
  },
  {
    id: 'c_shop',
    type: 'bot',
    title: 'Skill Shop',
    peerId: 'u_shop',
    unreadCount: 0,
    lastMessage: lastMsg('c_shop', 'u_shop', 'New course: React Native Mastery', 320),
  },
];

export const MESSAGES: Record<string, Message[]> = {
  c_amina: [
    {
      id: 'm1',
      chatId: 'c_amina',
      senderId: 'u_amina',
      kind: 'text',
      text: 'Hey! How is the Teleprompt build going?',
      status: 'seen',
      createdAt: minutesAgo(30),
    },
    {
      id: 'm2',
      chatId: 'c_amina',
      senderId: 'u_me',
      kind: 'text',
      text: 'Great — auth + chat list are done, wiring up realtime next.',
      status: 'seen',
      createdAt: minutesAgo(28),
    },
    {
      id: 'm3',
      chatId: 'c_amina',
      senderId: 'u_amina',
      kind: 'text',
      text: 'Amazing 👏 Did you see the new mockups? 🔥',
      status: 'delivered',
      createdAt: minutesAgo(3),
      replyToId: 'm2',
    },
  ],
  c_ai: [
    {
      id: 'ai1',
      chatId: 'c_ai',
      senderId: 'u_ai',
      kind: 'text',
      text: "Hi! I'm your Teleprompt assistant. I can draft replies, summarize long chats, and transcribe voice notes.",
      status: 'seen',
      createdAt: minutesAgo(20),
    },
  ],
  c_devs: [
    {
      id: 'd1',
      chatId: 'c_devs',
      senderId: 'u_john',
      kind: 'text',
      text: 'Pushing the realtime branch tonight.',
      status: 'seen',
      createdAt: minutesAgo(41),
    },
    {
      id: 'd2',
      chatId: 'c_devs',
      senderId: 'u_amina',
      kind: 'text',
      text: 'Nice, I’ll review the bubble animations.',
      status: 'seen',
      createdAt: minutesAgo(38),
    },
  ],
};

export const SMART_REPLIES: SmartReply[] = [
  { id: 'sr1', text: 'Looks great! 👍' },
  { id: 'sr2', text: 'Sending it now.' },
  { id: 'sr3', text: 'Let me check and get back.' },
];
