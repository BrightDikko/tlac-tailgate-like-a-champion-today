import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'tlac.auth.accessToken';
const REFRESH_KEY = 'tlac.auth.refreshToken';

/** In-memory fallback if SecureStore read/write fails (e.g. web or test). */
let memoryAccess: string | null = null;
let memoryRefresh: string | null = null;

async function readKey(key: string): Promise<string | null> {
  try {
    const v = await SecureStore.getItemAsync(key);
    return v;
  } catch {
    return key === ACCESS_KEY ? memoryAccess : memoryRefresh;
  }
}

async function writeKey(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
    if (key === ACCESS_KEY) memoryAccess = value;
    else memoryRefresh = value;
  } catch {
    if (key === ACCESS_KEY) memoryAccess = value;
    else memoryRefresh = value;
  }
}

async function removeKey(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* ignore */
  }
  if (key === ACCESS_KEY) memoryAccess = null;
  else memoryRefresh = null;
}

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    return readKey(ACCESS_KEY);
  },

  async getRefreshToken(): Promise<string | null> {
    return readKey(REFRESH_KEY);
  },

  async setTokens(tokens: { accessToken: string; refreshToken?: string }): Promise<void> {
    await writeKey(ACCESS_KEY, tokens.accessToken);
    if (tokens.refreshToken !== undefined && tokens.refreshToken.length > 0) {
      await writeKey(REFRESH_KEY, tokens.refreshToken);
    } else {
      await removeKey(REFRESH_KEY);
    }
  },

  async clearTokens(): Promise<void> {
    await removeKey(ACCESS_KEY);
    await removeKey(REFRESH_KEY);
  },
};
