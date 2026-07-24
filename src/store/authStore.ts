import { CURRENT_USER } from '@/data/mockData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  fetchCurrentProfile,
  signInWithEmail as signInWithEmailService,
  signUpWithEmail as signUpWithEmailService,
} from '@/services/authService';
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
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;

  signOut: () => Promise<void>;
}

const ONBOARD_KEY = 'applegram.onboarding.done';
const SESSION_KEY = 'applegram.mock.session';

export const useAuthStore = create<AuthState>((set) => ({
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
      try {
        user = await fetchCurrentProfile();
      } catch {
        user = null;
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
      return;
    }
    // Mock: pretend an SMS with code 123456 was sent.
  },

  verifyOtp: async (phone: string, code: string) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms',
      });
      if (error) throw error;
      const user = await fetchCurrentProfile();
      set({ user });
      return;
    }
    if (code !== '123456') throw new Error('Invalid code. (Demo code is 123456)');
    await AsyncStorage.setItem(SESSION_KEY, '1');
    set({ user: { ...CURRENT_USER, phone } });
  },

  signInWithEmail: async (email: string, password: string) => {
    if (isSupabaseConfigured && supabase) {
      const user = await signInWithEmailService(email, password);
      set({ user });
      return;
    }
    if (!email.includes('@') || password.length < 4) {
      throw new Error('Enter a valid email and a password of 4+ characters.');
    }
    await AsyncStorage.setItem(SESSION_KEY, '1');
    set({ user: { ...CURRENT_USER, email } });
  },

  signUpWithEmail: async (email, password, displayName) => {
    if (isSupabaseConfigured && supabase) {
      const result = await signUpWithEmailService({ email, password, displayName });
      if (result.user) set({ user: result.user });
      return { needsEmailConfirmation: result.needsEmailConfirmation };
    }

    // Mock signup
    if (!email.includes('@') || password.length < 4) {
      throw new Error('Enter a valid email and a password of 4+ characters.');
    }
    if (displayName.trim().length < 2) {
      throw new Error('Enter a display name (2+ characters).');
    }
    await AsyncStorage.setItem(SESSION_KEY, '1');
    set({
      user: {
        ...CURRENT_USER,
        email,
        displayName: displayName.trim(),
        username: email.split('@')[0] ?? 'user',
      },
    });
    return { needsEmailConfirmation: false };
  },

  signOut: async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    await AsyncStorage.removeItem(SESSION_KEY);
    set({ user: null });
  },
}));
