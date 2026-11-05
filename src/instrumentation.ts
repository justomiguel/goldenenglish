import { headers } from "next/headers";
import { pageRequestErrorMeta } from "@/lib/logging/pageRequestErrorMeta";
import { logServerError, registerRequestHeaderReader } from "@/lib/logging/serverActionLog";
import { GE_TENANT_HEADER } from "@/lib/tenant/tenantRegistry";

registerRequestHeaderReader(async () => {
  try {
    const value = await headers();
    if (!value || typeof value.get !== "function") return null;
    return value;
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
  await logServerError(
    "page.request_error",
    pageRequestErrorMeta({
      error,
      path: request.path,
      method: request.method,
      hostHeader,
      tenantHeader: request.headers[GE_TENANT_HEADER],
      routePath: context.routePath,
      routeType: context.routeType,
      digest: error.digest,
    }),
  );
}
