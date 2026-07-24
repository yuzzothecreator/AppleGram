import {
  deleteMessage as deleteMessageApi,
  getChat,
  listChats,
  listMessages,
  sendImageMessage,
  sendMessage,
  subscribeToMessages,
  updateChatPrefs,
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
  sendImage: (
    chatId: string,
    senderId: string,
    uri: string,
    meta?: { mimeType?: string; fileName?: string; text?: string; replyToId?: string },
  ) => Promise<void>;
  removeMessage: (chatId: string, messageId: string) => Promise<void>;
  setChatPrefs: (chatId: string, prefs: { pinned?: boolean; muted?: boolean }) => Promise<void>;
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

  sendImage: async (chatId, senderId, uri, meta) => {
    const optimistic: Message = {
      id: `temp_${Date.now()}`,
      chatId,
      senderId,
      kind: 'image',
      text: meta?.text,
      status: 'sending',
      createdAt: new Date().toISOString(),
      replyToId: meta?.replyToId,
      attachment: { id: 'temp', kind: 'image', url: uri },
    };
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: [...(s.messagesByChat[chatId] ?? []), optimistic],
      },
    }));

    try {
      const saved = await sendImageMessage({
        chatId,
        uri,
        mimeType: meta?.mimeType,
        fileName: meta?.fileName,
        text: meta?.text,
        replyToId: meta?.replyToId,
      });
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

  removeMessage: async (chatId, messageId) => {
    await deleteMessageApi(messageId);
    set((s) => ({
      messagesByChat: {
        ...s.messagesByChat,
        [chatId]: (s.messagesByChat[chatId] ?? []).filter((m) => m.id !== messageId),
      },
    }));
  },

  setChatPrefs: async (chatId, prefs) => {
    const chat = await updateChatPrefs(chatId, prefs);
    set((s) => ({
      chats: s.chats
        .map((c) => (c.id === chatId ? chat : c))
        .sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned)),
      activeChat: s.activeChat?.id === chatId ? chat : s.activeChat,
    }));
  },

  receive: (message) => {
    set((s) => {
      const existing = s.messagesByChat[message.chatId] ?? [];
      if (existing.some((m) => m.id === message.id)) return s;
      const withoutTemp = existing.filter(
        (m) =>
          !(
            m.id.startsWith('temp_') &&
            m.senderId === message.senderId &&
            (m.text === message.text ||
              (m.kind === 'image' && message.kind === 'image'))
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
