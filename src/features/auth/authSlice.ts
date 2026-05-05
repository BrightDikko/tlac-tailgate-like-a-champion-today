import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { CurrentUser } from '@/src/types';
import type { AuthState } from './authTypes';

const initialState: AuthState = {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
};

type SetCredentialsPayload = {
    user: CurrentUser;
    accessToken: string;
    refreshToken?: string;
};

type HydrateTokensPayload = {
    accessToken: string;
    refreshToken?: string | null;
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        hydrateTokens: (state, action: PayloadAction<HydrateTokensPayload>) => {
            state.accessToken = action.payload.accessToken;
            state.refreshToken =
                action.payload.refreshToken !== undefined &&
                action.payload.refreshToken !== null &&
                action.payload.refreshToken.length > 0
                    ? action.payload.refreshToken
                    : null;
            state.user = null;
            state.isAuthenticated = false;
        },
        setCredentials: (state, action: PayloadAction<SetCredentialsPayload>) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
            state.refreshToken = action.payload.refreshToken ?? null;
            state.isAuthenticated = true;
        },
        clearCredentials: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
        },
    },
});

export const { hydrateTokens, setCredentials, clearCredentials } = authSlice.actions;

export const authReducer = authSlice.reducer;