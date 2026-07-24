# Teleprompt — Development Roadmap

A phase-by-phase plan from MVP to SaaS-scale. Each phase ends with a shippable
increment. ✅ = present in this scaffold, 🟡 = scaffolded/stubbed, ⬜ = to build.

---

## Phase 1 — Basic chat app (foundation)
**Goal:** auth + 1:1 text messaging end to end.

- ✅ Project scaffold (Expo Router, TS, theming, navigation guard)
- ✅ Onboarding + splash
- ✅ Phone OTP + email auth (mock + Supabase paths)
- ✅ Chat list (search, pins, unread)
- ✅ Chat screen with bubbles + status ticks
- ⬜ Wire `chatService` to live Supabase queries
- ⬜ Persist message cache to AsyncStorage
- ⬜ Profiles row created on first sign-in (DB trigger or client upsert)

**Exit criteria:** two real devices exchange messages via Supabase.

---

## Phase 2 — Media + groups
**Goal:** rich content and multi-party chats.

- 🟡 Group + channel UI (variants render today)
- ⬜ Image/video/file upload to Supabase Storage (`expo-image-picker`)
- ⬜ Signed URLs + thumbnails + upload progress
- ⬜ Voice notes (record/play with `expo-av`)
- ⬜ Group create/manage (add members, roles, admin actions)
- ⬜ Channel create + broadcast permissions

**Exit criteria:** send images/voice in a group of 3+.

---

## Phase 3 — Realtime + notifications
**Goal:** instant delivery and presence.

- ⬜ Supabase Realtime channel per chat (subscribe in `chatStore.subscribe`)
- ⬜ Delivered/seen receipts via `message_receipts`
- ⬜ Typing indicators + presence (online/last seen)
- ⬜ Push notifications (Expo Push → FCM/APNs) via Edge Function fan-out
- ⬜ Deep links from notifications into `/chat/[id]`

**Exit criteria:** background push opens the right chat; ticks update live.

---

## Phase 4 — AI + advanced features
**Goal:** the differentiators.

- 🟡 AI assistant screen (canned → real LLM via Edge Function)
- ⬜ Smart replies from real context (wired into `SmartReplies`)
- ⬜ Conversation summarization (`summarizeChat`)
- ⬜ Voice-to-text transcription (Whisper via Edge Function)
- 🟡 Secret chats UI + self-destruct timer (enforce server-side `expires_at`)
- ⬜ E2EE (libsodium / signal-style; see SECURITY.md)
- ⬜ Cloud sync + multi-device session list

**Exit criteria:** AI summary of a 50-message chat; self-destruct verified.

---

## Phase 5 — Payments + marketplace
**Goal:** monetization / SaaS.

- 🟡 Marketplace grid (static → DB-backed `products`)
- ⬜ Stripe checkout (cards) + webhook → `subscriptions`
- ⬜ AzamPay / M-Pesa mobile money for East Africa
- ⬜ Channel subscriptions + paywalled posts
- ⬜ Bot platform (webhook bots, inline commands)
- ⬜ File vault (encrypted private storage bucket)
- ⬜ Admin dashboard (Next.js web panel) + analytics (engagement, retention)

**Exit criteria:** buy a course in-chat; creator sees revenue in dashboard.

---

## Cross-cutting (every phase)
- Tests: unit (services/stores), component (RNTL), e2e (Maestro/Detox)
- CI/CD: EAS Build + EAS Update (OTA), preview builds per PR
- Observability: Sentry (crashes), PostHog (product analytics)
- Accessibility: dynamic type, screen-reader labels, contrast checks
