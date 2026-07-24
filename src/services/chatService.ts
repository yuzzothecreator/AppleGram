import { CHATS, MESSAGES, SMART_REPLIES, USERS } from '@/data/mockData';
import { API_URL, api, getToken, isApiConfigured } from '@/lib/api';
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

export async function updateChatPrefs(
  chatId: string,
  prefs: { pinned?: boolean; muted?: boolean },
): Promise<Chat> {
  if (!isApiConfigured) throw new Error('API required');
  const data = await api<{ chat: Chat }>(`/chats/${chatId}`, {
    method: 'PATCH',
    body: JSON.stringify(prefs),
  });
  return data.chat;
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

export async function sendImageMessage(input: {
  chatId: string;
  uri: string;
  mimeType?: string;
  fileName?: string;
  text?: string;
  replyToId?: string;
}): Promise<Message> {
  if (!isApiConfigured) throw new Error('API required for images');

  const token = await getToken();
  const form = new FormData();
  form.append('image', {
    uri: input.uri,
    name: input.fileName || 'photo.jpg',
    type: input.mimeType || 'image/jpeg',
  } as any);
  if (input.text) form.append('text', input.text);
  if (input.replyToId) form.append('replyToId', input.replyToId);

  const res = await fetch(`${API_URL}/chats/${input.chatId}/messages/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Upload failed');
  return body.message as Message;
}

export async function deleteMessage(messageId: string): Promise<void> {
  if (!isApiConfigured) throw new Error('API required');
  await api(`/messages/${messageId}`, { method: 'DELETE' });
}

export async function markChatRead(chatId: string): Promise<void> {
  if (!isApiConfigured) return;
  await api(`/chats/${chatId}/read`, { method: 'POST', body: JSON.stringify({}) });
}

export async function setTyping(chatId: string, isTyping: boolean): Promise<void> {
  if (!isApiConfigured) return;
  try {
    await api(`/chats/${chatId}/typing`, {
      method: 'POST',
      body: JSON.stringify({ isTyping }),
    });
  } catch {
    // ignore typing errors
  }
}

export async function getTyping(
  chatId: string,
): Promise<{ userId: string; displayName: string }[]> {
  if (!isApiConfigured) return [];
  try {
    const data = await api<{ typing: { userId: string; displayName: string }[] }>(
      `/chats/${chatId}/typing`,
    );
    return data.typing;
  } catch {
    return [];
  }
}

export async function listContacts(): Promise<User[]> {
  if (isApiConfigured) {
    const data = await api<{ users: User[] }>('/users/contacts');
    data.users.forEach(cacheUser);
    return data.users;
  }
  return Object.values(USERS).filter((u) => u.id !== 'u_me');
}

export async function fetchUser(userId: string): Promise<User | null> {
  if (isApiConfigured) {
    const data = await api<{ user: User }>(`/users/${userId}`);
    cacheUser(data.user);
    return data.user;
  }
  return USERS[userId] ?? null;
}

export async function updateMyProfile(input: {
  displayName?: string;
  bio?: string;
  username?: string;
}): Promise<User> {
  if (!isApiConfigured) throw new Error('API required');
  const data = await api<{ user: User }>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  cacheUser(data.user);
  return data.user;
}

export async function searchUsers(query: string): Promise<User[]> {
  if (isApiConfigured) {
    const data = await api<{ users: User[] }>(
      `/users/search?q=${encodeURIComponent(query)}`,
    );
    data.users.forEach(cacheUser);
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
      // ignore
    }
  };

  listMessages(chatId)
    .then((all) => {
      if (all.length) latest = all[all.length - 1].createdAt;
    })
    .finally(() => {
      if (!cancelled) void tick();
    });

  const timer = setInterval(tick, 2500);
  return () => {
    cancelled = true;
    clearInterval(timer);
  };
}
