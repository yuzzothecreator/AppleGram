# Teleprompt — Security & Data Protection

## 1. Authentication
- **Providers:** phone OTP (SMS) and email/password via Supabase GoTrue.
- **Tokens:** short-lived JWT access token + rotating refresh token, stored by
  the Supabase client. On native, persist via `expo-secure-store` (Keychain /
  Keystore) rather than plain AsyncStorage for sensitive material.
- **Session bootstrap:** `authStore.init()` restores the session on launch and
  the root `AuthGate` blocks protected routes until resolved.
- **JWT claims** drive Row Level Security (`auth.uid()`), so the database itself
  enforces access — not just the client.

## 2. Authorization (defense in depth)
- **Row Level Security** on every table (see `supabase/schema.sql`).
  - Messages/attachments readable only by chat members (`is_chat_member`).
  - Profiles editable only by their owner.
  - Products writable only by their seller; subscriptions readable only by owner.
- Never trust the client: all writes are re-validated by RLS `WITH CHECK`.

## 3. End-to-end encryption (MVP concept)
For **secret chats**:
1. Each device generates an X25519 keypair; public keys exchanged via the
   server, private keys stored in SecureStore and never uploaded.
2. Derive a shared secret (ECDH) → symmetric key (HKDF).
3. Encrypt message bodies client-side with XChaCha20-Poly1305 (libsodium).
   The server stores **ciphertext only** in `messages.body` (`encrypted = true`).
4. Self-destruct: `expires_at` enforced by a scheduled job/Edge Function that
   deletes expired rows; the client also hides them past the timer.

> The server can never read secret-chat content. Group E2EE (sender keys) is a
> later milestone; regular chats use transport encryption + RLS.

## 4. Transport & API security
- All traffic over **HTTPS/WSS**; certificate pinning recommended for release.
- The **anon key** is public by design (gated by RLS). The **service-role key**
  is never shipped — used only in Edge Functions / backend.
- Third-party secrets (OpenAI, Stripe) live **only** in Edge Functions; the app
  calls your function, never the provider directly.

## 5. Data protection
- **At rest:** Postgres encryption (managed by Supabase); private Storage
  buckets with signed, expiring URLs for media.
- **In transit:** TLS everywhere.
- **PII minimization:** store only what's needed; allow account + data deletion.
- **Rate limiting & abuse:** throttle OTP requests and message sends (Edge
  Function / gateway); add CAPTCHA on repeated failures.
- **Audit:** keep an append-only log for admin/moderation actions.

## 6. Client hardening checklist
- [ ] Move tokens/keys to `expo-secure-store`
- [ ] Enable certificate pinning in production builds
- [ ] Obfuscate/strip logs in release (no message bodies in logs)
- [ ] Biometric app-lock (`expo-local-authentication`) for secret chats
- [ ] Screenshot protection on secret chats (FLAG_SECURE / blur on background)
- [ ] Validate + sanitize all user content before render
