export function debugRemotePayload(label: string, payload: unknown): void {
  if (!__DEV__) return;
  try {
    console.log(`[remote-payload] ${label}`, payload);
  } catch {
    // no-op
  }
}
