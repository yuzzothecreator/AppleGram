import { CHATS, MESSAGES, SMART_REPLIES, USERS } from '@/data/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Chat, Message, SmartReply, User } from '@/types';

/**
 * Data access layer.
 *
 * Today it serves in-memory mock data so the UI is immediately runnable.
 * Each function shows the equivalent Supabase query in comments — swap the
 * mock branch for the real query once your project credentials are set.
 */

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export async function listChats(): Promise<Chat[]> {
  if (isSupabaseConfigured && supabase) {
    // const { data } = await supabase
    //   .from('chats')
    //   .select('*, last_message:messages(*)')
    //   .order('updated_at', { ascending: false });
    // return mapChats(data);
  }
  await delay();
  return [...CHATS].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
}

export async function getChat(chatId: string): Promise<Chat | undefined> {
  await delay(60);
  return CHATS.find((c) => c.id === chatId);
}

export async function listMessages(chatId: string): Promise<Message[]> {
  if (isSupabaseConfigured && supabase) {
    // const { data } = await supabase
    //   .from('messages')
    //   .select('*')
    //   .eq('chat_id', chatId)
    //   .order('created_at', { ascending: true });
    // return mapMessages(data);
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
  const message: Message = {
    id: `m_${Date.now()}`,
    chatId: input.chatId,
    senderId: input.senderId,
    kind: 'text',
    text: input.text,
    status: 'sending',
    createdAt: new Date().toISOString(),
    replyToId: input.replyToId,
  };

  if (isSupabaseConfigured && supabase) {
    // await supabase.from('messages').insert({ ... });
  } else {
    MESSAGES[input.chatId] = [...(MESSAGES[input.chatId] ?? []), message];
  }
  await delay(80);
  return { ...message, status: 'sent' };
}

export function getUser(userId: string): User | undefined {
  return USERS[userId];
}

export async function getSmartReplies(): Promise<SmartReply[]> {
  await delay(40);
  return SMART_REPLIES;
}

/**
 * Subscribe to new messages for a chat.
 * Returns an unsubscribe function. With Supabase this becomes a Realtime
 * channel; the mock implementation simulates an inbound reply.
 */
export function subscribeToMessages(
  chatId: string,
  onMessage: (m: Message) => void,
): () => void {
  if (isSupabaseConfigured && supabase) {
    // const channel = supabase
    //   .channel(`messages:${chatId}`)
    //   .on('postgres_changes',
    //     { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
    //     (payload) => onMessage(mapMessage(payload.new)))
    //   .subscribe();
    // return () => supabase.removeChannel(channel);
  }
  // Mock: no-op subscription.
  return () => {};
}
