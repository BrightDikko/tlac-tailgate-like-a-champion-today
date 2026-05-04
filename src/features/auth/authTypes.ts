import type { CurrentUser } from '@/src/types';

export type AuthState = {
    user: CurrentUser | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
};