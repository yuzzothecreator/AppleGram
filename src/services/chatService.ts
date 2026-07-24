import { CHATS, MESSAGES, SMART_REPLIES, USERS } from '@/data/mockData';
import { api, isApiConfigured } from '@/lib/api';
import { Chat, Message, SmartReply, User } from '@/types';

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export async function listChats(): Promise<Chat[]> {
  if (isApiConfigured) {
    const data = await api<{ chats: Chat[] }>('/chats');
    return data.chats;
  }
  await delay();
  return [...CHATS].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
}

export async function getChat(chatId: string): Promise<Chat | undefined> {
  if (isApiConfigured) {
    const data = await api<{ chat: Chat }>(`/chats/${chatId}`);
    return data.chat;
  }
  await delay(60);
  return CHATS.find((c) => c.id === chatId);
}

export async function listMessages(chatId: string, after?: string): Promise<Message[]> {
  if (isApiConfigured) {
    const qs = after ? `?after=${encodeURIComponent(after)}` : '';
    const data = await api<{ messages: Message[] }>(`/chats/${chatId}/messages${qs}`);
    return data.messages;
  }
  await delay();
  return MESSAGES[chatId] ? [...MESSAGES[chatId]] : [];
}

export async function sendMessage(input: {
  chatId: string;
  senderId: string;
  text: string;
  replyToId?: string;
}): Promise<Message> {
  if (isApiConfigured) {
    const data = await api<{ message: Message }>(`/chats/${input.chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: input.text, replyToId: input.replyToId }),
    });
    return data.message;
  }

  const message: Message = {
    id: `m_${Date.now()}`,
    chatId: input.chatId,
    senderId: input.senderId,
    kind: 'text',
    text: input.text,
    status: 'sent',
    createdAt: new Date().toISOString(),
    replyToId: input.replyToId,
  };
  MESSAGES[input.chatId] = [...(MESSAGES[input.chatId] ?? []), message];
  await delay(80);
  return message;
}

export async function searchUsers(query: string): Promise<User[]> {
  if (isApiConfigured) {
    const data = await api<{ users: User[] }>(
      `/users/search?q=${encodeURIComponent(query)}`,
    );
    return data.users;
  }
  const q = query.trim().toLowerCase();
  return Object.values(USERS).filter(
    (u) =>
      u.id !== 'u_me' &&
      (u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q)),
  );
}

export async function startDirectChat(userId: string): Promise<Chat> {
  if (isApiConfigured) {
    const data = await api<{ chat: Chat }>('/chats/direct', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    return data.chat;
  }
  throw new Error('Direct chats require the API backend.');
}

const userCache: Record<string, User> = { ...USERS };

export function cacheUser(user: User) {
  userCache[user.id] = user;
}

export function getUser(userId: string): User | undefined {
  return userCache[userId] ?? USERS[userId];
}

export async function getSmartReplies(): Promise<SmartReply[]> {
  await delay(40);
  return SMART_REPLIES;
}

/**
 * Poll for new messages when using the API; mock is a no-op.
 */
export function subscribeToMessages(
  chatId: string,
  onMessage: (m: Message) => void,
): () => void {
  if (!isApiConfigured) return () => {};

  let cancelled = false;
  let latest: string | undefined;

  const tick = async () => {
    if (cancelled) return;
    try {
      const messages = await listMessages(chatId, latest);
      for (const m of messages) {
        latest = m.createdAt;
        onMessage(m);
      }
    } catch {
      // ignore transient poll errors
    }
  };

  // Seed latest from a full load first so we only emit new ones.
  listMessages(chatId)
    .then((all) => {
      if (all.length) latest = all[all.length - 1].createdAt;
    })
    .finally(() => {
      if (!cancelled) {
        void tick();
      }
    });

  const timer = setInterval(tick, 2500);
  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}
