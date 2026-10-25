"use client";

import type { TenantPublicEnv } from "@/lib/tenant/tenantRegistry";

type WindowWithTenantPublic = Window & { __GE_TENANT_PUBLIC__?: TenantPublicEnv };

/**
 * Assigns the request institute's public Supabase bag during render.
 * A raw `<script>` in the root layout does not run on the client in React 19,
 * so `createClient()` would see an empty URL and anon key.
 */
export function TenantPublicEnvBootstrap({ value }: { value: TenantPublicEnv }) {
  if (typeof window !== "undefined") {
    (window as WindowWithTenantPublic).__GE_TENANT_PUBLIC__ = value;
  }
  return null;
}
