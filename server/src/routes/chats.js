import { query } from '../db.js';

function mapMessage(row) {
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
    encrypted: row.encrypted,
    selfDestructSeconds: row.self_destruct_seconds ?? undefined,
  };
}

function mapUser(row) {
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
  };
}

async function peerForChat(chatId, userId) {
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

async function mapChat(row, userId) {
  const peer = row.type === 'direct' ? await peerForChat(row.id, userId) : null;
  const title =
    row.type === 'direct' && peer
      ? peer.displayName
      : row.title || 'Chat';

  let lastMessage;
  if (row.last_message_id) {
    lastMessage = {
      id: row.last_message_id,
      chatId: row.id,
      senderId: row.last_sender_id,
      kind: row.last_kind || 'text',
      text: row.last_body ?? undefined,
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

export async function listChats(req, res) {
  try {
    const { rows } = await query(
      `select
         c.*,
         cm.muted,
         cm.pinned,
         lm.id as last_message_id,
         lm.body as last_body,
         lm.sender_id as last_sender_id,
         lm.kind as last_kind,
         lm.status as last_status,
         lm.created_at as last_created_at,
         0 as unread_count
       from chats c
       join chat_members cm on cm.chat_id = c.id and cm.user_id = $1
       left join lateral (
         select m.*
         from messages m
         where m.chat_id = c.id
         order by m.created_at desc
         limit 1
       ) lm on true
       order by cm.pinned desc, c.updated_at desc`,
      [req.userId],
    );

    const chats = [];
    for (const row of rows) {
      chats.push(await mapChat(row, req.userId));
    }
    return res.json({ chats });
  } catch (err) {
    console.error('listChats', err);
    return res.status(500).json({ error: err.message || 'Failed to load chats' });
  }
}

export async function getChat(req, res) {
  try {
    const chatId = req.params.id;
    const { rows } = await query(
      `select c.*, cm.muted, cm.pinned
       from chats c
       join chat_members cm on cm.chat_id = c.id and cm.user_id = $1
       where c.id = $2
       limit 1`,
      [req.userId, chatId],
    );
    if (!rows.length) return res.status(404).json({ error: 'Chat not found' });

    const last = await query(
      `select * from messages where chat_id = $1 order by created_at desc limit 1`,
      [chatId],
    );
    const row = {
      ...rows[0],
      last_message_id: last.rows[0]?.id,
      last_body: last.rows[0]?.body,
      last_sender_id: last.rows[0]?.sender_id,
      last_kind: last.rows[0]?.kind,
      last_status: last.rows[0]?.status,
      last_created_at: last.rows[0]?.created_at,
      unread_count: 0,
    };

    return res.json({ chat: await mapChat(row, req.userId) });
  } catch (err) {
    console.error('getChat', err);
    return res.status(500).json({ error: err.message || 'Failed to load chat' });
  }
}

export async function listMessages(req, res) {
  try {
    const chatId = req.params.id;
    const membership = await query(
      `select 1 from chat_members where chat_id = $1 and user_id = $2`,
      [chatId, req.userId],
    );
    if (!membership.rows.length) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const after = req.query.after ? String(req.query.after) : null;
    const params = [chatId];
    let sql = `select * from messages where chat_id = $1`;
    if (after) {
      params.push(after);
      sql += ` and created_at > $2`;
    }
    sql += ` order by created_at asc limit 200`;

    const { rows } = await query(sql, params);
    return res.json({ messages: rows.map(mapMessage) });
  } catch (err) {
    console.error('listMessages', err);
    return res.status(500).json({ error: err.message || 'Failed to load messages' });
  }
}

export async function sendMessage(req, res) {
  try {
    const chatId = req.params.id;
    const text = String(req.body.text || '').trim();
    const replyToId = req.body.replyToId || null;

    if (!text) return res.status(400).json({ error: 'Message text is required' });

    const membership = await query(
      `select 1 from chat_members where chat_id = $1 and user_id = $2`,
      [chatId, req.userId],
    );
    if (!membership.rows.length) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const { rows } = await query(
      `insert into messages (chat_id, sender_id, kind, body, status, reply_to_id)
       values ($1, $2, 'text', $3, 'sent', $4)
       returning *`,
      [chatId, req.userId, text, replyToId],
    );

    return res.status(201).json({ message: mapMessage(rows[0]) });
  } catch (err) {
    console.error('sendMessage', err);
    return res.status(500).json({ error: err.message || 'Failed to send message' });
  }
}

export async function searchUsers(req, res) {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 1) return res.json({ users: [] });

    const like = `%${q.toLowerCase()}%`;
    const { rows } = await query(
      `select *
       from profiles
       where id <> $1
         and (
           lower(display_name) like $2
           or lower(username) like $2
           or lower(coalesce(email, '')) like $2
         )
       order by display_name asc
       limit 30`,
      [req.userId, like],
    );
    return res.json({ users: rows.map(mapUser) });
  } catch (err) {
    console.error('searchUsers', err);
    return res.status(500).json({ error: err.message || 'Search failed' });
  }
}

export async function createDirectChat(req, res) {
  try {
    const otherUserId = String(req.body.userId || '');
    if (!otherUserId) return res.status(400).json({ error: 'userId is required' });
    if (otherUserId === req.userId) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    const other = await query(`select * from profiles where id = $1`, [otherUserId]);
    if (!other.rows.length) return res.status(404).json({ error: 'User not found' });

    const existing = await query(
      `select c.id
       from chats c
       join chat_members a on a.chat_id = c.id and a.user_id = $1
       join chat_members b on b.chat_id = c.id and b.user_id = $2
       where c.type = 'direct'
       limit 1`,
      [req.userId, otherUserId],
    );

    let chatId = existing.rows[0]?.id;
    if (!chatId) {
      const created = await query(
        `insert into chats (type, title, created_by)
         values ('direct', null, $1)
         returning id`,
        [req.userId],
      );
      chatId = created.rows[0].id;
      await query(
        `insert into chat_members (chat_id, user_id, role)
         values ($1, $2, 'owner'), ($1, $3, 'member')`,
        [chatId, req.userId, otherUserId],
      );
    }

    req.params = { id: chatId };
    return getChat(req, res);
  } catch (err) {
    console.error('createDirectChat', err);
    return res.status(500).json({ error: err.message || 'Failed to start chat' });
  }
}
