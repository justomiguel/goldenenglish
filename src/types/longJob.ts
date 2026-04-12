/**
 * Minimal snapshot the client expects when polling a long-running job (state GET JSON).
 * Endpoints may add extra fields; generic UI uses status/current/total/message/error.
 */
export type LongJobSnapshot = {
  status: string;
  current?: number;
  total?: number;
  message?: string;
  error?: string;
} & Record<string, unknown>;
