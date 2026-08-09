import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

type PostgrestLike = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
} | null | undefined;

/**
 * Told once per failed read, with the same stable scope the server log carries.
 *
 * Screens that hide empty sections need this: without it a timeout and an empty ward render the
 * same pixels, and the family is left believing there is nothing to see.
 */
export type LoadErrorReporter = (scope: string) => void;

/** Logs the failure as before, and lets the caller learn that this particular read came back short. */
export function noteReadFailure(
  scope: string,
  error: PostgrestLike,
  meta: Record<string, unknown> | undefined,
  report: LoadErrorReporter | undefined,
): void {
  if (!error?.message && !error?.code) return;
  logSupabaseClientError(scope, error, meta);
  report?.(scope);
}
