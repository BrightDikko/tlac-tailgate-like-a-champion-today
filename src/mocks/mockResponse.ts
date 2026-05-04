import type { ApiError, ApiResponse } from '@/src/types';

export function ok<T>(data: T, message?: string): ApiResponse<T> {
  return message === undefined ? { data } : { data, message };
}

export function fail(message: string, code?: string, fieldErrors?: Record<string, string>): ApiError {
  const err: ApiError = { message };
  if (code !== undefined) {
    err.code = code;
  }
  if (fieldErrors !== undefined) {
    err.fieldErrors = fieldErrors;
  }
  return err;
}
