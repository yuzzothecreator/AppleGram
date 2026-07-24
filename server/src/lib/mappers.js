import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, '../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    lastSeen: row.last_seen ?? undefined,
    isBot: row.is_bot,
    isPremium: row.is_premium,
    isOnline: row.last_seen
      ? Date.now() - new Date(row.last_seen).getTime() < 2 * 60 * 1000
      : false,
  };
}

export function mapMessage(row, baseUrl = '') {
  const attachment = row.storage_path
    ? {
        id: row.attachment_id || row.id,
        kind: row.attach_kind || 'image',
        url: row.storage_path.startsWith('http')
          ? row.storage_path
          : `${baseUrl}/uploads/${row.storage_path}`,
        mimeType: row.mime_type ?? undefined,
        width: row.width ?? undefined,
        height: row.height ?? undefined,
      }
    : undefined;

  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    kind: row.kind,
    text: row.body ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    editedAt: row.edited_at ?? undefined,
    replyToId: row.reply_to_id ?? undefined,
    replyPreview: row.reply_body
      ? {
          id: row.reply_to_id,
          text: row.reply_body,
          senderId: row.reply_sender_id,
        }
      : undefined,
    encrypted: row.encrypted,
    selfDestructSeconds: row.self_destruct_seconds ?? undefined,
    attachment,
  };
}

export async function peerForChat(chatId, userId) {
  const { rows } = await query(
    `select p.*
     from chat_members cm
     join profiles p on p.id = cm.user_id
     where cm.chat_id = $1 and cm.user_id <> $2
     limit 1`,
    [chatId, userId],
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function mapChat(row, userId) {
  const peer = row.type === 'direct' ? await peerForChat(row.id, userId) : null;
  const title =
    row.type === 'direct' && peer ? peer.displayName : row.title || 'Chat';

  let lastMessage;
  if (row.last_message_id) {
    lastMessage = {
      id: row.last_message_id,
      chatId: row.id,
      senderId: row.last_sender_id,
      kind: row.last_kind || 'text',
      text:
        row.last_kind === 'image'
          ? 'Photo'
          : row.last_body ?? undefined,
      status: row.last_status || 'sent',
      createdAt: row.last_created_at,
    };
  }

  return {
    id: row.id,
    type: row.type,
    title,
    avatarUrl: row.avatar_url || peer?.avatarUrl,
    peerId: peer?.id,
    lastMessage,
    unreadCount: Number(row.unread_count || 0),
    pinned: Boolean(row.pinned),
    muted: Boolean(row.muted),
    isEncrypted: row.is_encrypted,
    selfDestructSeconds: row.self_destruct_seconds ?? undefined,
    subscriberCount: row.subscriber_count,
  };
}

export function requestBaseUrl(req) {
  const host = req.get('host');
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  return `${proto}://${host}`;
}

export async function assertMember(chatId, userId) {
  const membership = await query(
    `select 1 from chat_members where chat_id = $1 and user_id = $2`,
    [chatId, userId],
  );
  return membership.rows.length > 0;
}

export async function touchLastSeen(userId) {
  await query(`update profiles set last_seen = now() where id = $1`, [userId]);
}
