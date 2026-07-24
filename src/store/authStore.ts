import { CURRENT_USER } from '@/data/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { User } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  initializing: boolean;
  onboardingDone: boolean;

  init: () => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // Phone OTP flow
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;

  // Email flow
  signInWithEmail: (email: string, password: string) => Promise<void>;

  signOut: () => Promise<void>;
}

const ONBOARD_KEY = 'teleprompt.onboarding.done';
const SESSION_KEY = 'teleprompt.mock.session';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initializing: true,
  onboardingDone: false,

  init: async () => {
    const [onboard, mockSession] = await Promise.all([
      AsyncStorage.getItem(ONBOARD_KEY),
      AsyncStorage.getItem(SESSION_KEY),
    ]);

    let user: User | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        user = {
          id: data.user.id,
          username: data.user.user_metadata?.username ?? 'user',
          displayName: data.user.user_metadata?.display_name ?? 'User',
          email: data.user.email ?? undefined,
          phone: data.user.phone ?? undefined,
        };
      }
    } else if (mockSession) {
      user = CURRENT_USER;
    }

    set({ user, onboardingDone: onboard === 'true', initializing: false });
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARD_KEY, 'true');
    set({ onboardingDone: true });
  },

  requestOtp: async (phone: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
    }
    // Mock: pretend an SMS with code 123456 was sent.
  },

  verifyOtp: async (phone: string, code: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' });
      if (error) throw error;
      await get().init();
      return;
    }
    if (code !== '123456') throw new Error('Invalid code. (Demo code is 123456)');
    await AsyncStorage.setItem(SESSION_KEY, '1');
    set({ user: { ...CURRENT_USER, phone } });
  },

  signInWithEmail: async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await get().init();
      return;
    }
    if (!email.includes('@') || password.length < 4) {
      throw new Error('Enter a valid email and a password of 4+ characters.');
    }
    await AsyncStorage.setItem(SESSION_KEY, '1');
    set({ user: { ...CURRENT_USER, email } });
  },

  signOut: async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    await AsyncStorage.removeItem(SESSION_KEY);
    set({ user: null });
  },
}));
