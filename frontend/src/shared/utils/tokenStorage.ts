import type { User } from '@/shared/types';

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
} as const;

export const tokenStorage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
  },

  setAccessToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, token);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, token);
  },

  getUser: (): User | null => {
    const userJson = localStorage.getItem(TOKEN_KEYS.USER);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson) as User;
    } catch {
      return null;
    }
  },

  setUser: (user: User): void => {
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(user));
  },

  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.USER);
  },

  hasTokens: (): boolean => {
    return !!(
      localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN) &&
      localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN)
    );
  },
};

