import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

/**
 * Supabase singleton.
 *
 * Credentials are read from EXPO_PUBLIC_* env vars (see .env.example).
 * When they are missing we run in "mock mode" so the app is fully runnable
 * without a backend — see src/data/mockApi.ts.
 */

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

const looksConfigured = Boolean(
  url &&
    anonKey &&
    !url.includes('YOUR_PROJECT_REF') &&
    !anonKey.includes('YOUR_SUPABASE_ANON_KEY'),
);

export const isSupabaseConfigured = looksConfigured;

export const supabase: SupabaseClient | null = looksConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
