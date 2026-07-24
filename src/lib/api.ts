import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { User } from '@/types';

const TOKEN_KEY = 'applegram.auth.token';
const DEFAULT_PORT = 3001;

function hostFromExpo(): string | null {
  const candidates = [
    Constants.expoConfig?.hostUri,
    // Expo Go / legacy
    (Constants as any).manifest2?.extra?.expoGo?.debuggerHost,
    (Constants as any).manifest?.debuggerHost,
    Constants.expoGoConfig?.debuggerHost,
  ].filter(Boolean) as string[];

  for (const raw of candidates) {
    const host = String(raw).split(':')[0]?.trim();
    if (host && host !== '127.0.0.1') return host;
  }
  return null;
}

function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
  const expoHost = hostFromExpo();

  // Same Wi‑Fi host Expo Go already uses for Metro (most reliable on phones).
  if (expoHost && expoHost !== 'localhost') {
    return `http://${expoHost}:${DEFAULT_PORT}`;
  }

  if (envUrl) return envUrl;

  // Android emulator → host machine loopback
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
}

export const API_URL = resolveApiUrl();
export const isApiConfigured = Boolean(API_URL);

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

type ApiErrorBody = { error?: string };

export async function api<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error('API URL is not configured. Set EXPO_PUBLIC_API_URL in .env');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.auth !== false) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot reach API at ${API_URL}. Keep "npm run server" running, same Wi‑Fi as this phone, and allow port ${DEFAULT_PORT} in Windows Firewall.`,
    );
  }

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { error: text || res.statusText };
  }

  if (!res.ok) {
    const err = (body as ApiErrorBody)?.error || `Request failed (${res.status})`;
    throw new Error(err);
  }

  return body as T;
}

export type AuthResponse = { user: User; token: string };
