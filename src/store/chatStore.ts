import {
  getChat,
  listChats,
  listMessages,
  sendMessage,
  subscribeToMessages,
} from '@/services/chatService';
import { Chat, Message } from '@/types';
import { create } from 'zustand';

interface ChatState {
  chats: Chat[];
  loadingChats: boolean;

  messagesByChat: Record<string, Message[]>;
  loadingMessages: Record<string, boolean>;
  activeChat: Chat | null;

  loadChats: () => Promise<void>;
  openChat: (chatId: string) => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  send: (chatId: string, senderId: string, text: string, replyToId?: string) => Promise<void>;
  receive: (message: Message) => void;
  subscribe: (chatId: string) => () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  loadingChats: false,
  messagesByChat: {},
  loadingMessages: {},
  activeChat: null,

  loadChats: async () => {
    set({ loadingChats: true });
    const chats = await listChats();
    set({ chats, loadingChats: false });
  },

  openChat: async (chatId) => {
    const chat = await getChat(chatId);
    set({ activeChat: chat ?? null });
    await get().loadMessages(chatId);
  },

  loadMessages: async (chatId) => {
    set((s) => ({ loadingMessages: { ...s.loadingMessages, [chatId]: true } }));
    const messages = await listMessages(chatId);
    set((s) => ({
      messagesByChat: { ...s.messagesByChat, [chatId]: messages },
      loadingMessages: { ...s.loadingMessages, [chatId]: false },
    }));
  },

  send: async (chatId, senderId, text, replyToId) => {
    const optimistic: Message = {
      id: `temp_${Date.now()}`,
      chatId,
      senderId,
      kind: 'text',
      text,
      status: 'sending',
      createdAt: new Date().toISOString(),
      replyToId,
    };
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: [...(s.messagesByChat[chatId] ?? []), optimistic],
      },
    }));

    const saved = await sendMessage({ chatId, senderId, text, replyToId });

    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: (s.messagesByChat[chatId] ?? []).map((m) =>
          m.id === optimistic.id ? saved : m,
        ),
      },
      chats: s.chats.map((c) =>
        c.id === chatId ? { ...c, lastMessage: saved, unreadCount: 0 } : c,
      ),
    }));
  },

  receive: (message) => {
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [message.chatId]: [...(s.messagesByChat[message.chatId] ?? []), message],
      },
    }));
  },

  subscribe: (chatId) => subscribeToMessages(chatId, (m) => get().receive(m)),
}));
