import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { API_BASE_URL, API_MODE } from '@/src/services/config/env';
import { mockBaseQuery } from './mockBaseQuery';

export const baseApi = createApi({
    reducerPath: 'api',
    baseQuery:
        API_MODE === 'mock'
            ? mockBaseQuery()
            : fetchBaseQuery({
                baseUrl: API_BASE_URL,
            }),
    tagTypes: [
        'Auth',
        'Game',
        'Tailgate',
        'Menu',
        'Surplus',
        'Claim',
        'DonationCenter',
        'Donation',
        'Impact',
        'Rating',
    ],
    endpoints: () => ({}),
});