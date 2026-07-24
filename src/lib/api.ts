import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

const TOKEN_KEY = 'applegram.auth.token';

const rawUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
export const API_URL = rawUrl && !rawUrl.includes('YOUR_') ? rawUrl.replace(/\/$/, '') : '';
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

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

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
