-- Unread tracking: when the member last opened/read the chat
alter table chat_members
  add column if not exists last_read_at timestamptz not null default now();
