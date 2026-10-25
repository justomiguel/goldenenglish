/**
 * Public Supabase values baked into the client bundle by `next.config.ts`.
 * One shared deploy must not bake a single institute's URL or anon key.
 */
export function supabasePublicEnvInlinedForClient(args: {
  tenantCount: number;
  singleTenantUrl: string;
  singleTenantAnonKey: string;
}): { url: string; anonKey: string } {
  if (args.tenantCount > 0) return { url: "", anonKey: "" };
  return { url: args.singleTenantUrl, anonKey: args.singleTenantAnonKey };
}
