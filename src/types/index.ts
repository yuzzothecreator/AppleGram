/** Core domain models for Teleprompt. Mirrors the Supabase schema in /supabase/schema.sql */

export type ID = string;

export type ChatType = 'direct' | 'group' | 'channel' | 'secret' | 'ai' | 'bot';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';

export type MessageKind =
  | 'text'
  | 'image'
  | 'video'
  | 'file'
  | 'voice'
  | 'system'
  | 'product';

export type MemberRole = 'owner' | 'admin' | 'member' | 'subscriber';

export interface User {
  id: ID;
  username: string;
  displayName: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  lastSeen?: string; // ISO timestamp
  isOnline?: boolean;
  isBot?: boolean;
  isPremium?: boolean;
}

export interface Attachment {
  id: ID;
  kind: Exclude<MessageKind, 'text' | 'system' | 'product'>;
  url: string;
  thumbnailUrl?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  durationMs?: number; // voice / video
  width?: number;
  height?: number;
}

export interface ProductCard {
  id: ID;
  title: string;
  description?: string;
  priceCents: number;
  currency: string;
  imageUrl?: string;
  sellerId: ID;
}

export interface Message {
  id: ID;
  chatId: ID;
  senderId: ID;
  kind: MessageKind;
  text?: string;
  attachment?: Attachment;
  product?: ProductCard;
  status: MessageStatus;
  createdAt: string; // ISO timestamp
  editedAt?: string;
  replyToId?: ID;
  replyPreview?: { id: ID; text?: string; senderId?: ID };
  // E2EE / secret chats
  encrypted?: boolean;
  selfDestructSeconds?: number;
}

export interface ChatMember {
  userId: ID;
  role: MemberRole;
  joinedAt: string;
}

export interface Chat {
  id: ID;
  type: ChatType;
  title: string;
  avatarUrl?: string;
  // direct chats: the other participant; groups/channels: null
  peerId?: ID;
  members?: ChatMember[];
  lastMessage?: Message;
  unreadCount: number;
  pinned?: boolean;
  muted?: boolean;
  isEncrypted?: boolean;
  selfDestructSeconds?: number;
  subscriberCount?: number; // channels
  isSubscribed?: boolean;
}

export interface SmartReply {
  id: ID;
  text: string;
}
