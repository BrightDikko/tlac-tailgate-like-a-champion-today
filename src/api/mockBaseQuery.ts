import type { BaseQueryFn } from '@reduxjs/toolkit/query';

import type { ApiError } from '@/src/types';

type MockRequest = {
    url: string;
    method?: string;
    body?: unknown;
    params?: Record<string, unknown>;
};

export function mockBaseQuery(): BaseQueryFn<MockRequest, unknown, ApiError> {
    return async () => ({
        error: {
            message: 'Mock endpoint is not implemented yet.',
            code: 'MOCK_ENDPOINT_NOT_IMPLEMENTED',
        },
    });
}