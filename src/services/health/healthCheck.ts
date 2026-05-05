import { API_HOST_URL } from '@/src/services/config/apiUrls';

function healthUrl(): string {
  return `${stripSlash(API_HOST_URL)}/health`;
}

function stripSlash(h: string): string {
  return h.replace(/\/+$/, '');
}

/**
 * Calls `GET {API_HOST_URL}/health` and returns the parsed JSON `status` field.
 */
export async function checkBackendHealth(): Promise<{ status: string }> {
  const url = healthUrl();
  let res: Response;
  try {
    res = await fetch(url, { method: 'GET' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Network request failed';
    throw new Error(`Health check failed: ${msg}`);
  }

  if (!res.ok) {
    throw new Error(`Health check failed: HTTP ${res.status} ${res.statusText}`);
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new Error('Health response was not valid JSON');
  }

  if (body === null || typeof body !== 'object') {
    throw new Error('Health response JSON was not an object');
  }

  const status = (body as Record<string, unknown>).status;
  if (typeof status !== 'string' || status.trim() === '') {
    throw new Error('Health response missing string "status"');
  }

  return { status };
}
