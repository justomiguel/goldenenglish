# Tenant Supabase env — request context in logs

## Intent

A request to `liorastudio.cl` throws `Your project's URL and Key are required to create a Supabase client!` with no host, slug, or reason. The page must load the Pulsar tenant list in the Node process, and a missing URL or anon key must log that context.

## Done when

- `resolveRequestTenant()` loads `platform_tenants` in the same process that renders the page.
- A missing URL or anon key does not call `createServerClient`.
- The thrown error and the `[ge:server]` line include host, tenant slug, reason, tenant count, whether the Pulsar cache is loaded, and the registry error code.
- Logs do not include Supabase keys, service role keys, or database URLs.
- Vitest covers a host that does not resolve, and a host that resolves after the registry load.

## Page errors

Follow Next.js `error.tsx` and `global-error.tsx`. Follow the Node rule that the log keeps request context and the page does not show the internal error.

- Every `[ge:server]` error, warning, and info line includes `host` and `tenantSlug` when the request has them.
- `onRequestError` logs path, method, route, digest, name, and message. It does not log cookies or keys.
- The error page logs the same digest in the browser, with the host from the address bar.
- The visible page uses dictionary copy and a retry button. It shows the digest as a support code. It does not show the stack.

## Out of scope

- Changing tenant hosts in the Pulsar database.
- Deploy or DNS for `liorastudio.cl`.
- A new log line for every successful request.
