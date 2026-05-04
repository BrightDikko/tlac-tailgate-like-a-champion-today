import type { RootState } from '@/src/redux/store';

export const selectCurrentUser = (state: RootState) => state.auth.user;

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;

export const selectAccessToken = (state: RootState) => state.auth.accessToken;