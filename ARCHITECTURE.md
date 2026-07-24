# Teleprompt — Architecture

## 1. High-level system

```
┌──────────────────────────────────────────────────────────────────┐
│                      MOBILE CLIENT (Expo / RN)                     │
│                                                                    │
│  UI (Expo Router screens)                                          │
│      │                                                             │
│  Zustand stores (auth, chat)  ── optimistic updates, caching       │
│      │                                                             │
│  Service layer (chatService, aiService)  ◄── single swap point     │
│      │                                                             │
│  ┌───────────────┐     ┌────────────────┐    ┌──────────────────┐ │
│  │ Supabase JS   │     │ AsyncStorage    │    │ SecureStore      │ │
│  │ (auth/db/rt)  │     │ (offline cache) │    │ (keys/tokens)    │ │
│  └──────┬────────┘     └────────────────┘    └──────────────────┘ │
└─────────┼──────────────────────────────────────────────────────────┘
          │ HTTPS + WSS
          ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SUPABASE (MVP backend)                      │
│                                                                    │
│  GoTrue Auth  │  PostgREST  │  Realtime (WS)  │  Storage  │ Edge   │
│  (OTP+email)  │  (REST/RLS) │  (pg changes)   │  (media)  │ Funcs  │
│        │             │             │              │          │      │
│        └─────────────┴─────────────┴──────────────┴──────────┘      │
│                         PostgreSQL (RLS)                            │
│                                                                    │
│  Edge Functions: AI proxy, push fan-out, payment webhooks          │
└──────────────────────────────────────────────────────────────────┘
          │
          ├── OpenAI / LLM (via Edge Function, key stays server-side)
          ├── Expo Push / FCM / APNs
          └── Stripe / AzamPay / M-Pesa (webhooks)
```

At scale, the Supabase block is replaced by your own services without touching
the UI — only the **service layer** changes.

```
        ┌── API Gateway (REST + GraphQL) ── Node.js (NestJS/Fastify)
Client ─┤── WebSocket gateway (Socket.IO / uWebSockets) ── Redis pub/sub
        └── Media CDN (S3 + CloudFront)
                         │
        PostgreSQL (primary + read replicas) + Redis + Kafka/NATS
```

## 2. Realtime messaging flow

```
Sender                     Backend                    Recipient
  │  insert message          │                            │
  ├─ optimistic add (UI) ───►│                            │
  │  status: sending         │                            │
  │                          ├─ persist (status: sent) ──►│  realtime INSERT
  │  ◄── ack (status: sent) ─┤                            ├─ render bubble
  │                          │  ◄── receipt: delivered ───┤
  │  ◄── status: delivered ──┤                            │
  │                          │  ◄── receipt: seen ────────┤ (on view)
  │  ◄── status: seen ───────┤                            │
```

- **Optimistic UI**: `chatStore.send()` immediately appends a `sending` bubble,
  then reconciles with the server row by temp id.
- **Delivery/seen**: tracked in `message_receipts`; the sender subscribes to
  receipt changes for their messages.
- **Transport**: Supabase Realtime (Postgres logical replication over WebSocket).
  At scale, swap for a dedicated WS gateway backed by Redis pub/sub.

## 3. Data model (see `supabase/schema.sql`)

```
profiles ─1───*─ chat_members *───1─ chats ─1───*─ messages ─1───*─ attachments
   │                                   │                │
   └── products (seller)               │                └── message_receipts
                                        └── subscriptions (channel monetization)
```

Key indexes: `messages(chat_id, created_at desc)` for pagination, a GIN
full-text index on `messages.body` for search, and `chat_members(user_id)`
for "my chats".

## 4. State management

| Store | Responsibility |
| --- | --- |
| `authStore` | session bootstrap, OTP/email flows, onboarding flag, sign out |
| `chatStore` | chat list, per-chat message cache, optimistic send, realtime receive |

Stores call the **service layer**, never Supabase directly, so business logic
and transport are decoupled and unit-testable.

## 5. Offline-first caching

- Messages and chats are cached per-chat in the store; persist to AsyncStorage
  for cold starts (and SQLite/MMKV for larger histories at scale).
- Outbox pattern: queue unsent messages (`status: sending`) and flush on
  reconnect; reconcile by client-generated temp id.

## 6. AI subsystem

```
Client ──► Edge Function (/ai) ──► LLM provider
  ▲                                   │
  └────────── streamed reply ─────────┘
```

The OpenAI/LLM key **must** live in the Edge Function, never the bundle.
`aiService.ts` is the single client entry point (smart replies, summarize,
transcribe). Today it returns canned responses; point it at your function URL
to go live.

## 7. Navigation map

```
/                         splash (redirects)
/onboarding               first-run carousel
/(auth)/login             phone | email
/(auth)/otp               6-digit verify
/(tabs)
  ├─ index                chats
  ├─ marketplace
  ├─ ai
  └─ settings
/chat/[id]                conversation
/profile/[id]             profile (modal)
```

The root `_layout` `AuthGate` redirects based on `{ onboardingDone, user }`.
