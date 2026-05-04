let accessToken: string | null = null;
let refreshToken: string | null = null;

export const tokenStorage = {
    async getAccessToken() {
        return accessToken;
    },

    async getRefreshToken() {
        return refreshToken;
    },

    async setTokens(tokens: { accessToken: string; refreshToken?: string }) {
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken ?? null;
    },

    async clearTokens() {
        accessToken = null;
        refreshToken = null;
    },
};