/**
 * Base URL for API requests. Use when the app is served from a different origin
 * (e.g. proxy or different port). Set NEXT_PUBLIC_APP_URL in .env.local if chat
 * or repo-index requests hit the wrong port.
 */
export function getApiBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const base = process.env.NEXT_PUBLIC_APP_URL;
  if (!base) return "";
  return base.replace(/\/$/, "");
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
