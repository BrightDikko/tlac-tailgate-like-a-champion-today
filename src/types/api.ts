export type ApiResponse<T> = {
    data: T;
    message?: string;
};

export type PaginatedResponse<T> = {
    data: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export type ApiError = {
    message: string;
    code?: string;
    fieldErrors?: Record<string, string>;
};