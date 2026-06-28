/**
 * DOKAN — Error Capture System
 *
 * Stores the last captured error in a global variable so other parts
 * of the app (e.g. error boundaries, API routes) can retrieve structured
 * error info with a time-to-live limit.
 *
 * Ported from Sari3 pattern and adapted for Dokan.
 */

let lastCapturedError: { error: Error; context?: string; at: number } | undefined;
const TTL_MS = 10_000;

// ── Global error event listeners ───────────────────────────────
if (typeof globalThis.addEventListener === 'function') {
  globalThis.addEventListener('error', (event) => {
    const err = (event as ErrorEvent).error ?? event;
    captureError(
      err instanceof Error ? err : new Error(String(err)),
      'global:error',
    );
  });

  globalThis.addEventListener('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    captureError(
      reason instanceof Error ? reason : new Error(String(reason)),
      'global:unhandledrejection',
    );
  });
}

/**
 * Store an error with an optional context label and timestamp.
 * If the error is not a real Error instance it is wrapped in one.
 */
export function captureError(error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  lastCapturedError = { error: err, context, at: Date.now() };
}

/**
 * Return the last captured error if it is still within the TTL window,
 * or `undefined` if nothing was captured or the window has expired.
 */
export function getLastCapturedError(): { error: Error; context?: string } | undefined {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error, context } = lastCapturedError;
  // Do NOT clear on read — allow multiple consumers to check
  return { error, context };
}

/**
 * Clear the stored error.
 */
export function clearCapturedError(): void {
  lastCapturedError = undefined;
}

/**
 * Structured console.error with a Dokan-branded prefix.
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[Dokan:${context}]` : '[Dokan]';
  if (error instanceof Error) {

  } else {

  }
}
