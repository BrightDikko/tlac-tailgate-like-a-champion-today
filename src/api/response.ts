import type {
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query';

import { asRecord, pickNumber } from '@/src/api/mappers/dto';

import type { ApiError, ApiResponse, MenuItemDeleteResult, PaginatedResponse, TailgateDeleteResult } from '@/src/types';

/** Matches RTK `baseQuery` return when the app's `baseQuery` may be `fetchBaseQuery` or `mockBaseQuery` (ApiError). */
export type RemoteBaseQueryResult = {
  data?: unknown;
  error?: FetchBaseQueryError | ApiError;
  /** RTK infers this loosely (`{}`); normalize when forwarding to `QueryReturnValue`. */
  meta?: unknown;
};

function queryMeta(meta: unknown): FetchBaseQueryMeta | undefined {
  return meta as FetchBaseQueryMeta | undefined;
}

function isFetchBaseQueryError(e: FetchBaseQueryError | ApiError): e is FetchBaseQueryError {
  return 'status' in e;
}

/** Pass through `ApiError`; normalize fetch errors to `ApiError` when the body is recognizable. */
export function normalizeQueryError(error: FetchBaseQueryError | ApiError): ApiError | FetchBaseQueryError {
  if (isFetchBaseQueryError(error)) {
    return normalizeRemoteError(error);
  }
  return error;
}

function readObjectFieldErrors(raw: unknown): Record<string, string> | undefined {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function formatValidationLoc(loc: unknown): string {
  if (!Array.isArray(loc)) return '';
  const parts = loc.map((x) => String(x));
  const generic = new Set(['body', 'query', 'path']);
  let start = 0;
  if (parts.length > 0 && generic.has(parts[0] ?? '')) {
    start = 1;
  }
  return parts.slice(start).join('.');
}

/** FastAPI HTTP validation: `{ "detail": [ { "loc", "msg", "type" }, ... ] }` */
function readFastApiValidationDetailArray(detail: unknown): string | undefined {
  if (!Array.isArray(detail) || detail.length === 0) return undefined;
  const lines: string[] = [];
  for (const item of detail.slice(0, 3)) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) continue;
    const o = item as Record<string, unknown>;
    const msg = typeof o.msg === 'string' ? o.msg.trim() : '';
    if (msg.length === 0) continue;
    const path = formatValidationLoc(o.loc);
    lines.push(path.length > 0 ? `${path}: ${msg}` : msg);
  }
  if (lines.length === 0) return undefined;
  return lines.join('; ');
}

/** FastAPI-style `{ "detail": { "message", "code", "fieldErrors" } }` or string `detail`. */
function readFastApiDetail(d: Record<string, unknown>): {
  message?: string;
  code?: string;
  fieldErrors?: Record<string, string>;
} {
  const detail = d.detail;
  if (typeof detail === 'string' && detail.trim().length > 0) {
    return { message: detail.trim() };
  }
  if (detail === null || typeof detail !== 'object' || Array.isArray(detail)) {
    return {};
  }
  const det = detail as Record<string, unknown>;
  const message =
    typeof det.message === 'string' && det.message.trim().length > 0 ? det.message.trim() : undefined;
  const code = typeof det.code === 'string' && det.code.length > 0 ? det.code : undefined;
  const fe =
    readObjectFieldErrors(det.fieldErrors) ?? readObjectFieldErrors(det.field_errors);
  return { message, code, fieldErrors: fe };
}

/** User-facing message extracted from a remote JSON error body (FastAPI, legacy shapes). */
export function readMessageFromErrorData(data: unknown): string | undefined {
  if (data === null || data === undefined || typeof data !== 'object') {
    return undefined;
  }
  const d = data as Record<string, unknown>;

  if (Array.isArray(d.detail)) {
    const fromValidation = readFastApiValidationDetailArray(d.detail);
    if (fromValidation !== undefined) return fromValidation;
  }

  const fromDetail = readFastApiDetail(d);
  if (fromDetail.message !== undefined) return fromDetail.message;

  if (typeof d.message === 'string' && d.message.length > 0) return d.message;
  if (typeof d.error === 'string' && d.error.length > 0) return d.error;
  const errors = d.errors;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === 'string') return first;
    if (first !== null && typeof first === 'object' && 'message' in first) {
      const m = (first as { message?: unknown }).message;
      if (typeof m === 'string') return m;
    }
  }
  return undefined;
}

function readFieldErrors(data: unknown): Record<string, string> | undefined {
  if (data === null || data === undefined || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  const top = readObjectFieldErrors(d.fieldErrors) ?? readObjectFieldErrors(d.field_errors);
  if (top !== undefined) return top;
  const fromDetail = readFastApiDetail(d).fieldErrors;
  return fromDetail;
}

function readErrorCodeFromData(data: unknown): string | undefined {
  if (data === null || data === undefined || typeof data !== 'object') return undefined;
  const d = data as Record<string, unknown>;
  if (typeof d.code === 'string' && d.code.length > 0) return d.code;
  const fromDetail = readFastApiDetail(d);
  if (fromDetail.code !== undefined) return fromDetail.code;
  return undefined;
}

/** Prefer ApiError when the server body has a recognizable message shape; otherwise pass through RTK error. */
export function normalizeRemoteError(error: FetchBaseQueryError): ApiError | FetchBaseQueryError {
  const msg = readMessageFromErrorData(error.data);
  if (msg !== undefined) {
    const api: ApiError = { message: msg };
    if (error.data !== null && error.data !== undefined && typeof error.data === 'object') {
      const code = readErrorCodeFromData(error.data);
      if (code !== undefined) api.code = code;
      const fe = readFieldErrors(error.data);
      if (fe !== undefined) api.fieldErrors = fe;
    }
    return api;
  }
  return error;
}

export function fromMockApiResult<T>(
  result: ApiResponse<T> | ApiError
): QueryReturnValue<T, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if ('data' in result) {
    return { data: result.data };
  }
  return { error: result };
}

function unwrapSinglePayload(raw: unknown): unknown {
  if (raw === null || raw === undefined) {
    return raw;
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return raw;
  }
  const r = raw as Record<string, unknown>;
  if (!('data' in r)) {
    return raw;
  }
  const inner = r.data;
  if (Array.isArray(inner)) {
    return raw;
  }
  if (inner !== null && inner !== undefined && typeof inner === 'object') {
    const ir = inner as Record<string, unknown>;
    if (Array.isArray(ir.data) && ('page' in ir || 'pageSize' in ir || 'page_size' in ir || 'total' in ir)) {
      return raw;
    }
  }
  return inner;
}

function parsePaginatedEnvelope(raw: unknown): PaginatedResponse<unknown> | null {
  const r = asRecord(raw);
  if (r === null) return null;
  if (Array.isArray(r.data)) {
    const items = r.data;
    return {
      data: items,
      page: pickNumber(r, ['page'], 1),
      pageSize: pickNumber(r, ['pageSize', 'page_size'], items.length > 0 ? items.length : 10),
      total: pickNumber(r, ['total'], items.length),
      totalPages: pickNumber(r, ['totalPages', 'total_pages'], 1),
    };
  }
  const inner = asRecord(r.data);
  if (inner !== null && Array.isArray(inner.data)) {
    const items = inner.data;
    return {
      data: items,
      page: pickNumber(inner, ['page'], pickNumber(r, ['page'], 1)),
      pageSize: pickNumber(inner, ['pageSize', 'page_size'], items.length > 0 ? items.length : 10),
      total: pickNumber(inner, ['total'], pickNumber(r, ['total'], items.length)),
      totalPages: pickNumber(inner, ['totalPages', 'total_pages'], 1),
    };
  }
  return null;
}

function unwrapArrayPayload(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) {
    return raw;
  }
  const r = asRecord(raw);
  if (r === null) return null;
  if (Array.isArray(r.data)) {
    return r.data;
  }
  const inner = asRecord(r.data);
  if (inner !== null && Array.isArray(inner.data)) {
    return inner.data;
  }
  return null;
}

export function remoteToSingle<T>(
  result: RemoteBaseQueryResult,
  map: (raw: unknown) => T | null
): QueryReturnValue<T, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if (result.error !== undefined) {
    return { error: normalizeQueryError(result.error), meta: queryMeta(result.meta) };
  }
  const payload = unwrapSinglePayload(result.data);
  const mapped = map(payload);
  if (mapped === null) {
    return {
      error: { message: 'Unable to parse response' },
      meta: queryMeta(result.meta),
    };
  }
  return { data: mapped, meta: queryMeta(result.meta) };
}

export function remoteToPaginated<T>(
  result: RemoteBaseQueryResult,
  mapItem: (raw: unknown) => T | null
): QueryReturnValue<PaginatedResponse<T>, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if (result.error !== undefined) {
    return { error: normalizeQueryError(result.error), meta: queryMeta(result.meta) };
  }
  const envelope = parsePaginatedEnvelope(result.data);
  if (envelope === null) {
    return {
      error: { message: 'Unable to parse paginated response' },
      meta: queryMeta(result.meta),
    };
  }
  const mapped: T[] = [];
  for (const row of envelope.data) {
    const item = mapItem(row);
    if (item !== null) {
      mapped.push(item);
    }
  }
  return {
    data: {
      data: mapped,
      page: envelope.page,
      pageSize: envelope.pageSize,
      total: envelope.total,
      totalPages: envelope.totalPages,
    },
    meta: queryMeta(result.meta),
  };
}

export function remoteToArray<T>(
  result: RemoteBaseQueryResult,
  mapItem: (raw: unknown) => T | null
): QueryReturnValue<T[], ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if (result.error !== undefined) {
    return { error: normalizeQueryError(result.error), meta: queryMeta(result.meta) };
  }
  const rows = unwrapArrayPayload(result.data);
  if (rows === null) {
    return {
      error: { message: 'Unable to parse list response' },
      meta: queryMeta(result.meta),
    };
  }
  const mapped: T[] = [];
  for (const row of rows) {
    const item = mapItem(row);
    if (item !== null) {
      mapped.push(item);
    }
  }
  return { data: mapped, meta: queryMeta(result.meta) };
}

export function remoteToNull(
  result: RemoteBaseQueryResult
): QueryReturnValue<null, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if (result.error !== undefined) {
    return { error: normalizeQueryError(result.error), meta: queryMeta(result.meta) };
  }
  return { data: null, meta: queryMeta(result.meta) };
}

function unwrapDeleteResponseBody(raw: unknown): unknown {
  if (raw === null || raw === undefined) {
    return raw;
  }
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    return raw;
  }
  const r = raw as Record<string, unknown>;
  if ('data' in r && r.data !== undefined && typeof r.data === 'object' && !Array.isArray(r.data)) {
    return r.data;
  }
  return raw;
}

function readStringIdArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((x): x is string => typeof x === 'string' && x.length > 0);
}

/** Normalize DELETE /tailgates/:id — empty body, raw id, or cascade payload. */
export function remoteToTailgateDeleteResult(
  result: RemoteBaseQueryResult,
  fallbackTailgateId: string
): QueryReturnValue<TailgateDeleteResult, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if (result.error !== undefined) {
    return { error: normalizeQueryError(result.error), meta: queryMeta(result.meta) };
  }
  const raw = unwrapDeleteResponseBody(result.data);
  const r = asRecord(raw);
  if (r === null) {
    return {
      data: { tailgateId: fallbackTailgateId, removedSurplusIds: [], removedMenuItemIds: [] },
      meta: queryMeta(result.meta),
    };
  }
  const tidRaw = r.tailgateId ?? r.tailgate_id;
  const tid = typeof tidRaw === 'string' && tidRaw.length > 0 ? tidRaw : fallbackTailgateId;
  return {
    data: {
      tailgateId: tid,
      removedSurplusIds: readStringIdArray(r.removedSurplusIds ?? r.removed_surplus_ids),
      removedMenuItemIds: readStringIdArray(r.removedMenuItemIds ?? r.removed_menu_item_ids),
    },
    meta: queryMeta(result.meta),
  };
}

/** Normalize DELETE /menu-items/:id — empty body or partial entity. */
export function remoteToMenuItemDeleteResult(
  result: RemoteBaseQueryResult,
  fallback: MenuItemDeleteResult
): QueryReturnValue<MenuItemDeleteResult, ApiError | FetchBaseQueryError, FetchBaseQueryMeta | undefined> {
  if (result.error !== undefined) {
    return { error: normalizeQueryError(result.error), meta: queryMeta(result.meta) };
  }
  const raw = unwrapDeleteResponseBody(result.data);
  const r = asRecord(raw);
  if (r === null) {
    return { data: fallback, meta: queryMeta(result.meta) };
  }
  const idRaw = r.id ?? r._id;
  const id = typeof idRaw === 'string' && idRaw.length > 0 ? idRaw : fallback.id;
  const tgRaw = r.tailgateId ?? r.tailgate_id;
  const tailgateId =
    typeof tgRaw === 'string' && tgRaw.length > 0 ? tgRaw : fallback.tailgateId;
  return { data: { id, tailgateId }, meta: queryMeta(result.meta) };
}
