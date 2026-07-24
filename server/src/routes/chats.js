import { query } from '../db.js';
import {
  assertMember,
  mapChat,
  mapMessage,
  mapUser,
  requestBaseUrl,
  touchLastSeen,
} from '../lib/mappers.js';

export async function listChats(req, res) {
  try {
    await touchLastSeen(req.userId);
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
    for (const row of rows) chats.push(await mapChat(row, req.userId));
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

export async function updateChatPrefs(req, res) {
  try {
    const chatId = req.params.id;
    if (!(await assertMember(chatId, req.userId))) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const pinned = typeof req.body.pinned === 'boolean' ? req.body.pinned : null;
    const muted = typeof req.body.muted === 'boolean' ? req.body.muted : null;

    if (pinned === null && muted === null) {
      return res.status(400).json({ error: 'Provide pinned and/or muted' });
    }

    if (pinned !== null) {
      await query(
        `update chat_members set pinned = $1 where chat_id = $2 and user_id = $3`,
        [pinned, chatId, req.userId],
      );
    }
    if (muted !== null) {
      await query(
        `update chat_members set muted = $1 where chat_id = $2 and user_id = $3`,
        [muted, chatId, req.userId],
      );
    }

    req.params = { id: chatId };
    return getChat(req, res);
  } catch (err) {
    console.error('updateChatPrefs', err);
    return res.status(500).json({ error: err.message || 'Failed to update chat' });
  }
}

export async function listMessages(req, res) {
  try {
    const chatId = req.params.id;
    if (!(await assertMember(chatId, req.userId))) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const after = req.query.after ? String(req.query.after) : null;
    const params = [chatId];
    let sql = `
      select
        m.*,
        a.id as attachment_id,
        a.storage_path,
        a.kind as attach_kind,
        a.mime_type,
        a.width,
        a.height,
        r.body as reply_body,
        r.sender_id as reply_sender_id
      from messages m
      left join attachments a on a.message_id = m.id
      left join messages r on r.id = m.reply_to_id
      where m.chat_id = $1`;
    if (after) {
      params.push(after);
      sql += ` and m.created_at > $2`;
    }
    sql += ` order by m.created_at asc limit 200`;

    const { rows } = await query(sql, params);
    const baseUrl = requestBaseUrl(req);
    return res.json({ messages: rows.map((r) => mapMessage(r, baseUrl)) });
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
    if (!(await assertMember(chatId, req.userId))) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const { rows } = await query(
      `insert into messages (chat_id, sender_id, kind, body, status, reply_to_id)
       values ($1, $2, 'text', $3, 'sent', $4)
       returning *`,
      [chatId, req.userId, text, replyToId],
    );

    await touchLastSeen(req.userId);
    return res.status(201).json({ message: mapMessage(rows[0], requestBaseUrl(req)) });
  } catch (err) {
    console.error('sendMessage', err);
    return res.status(500).json({ error: err.message || 'Failed to send message' });
  }
}

export async function sendImageMessage(req, res) {
  try {
    const chatId = req.params.id;
    const replyToId = req.body.replyToId || null;
    const caption = String(req.body.text || req.body.caption || '').trim() || null;

    if (!(await assertMember(chatId, req.userId))) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }
    if (!req.file) return res.status(400).json({ error: 'Image file is required' });

    const { rows } = await query(
      `insert into messages (chat_id, sender_id, kind, body, status, reply_to_id)
       values ($1, $2, 'image', $3, 'sent', $4)
       returning *`,
      [chatId, req.userId, caption, replyToId],
    );
    const message = rows[0];

    const attach = await query(
      `insert into attachments (message_id, kind, storage_path, mime_type, size_bytes, file_name)
       values ($1, 'image', $2, $3, $4, $5)
       returning *`,
      [
        message.id,
        req.file.filename,
        req.file.mimetype,
        req.file.size,
        req.file.originalname,
      ],
    );

    await touchLastSeen(req.userId);
    const mapped = mapMessage(
      {
        ...message,
        attachment_id: attach.rows[0].id,
        storage_path: attach.rows[0].storage_path,
        attach_kind: 'image',
        mime_type: attach.rows[0].mime_type,
      },
      requestBaseUrl(req),
    );
    return res.status(201).json({ message: mapped });
  } catch (err) {
    console.error('sendImageMessage', err);
    return res.status(500).json({ error: err.message || 'Failed to send image' });
  }
}

export async function deleteMessage(req, res) {
  try {
    const messageId = req.params.messageId;
    const found = await query(`select * from messages where id = $1`, [messageId]);
    if (!found.rows.length) return res.status(404).json({ error: 'Message not found' });

    const msg = found.rows[0];
    if (msg.sender_id !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }
    if (!(await assertMember(msg.chat_id, req.userId))) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    await query(`delete from messages where id = $1`, [messageId]);
    return res.json({ ok: true, id: messageId, chatId: msg.chat_id });
  } catch (err) {
    console.error('deleteMessage', err);
    return res.status(500).json({ error: err.message || 'Failed to delete message' });
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

export async function listContacts(req, res) {
  try {
    await touchLastSeen(req.userId);
    const { rows } = await query(
      `select *
       from profiles
       where id <> $1
       order by lower(display_name) asc
       limit 200`,
      [req.userId],
    );
    return res.json({ users: rows.map(mapUser) });
  } catch (err) {
    console.error('listContacts', err);
    return res.status(500).json({ error: err.message || 'Failed to load contacts' });
  }
}

export async function getUserProfile(req, res) {
  try {
    const { rows } = await query(`select * from profiles where id = $1 limit 1`, [
      req.params.id,
    ]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: mapUser(rows[0]) });
  } catch (err) {
    console.error('getUserProfile', err);
    return res.status(500).json({ error: err.message || 'Failed to load user' });
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
