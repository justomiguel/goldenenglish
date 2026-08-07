import type { Page, Response } from "@playwright/test";

/** Cold `next dev --webpack` compiles often abort the first navigation. */
export function isRetryableGotoError(message: string): boolean {
  return /ERR_ABORTED|ERR_NETWORK_IO_SUSPENDED|ERR_CONNECTION|ERR_FAILED|frame was detached|Navigation interrupted|net::ERR_|Timeout/i.test(
    message,
  );
}

export type GotoIsolatedOptions = {
  /** Per-attempt navigation timeout (ms). Default 60s. */
  timeout?: number;
  /** Attempts including the first. Default 3. */
  attempts?: number;
  waitUntil?: "load" | "domcontentloaded" | "commit" | "networkidle";
};

/**
 * Navigate on the isolated e2e stack with retries for webpack cold-compile aborts.
 * Prefer `domcontentloaded` — waiting for `load` races Next soft navigations.
 */
export async function gotoIsolated(
  page: Page,
  path: string,
  opts: GotoIsolatedOptions = {},
): Promise<Response | null> {
  const timeout = opts.timeout ?? 60_000;
  const attempts = opts.attempts ?? 3;
  const waitUntil = opts.waitUntil ?? "domcontentloaded";
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await page.goto(path, { waitUntil, timeout });
    } catch (err) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      if (!isRetryableGotoError(msg) || attempt === attempts) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 750 * attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
