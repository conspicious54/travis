import { trackEvent } from './posthog';

/* ───── Resilient fetch with retries ─────────────────────────────
   Wraps fetch with bounded retries on transient failures (network
   error, 408 Request Timeout, 429 Rate Limit, 5xx). The funnel's
   top-of-funnel form submissions go through this so a flaky
   mobile connection doesn't burn a lead.

   We retry on:
     - DOMException / TypeError from fetch (network/DNS error)
     - response.status 408, 429, 502, 503, 504

   We DON'T retry on:
     - 4xx other than 408/429 (auth, bad input - retry won't help)
     - 2xx/3xx (success - return immediately)

   Backoff is short + linear (0, 500, 1500ms) because the form is
   submitted on the user's click - they're waiting at the screen,
   not in a background job. Total worst-case latency: ~2 seconds.
─────────────────────────────────────────────────────────────────── */

export interface RetryFetchOptions extends RequestInit {
  /** Max attempt count including the first try. Default 3. */
  retries?: number;
  /** Per-attempt timeout in ms (uses AbortController). Default 6s. */
  timeoutMs?: number;
  /** Optional tag for diagnostic events. */
  tag?: string;
}

const RETRY_DELAYS_MS = [0, 500, 1500];
const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504]);

export async function retryFetch(
  url: string,
  options: RetryFetchOptions = {}
): Promise<Response> {
  const { retries = 3, timeoutMs = 6000, tag, ...init } = options;

  let lastError: unknown;
  let lastResponse: Response | null = null;

  const maxAttempts = Math.min(retries, RETRY_DELAYS_MS.length);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const delay = RETRY_DELAYS_MS[attempt] || 1500;
    if (delay > 0) {
      await new Promise((r) => setTimeout(r, delay));
      trackEvent('retry_fetch_attempt', {
        tag,
        attempt: attempt + 1,
        url: stripQueryString(url),
      });
    }

    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutHandle = ctrl
      ? setTimeout(() => ctrl.abort(), timeoutMs)
      : null;

    try {
      const res = await fetch(url, {
        ...init,
        signal: ctrl?.signal,
      });
      if (timeoutHandle) clearTimeout(timeoutHandle);

      if (res.ok) return res;

      lastResponse = res;
      if (!RETRYABLE_STATUS.has(res.status)) {
        // Non-retryable status - return so caller can handle it
        return res;
      }
      // else: fall through to retry loop
    } catch (err) {
      if (timeoutHandle) clearTimeout(timeoutHandle);
      lastError = err;
      // Network/abort errors are retryable - continue loop
    }
  }

  if (lastResponse) return lastResponse;
  // All attempts failed with a network error - re-throw the last
  // one so the caller's try/catch behaves the same as a plain fetch.
  throw lastError ?? new Error('retryFetch: exhausted retries');
}

function stripQueryString(u: string): string {
  const i = u.indexOf('?');
  return i >= 0 ? u.slice(0, i) : u;
}
