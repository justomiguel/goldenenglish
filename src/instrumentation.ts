import { headers } from "next/headers";
import { pageRequestErrorMeta } from "@/lib/logging/pageRequestErrorMeta";
import { logServerError, registerRequestHeaderReader } from "@/lib/logging/serverActionLog";

registerRequestHeaderReader(() => {
  try {
    const value = headers() as unknown;
    if (!value || typeof (value as { get?: unknown }).get !== "function") return null;
    return value as { get(name: string): string | null };
  } catch {
    return null;
  }
});

type RequestErrorArgs = {
  path: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
};

type RequestErrorContext = {
  routePath: string;
  routeType: string;
};

/**
 * Next.js calls this for a failed server render, route, or action.
 * The page shows a short support code. This line is the diagnostic.
 */
export async function onRequestError(
  error: Error & { digest?: string },
  request: RequestErrorArgs,
  context: RequestErrorContext,
): Promise<void> {
  const hostHeader = request.headers["x-forwarded-host"] ?? request.headers.host;
  logServerError(
    "page.request_error",
    pageRequestErrorMeta({
      error,
      path: request.path,
      method: request.method,
      hostHeader,
      routePath: context.routePath,
      routeType: context.routeType,
      digest: error.digest,
    }),
  );
}
