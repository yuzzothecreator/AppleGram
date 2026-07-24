-- ============================================================================
-- Teleprompt — Supabase schema (PostgreSQL)
-- Run in the Supabase SQL editor. Designed to scale toward a self-hosted
-- Node.js + PostgreSQL backend later (same tables, same indexes).
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------------
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
-- PROFILES  (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique not null,
  display_name  text not null,
  phone         text,
  email         text,
  avatar_url    text,
  bio           text,
  is_bot        boolean not null default false,
  is_premium    boolean not null default false,
  last_seen     timestamptz default now(),
  created_at    timestamptz not null default now()
);

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
  body                  text,                 -- plaintext OR ciphertext for E2EE
  status                message_status not null default 'sent',
  reply_to_id           uuid references messages(id) on delete set null,
  encrypted             boolean not null default false,
  self_destruct_seconds int,
  expires_at            timestamptz,          -- set for self-destruct messages
  edited_at             timestamptz,
  created_at            timestamptz not null default now()
);
create index if not exists idx_messages_chat_created on messages(chat_id, created_at desc);
-- Full-text search across message bodies.
create index if not exists idx_messages_fts on messages using gin (to_tsvector('simple', coalesce(body,'')));

-- ---------------------------------------------------------------------------
-- ATTACHMENTS (media / files / voice notes; stored in Supabase Storage)
-- ---------------------------------------------------------------------------
create table if not exists attachments (
  id            uuid primary key default gen_random_uuid(),
  message_id    uuid not null references messages(id) on delete cascade,
  kind          message_kind not null,
  storage_path  text not null,                -- bucket path, signed on read
  thumbnail_path text,
  file_name     text,
  mime_type     text,
  size_bytes    bigint,
  duration_ms   int,
  width         int,
  height        int,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- READ RECEIPTS (per-user delivered/seen state)
-- ---------------------------------------------------------------------------
create table if not exists message_receipts (
  message_id  uuid references messages(id) on delete cascade,
  user_id     uuid references profiles(id) on delete cascade,
  status      message_status not null,
  at          timestamptz not null default now(),
  primary key (message_id, user_id)
);

-- ---------------------------------------------------------------------------
-- MARKETPLACE / MONETIZATION
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
  id            uuid primary key default gen_random_uuid(),
  channel_id    uuid references chats(id) on delete cascade,
  subscriber_id uuid references profiles(id) on delete cascade,
  status        text not null default 'active', -- active | canceled | past_due
  provider      text,                            -- stripe | azampay | mpesa
  external_id   text,
  current_period_end timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- KEEP updated_at FRESH ON CHATS WHEN A MESSAGE ARRIVES
-- ---------------------------------------------------------------------------
create or replace function bump_chat_updated_at() returns trigger as $$
begin
  update chats set updated_at = now() where id = new.chat_id;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_bump_chat on messages;
create trigger trg_bump_chat after insert on messages
  for each row execute function bump_chat_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table profiles       enable row level security;
alter table chats          enable row level security;
alter table chat_members   enable row level security;
alter table messages       enable row level security;
alter table attachments    enable row level security;
alter table message_receipts enable row level security;
alter table products       enable row level security;
alter table subscriptions  enable row level security;

-- Helper: is the current user a member of a chat?
create or replace function is_chat_member(target uuid) returns boolean as $$
  select exists (
    select 1 from chat_members m
    where m.chat_id = target and m.user_id = auth.uid()
  );
$$ language sql security definer stable;

-- Profiles: anyone authenticated can read; you can only edit your own.
drop policy if exists "profiles read" on profiles;
create policy "profiles read" on profiles for select to authenticated using (true);
drop policy if exists "profiles update self" on profiles;
create policy "profiles update self" on profiles for update to authenticated using (id = auth.uid());
drop policy if exists "profiles insert self" on profiles;
create policy "profiles insert self" on profiles for insert to authenticated with check (id = auth.uid());

-- Chats: visible to members (channels can be made public separately).
drop policy if exists "chats member read" on chats;
create policy "chats member read" on chats for select to authenticated using (is_chat_member(id));
drop policy if exists "chats insert" on chats;
create policy "chats insert" on chats for insert to authenticated with check (created_by = auth.uid());

-- Chat members: a member can see the member list of their chats.
drop policy if exists "members read" on chat_members;
create policy "members read" on chat_members for select to authenticated using (is_chat_member(chat_id));

-- Messages: only chat members can read/insert; sender owns the message.
drop policy if exists "messages read" on messages;
create policy "messages read" on messages for select to authenticated using (is_chat_member(chat_id));
drop policy if exists "messages insert" on messages;
create policy "messages insert" on messages for insert to authenticated
  with check (sender_id = auth.uid() and is_chat_member(chat_id));
drop policy if exists "messages update own" on messages;
create policy "messages update own" on messages for update to authenticated using (sender_id = auth.uid());

-- Attachments follow their parent message's chat membership.
drop policy if exists "attachments read" on attachments;
create policy "attachments read" on attachments for select to authenticated using (
  exists (select 1 from messages msg where msg.id = message_id and is_chat_member(msg.chat_id))
);

-- Products: public read, seller writes.
drop policy if exists "products read" on products;
create policy "products read" on products for select to authenticated using (true);
drop policy if exists "products write" on products;
create policy "products write" on products for all to authenticated
  using (seller_id = auth.uid()) with check (seller_id = auth.uid());

-- Subscriptions: a user sees their own subscriptions.
drop policy if exists "subs read" on subscriptions;
create policy "subs read" on subscriptions for select to authenticated using (subscriber_id = auth.uid());

-- ============================================================================
-- REALTIME: add tables to the supabase_realtime publication
-- ============================================================================
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table message_receipts;
alter publication supabase_realtime add table chat_members;
