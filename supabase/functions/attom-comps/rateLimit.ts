// Pure rate-limit logic for attom-comps. No Deno or network imports, so vitest can load it.
// The counter lives in the attom_request_log table (service role only); index.ts does the query.

/** Max authenticated attom-comps requests per user per rolling hour (ATTOM calls, cache hits, geocodes, and mode=log writes). */
export const ATTOM_RATE_LIMIT_PER_HOUR = 30;
export const RATE_WINDOW_MS = 60 * 60 * 1000;

/** ISO timestamp marking the start of the rolling window ending at `nowMs`. */
export function rateWindowStartIso(nowMs: number): string {
  return new Date(nowMs - RATE_WINDOW_MS).toISOString();
}

/** A request is allowed while the user's count in the window is below the limit. */
export function allowed(count: number, limit: number = ATTOM_RATE_LIMIT_PER_HOUR): boolean {
  return count < limit;
}
