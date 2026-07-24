import { api, AuthResponse, isApiConfigured, setToken } from '@/lib/api';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { User } from '@/types';

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  last_seen: string | null;
  is_bot: boolean;
  is_premium: boolean;
};

export function mapProfile(row: ProfileRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    lastSeen: row.last_seen ?? undefined,
    isBot: row.is_bot,
    isPremium: row.is_premium,
  };
}

function usernameFromEmail(email: string): string {
  const base = email.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]+/g, '_') || 'user';
  return base.slice(0, 24);
}

/** Prefer Neon API; fall back to Supabase if configured. */
export async function fetchCurrentProfile(): Promise<User | null> {
  if (isApiConfigured) {
    try {
      const data = await api<{ user: User }>('/auth/me');
      return data.user;
    } catch {
      await setToken(null);
      return null;
    }
  }

  if (!isSupabaseConfigured || !supabase) return null;

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  const authUser = authData.user;
  if (!authUser) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (error) throw error;
  if (data) return mapProfile(data as ProfileRow);

  return ensureSupabaseProfile({
    id: authUser.id,
    email: authUser.email,
    phone: authUser.phone,
    displayName:
      authUser.user_metadata?.display_name ??
      authUser.email?.split('@')[0] ??
      'User',
    username:
      authUser.user_metadata?.username ??
      usernameFromEmail(authUser.email ?? `user_${authUser.id.slice(0, 6)}`),
  });
}

async function ensureSupabaseProfile(input: {
  id: string;
  username: string;
  displayName: string;
  email?: string | null;
  phone?: string | null;
}): Promise<User> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: input.id,
        username: input.username,
        display_name: input.displayName,
        email: input.email ?? null,
        phone: input.phone ?? null,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();

  if (error) throw error;
  return mapProfile(data as ProfileRow);
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  displayName: string;
}): Promise<{ needsEmailConfirmation: boolean; user: User | null }> {
  if (isApiConfigured) {
    const data = await api<AuthResponse>('/auth/signup', {
      method: 'POST',
      auth: false,
      body: JSON.stringify(input),
    });
    await setToken(data.token);
    return { needsEmailConfirmation: false, user: data.user };
  }

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('No backend configured. Set EXPO_PUBLIC_API_URL (Neon API) in .env.');
  }

  const email = input.email.trim().toLowerCase();
  const displayName = input.displayName.trim();
  const username = usernameFromEmail(email);

  if (!email.includes('@')) throw new Error('Enter a valid email address.');
  if (input.password.length < 6) throw new Error('Password must be at least 6 characters.');
  if (displayName.length < 2) throw new Error('Enter a display name (2+ characters).');

  const { data, error } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: { data: { display_name: displayName, username } },
  });
  if (error) throw error;

  if (!data.session || !data.user) {
    return { needsEmailConfirmation: true, user: null };
  }

  const user = await ensureSupabaseProfile({
    id: data.user.id,
    username,
    displayName,
    email,
  });
  return { needsEmailConfirmation: false, user };
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  if (isApiConfigured) {
    const data = await api<AuthResponse>('/auth/signin', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    await setToken(data.token);
    return data.user;
  }

  if (!isSupabaseConfigured || !supabase) {
    throw new Error('No backend configured. Set EXPO_PUBLIC_API_URL (Neon API) in .env.');
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;

  const user = await fetchCurrentProfile();
  if (!user) throw new Error('Signed in, but no profile was found.');
  return user;
}

export async function signOutRemote(): Promise<void> {
  await setToken(null);
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
}
