# Teleprompt

A modern, Telegram-inspired messaging app built with **React Native + Expo Router + TypeScript**, with **Supabase** as the MVP backend (Postgres + Realtime + Auth + Storage) and a clear path to a self-hosted **Node.js + PostgreSQL** stack at scale.

This repository is a **runnable MVP foundation**: it boots immediately with in-memory mock data (no backend required) and is wired so you can switch to real Supabase queries by adding credentials.

---

## Quick start

```bash
npm install
npm start            # then press i (iOS), a (Android), or w (web)
```

The app runs in **mock mode** out of the box:

- Sign in with any phone number; the demo OTP code is **`123456`**.
- Or use the **Email** tab with any email + a 4+ character password.

To connect a real backend, copy `.env.example` to `.env` and fill in your Supabase URL + anon key, then run the SQL in [`supabase/schema.sql`](supabase/schema.sql).

---

## What's implemented

| Area | Status |
| --- | --- |
| Splash, onboarding carousel | ✅ |
| Auth: phone OTP + email (mock + Supabase paths) | ✅ |
| Auth gating / navigation guard | ✅ |
| Chat list with search, pins, unread badges | ✅ |
| Chat screen: bubbles, status ticks, smart replies, reply context | ✅ |
| Group / channel / secret / bot chat variants | ✅ (UI) |
| AI assistant screen (canned responses, swappable for real LLM) | ✅ |
| Marketplace grid | ✅ (UI) |
| Profile + Settings with dark/light toggle | ✅ |
| Theme system (Telegram-style dark + light) | ✅ |
| Supabase schema + RLS + Realtime publication | ✅ |
| Reanimated bubble/FAB animations | ✅ |
| Media upload, voice notes, push, payments | 🟡 scaffolded / documented (see ROADMAP) |

---

## Folder structure

```
teleprompt/
├─ app/                      # Expo Router (file-based routes)
│  ├─ _layout.tsx            # Root: providers + auth gate + Stack
│  ├─ index.tsx              # Splash
│  ├─ onboarding.tsx
│  ├─ (auth)/
│  │  ├─ login.tsx           # Phone + Email tabs
│  │  └─ otp.tsx             # 6-digit code entry
│  ├─ (tabs)/
│  │  ├─ _layout.tsx         # Bottom tabs
│  │  ├─ index.tsx           # Chats home
│  │  ├─ marketplace.tsx
│  │  ├─ ai.tsx              # AI assistant
│  │  └─ settings.tsx
│  ├─ chat/[id].tsx          # Conversation screen
│  └─ profile/[id].tsx       # User profile (modal)
├─ src/
│  ├─ components/            # Avatar, ChatBubble, ChatListItem, MessageInput, …
│  ├─ services/              # chatService, aiService (mock ⇄ Supabase)
│  ├─ store/                 # Zustand: authStore, chatStore
│  ├─ theme/                 # colors + ThemeContext (dark/light/system)
│  ├─ types/                 # Domain models (mirror the DB schema)
│  ├─ data/                  # Mock data for offline-first dev
│  ├─ lib/                   # supabase client singleton
│  └─ utils/                 # formatting helpers
├─ supabase/schema.sql       # Postgres schema + RLS + Realtime
├─ ARCHITECTURE.md           # System design + diagrams
├─ ROADMAP.md                # Phase-by-phase plan
└─ SECURITY.md               # Auth, E2EE, data protection
```

See [`ARCHITECTURE.md`](ARCHITECTURE.md), [`ROADMAP.md`](ROADMAP.md), and [`SECURITY.md`](SECURITY.md) for the full design.

---

## Switching from mock mode to Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
3. Enable **Phone** and **Email** providers under Authentication.
4. Create a Storage bucket named `media` (private).
5. Add credentials to `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```
6. In `src/services/chatService.ts`, uncomment the Supabase query branches (the equivalent query is written next to each mock implementation).

The data layer is intentionally isolated so the UI never changes when you flip backends.

---

## Tech stack

- **React Native 0.81 / Expo SDK 54** (React 19), new architecture enabled
- **Expo Router v4** (typed routes, file-based navigation)
- **TypeScript** (strict)
- **Zustand** for state, **AsyncStorage** for persistence
- **React Native Reanimated** for animations
- **Supabase JS** (Auth, Postgres, Realtime, Storage)
- **@expo/vector-icons** (Ionicons)
