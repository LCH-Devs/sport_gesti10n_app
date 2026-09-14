import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { LoginResponse } from './api';

const TOKEN_KEY = 'clubapp.access_token';
const SESSION_KEY = 'clubapp.session';

type StoredSession = Omit<LoginResponse, 'access_token'>;

/** El token va en SecureStore (Keychain/Keystore); el resto de la sesión (sin datos sensibles) en AsyncStorage. */
export async function saveSession(session: LoginResponse) {
  const { access_token, ...rest } = session;
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, access_token),
    AsyncStorage.setItem(SESSION_KEY, JSON.stringify(rest)),
  ]);
}

export async function loadSession(): Promise<LoginResponse | null> {
  const [token, rawRest] = await Promise.all([
    SecureStore.getItemAsync(TOKEN_KEY),
    AsyncStorage.getItem(SESSION_KEY),
  ]);
  if (!token || !rawRest) return null;
  try {
    const rest = JSON.parse(rawRest) as StoredSession;
    return { ...rest, access_token: token };
  } catch {
    return null;
  }
}

export async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    AsyncStorage.removeItem(SESSION_KEY),
  ]);
}
