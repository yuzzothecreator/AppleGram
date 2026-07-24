-- ============================================================================
-- Applegram — Neon PostgreSQL schema
-- Apply with: npm run db:migrate  (from repo root)
-- ============================================================================

create extension if not exists "pgcrypto";

do $$ begin
  create type chat_type as enum ('direct','group','channel','secret','ai','bot');
exception when duplicate_object then null; end $$;

do $$ begin
  create type member_role as enum ('owner','admin','member','subscriber');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_kind as enum ('text','image','video','file','voice','system','product');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_status as enum ('sending','sent','delivered','seen','failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- PROFILES  (owns email/password auth — no Supabase auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id             uuid primary key default gen_random_uuid(),
  username       text unique not null,
  display_name   text not null,
  phone          text,
  email          text unique,
  password_hash  text,
  avatar_url     text,
  bio            text,
  is_bot         boolean not null default false,
  is_premium     boolean not null default false,
  last_seen      timestamptz default now(),
  created_at     timestamptz not null default now()
);

create index if not exists idx_profiles_email on profiles (email);

-- ---------------------------------------------------------------------------
-- CHATS
-- ---------------------------------------------------------------------------
create table if not exists chats (
  id                    uuid primary key default gen_random_uuid(),
  type                  chat_type not null,
  title                 text,
  avatar_url            text,
  created_by            uuid references profiles(id) on delete set null,
  is_encrypted          boolean not null default false,
  self_destruct_seconds int,
  subscriber_count      int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CHAT MEMBERS
-- ---------------------------------------------------------------------------
create table if not exists chat_members (
  chat_id    uuid references chats(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  role       member_role not null default 'member',
  joined_at  timestamptz not null default now(),
  muted      boolean not null default false,
  pinned     boolean not null default false,
  primary key (chat_id, user_id)
);
create index if not exists idx_chat_members_user on chat_members(user_id);

-- ---------------------------------------------------------------------------
-- MESSAGES
-- ---------------------------------------------------------------------------
create table if not exists messages (
  id                    uuid primary key default gen_random_uuid(),
  chat_id               uuid not null references chats(id) on delete cascade,
  sender_id             uuid references profiles(id) on delete set null,
  kind                  message_kind not null default 'text',
  body                  text,
  status                message_status not null default 'sent',
  reply_to_id           uuid references messages(id) on delete set null,
  encrypted             boolean not null default false,
  self_destruct_seconds int,
  expires_at            timestamptz,
  edited_at             timestamptz,
  created_at            timestamptz not null default now()
);
create index if not exists idx_messages_chat_created on messages(chat_id, created_at desc);

-- ---------------------------------------------------------------------------
-- ATTACHMENTS
-- ---------------------------------------------------------------------------
create table if not exists attachments (
  id             uuid primary key default gen_random_uuid(),
  message_id     uuid not null references messages(id) on delete cascade,
  kind           message_kind not null,
  storage_path   text not null,
  thumbnail_path text,
  file_name      text,
  mime_type      text,
  size_bytes     bigint,
  duration_ms    int,
  width          int,
  height         int,
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- READ RECEIPTS
-- ---------------------------------------------------------------------------
create table if not exists message_receipts (
  message_id  uuid references messages(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  status      message_status not null,
  at          timestamptz not null default now(),
  primary key (message_id, user_id)
);

-- ---------------------------------------------------------------------------
-- MARKETPLACE
-- ---------------------------------------------------------------------------
create table if not exists products (
  id           uuid primary key default gen_random_uuid(),
  seller_id    uuid not null references profiles(id) on delete cascade,
  title        text not null,
  description  text,
  price_cents  int not null,
  currency     text not null default 'USD',
  image_url    text,
  created_at   timestamptz not null default now()
);

create table if not exists subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  channel_id         uuid references chats(id) on delete cascade,
  subscriber_id      uuid references profiles(id) on delete cascade,
  status             text not null default 'active',
  provider           text,
  external_id        text,
  current_period_end timestamptz,
  created_at         timestamptz not null default now()
);

-- Keep chats.updated_at fresh when messages arrive
create or replace function bump_chat_updated_at() returns trigger as $$
begin
  update chats set updated_at = now() where id = new.chat_id;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_bump_chat on messages;
create trigger trg_bump_chat after insert on messages
  for each row execute function bump_chat_updated_at();
