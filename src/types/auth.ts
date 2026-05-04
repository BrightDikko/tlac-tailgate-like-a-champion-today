import type { CurrentUser, UserRole } from '@/src/types';

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
};

/** Authenticated session returned by login/register; aligns with CurrentUser + tokens. */
export type AuthSession = {
  user: CurrentUser;
  tokens: AuthTokens;
};
