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
  upsertChat: (chat: Chat) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  loadingChats: false,
  messagesByChat: {},
  loadingMessages: {},
  activeChat: null,

  loadChats: async () => {
    set({ loadingChats: true });
    try {
      const chats = await listChats();
      set({ chats, loadingChats: false });
    } catch {
      set({ loadingChats: false });
    }
  },

  openChat: async (chatId) => {
    const chat = await getChat(chatId);
    set({ activeChat: chat ?? null });
    await get().loadMessages(chatId);
  },

  loadMessages: async (chatId) => {
    set((s) => ({ loadingMessages: { ...s.loadingMessages, [chatId]: true } }));
    try {
      const messages = await listMessages(chatId);
      set((s) => ({
        messagesByChat: { ...s.messagesByChat, [chatId]: messages },
        loadingMessages: { ...s.loadingMessages, [chatId]: false },
      }));
    } catch {
      set((s) => ({
        loadingMessages: { ...s.loadingMessages, [chatId]: false },
      }));
    }
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

    try {
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
    } catch {
      set((s) => ({
        messagesByChat: {
          ...s.messagesByChat,
          [chatId]: (s.messagesByChat[chatId] ?? []).map((m) =>
            m.id === optimistic.id ? { ...m, status: 'failed' } : m,
          ),
        },
      }));
    }
  },

  receive: (message) => {
    set((s) => {
      const existing = s.messagesByChat[message.chatId] ?? [];
      if (existing.some((m) => m.id === message.id)) return s;
      // Drop matching optimistic temp bubble
      const withoutTemp = existing.filter(
        (m) =>
          !(
            m.id.startsWith('temp_') &&
            m.text === message.text &&
            m.senderId === message.senderId
          ),
      );
      return {
        messagesByChat: {
          ...s.messagesByChat,
          [message.chatId]: [...withoutTemp, message],
        },
        chats: s.chats.map((c) =>
          c.id === message.chatId ? { ...c, lastMessage: message } : c,
        ),
      };
    });
  },

  subscribe: (chatId) => subscribeToMessages(chatId, (m) => get().receive(m)),

  upsertChat: (chat) => {
    set((s) => {
      const others = s.chats.filter((c) => c.id !== chat.id);
      return { chats: [chat, ...others] };
    });
  },
}));
