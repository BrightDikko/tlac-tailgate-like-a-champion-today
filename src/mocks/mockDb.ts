import type { ClaimRecord } from '@/src/types';

import {
    currentGame,
    currentUser,
    donationCenters,
    impact,
    menuItems,
    reviews,
    surplusItems,
    tailgates,
} from '@/src/data/localData';

export const mockDb = {
    currentGame,
    currentUser,
    donationCenters: [...donationCenters],
    claims: [] as ClaimRecord[],
    impact,
    menuItems: [...menuItems],
    reviews: [...reviews],
    surplusItems: [...surplusItems],
    tailgates: [...tailgates],
};