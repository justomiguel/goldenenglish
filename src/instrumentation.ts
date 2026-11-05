import { pageRequestErrorMeta } from "@/lib/logging/pageRequestErrorMeta";
import { readRequestLogHeaders } from "@/lib/logging/readRequestLogHeaders";
import { logServerError, registerRequestHeaderReader } from "@/lib/logging/serverActionLog";
import { GE_TENANT_HEADER } from "@/lib/tenant/tenantRegistry";

registerRequestHeaderReader(() => readRequestLogHeaders());

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
