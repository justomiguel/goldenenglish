/**
 * Supabase URL + publishable (anon) key from env.
 * Supports common naming variants from Supabase / Vercel templates.
 */
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { isMultiTenantEnabled } from "@/lib/tenant/tenantRegistry";

type GeTenantPublic = { url?: string; anonKey?: string };

function readBrowserTenantPublicEnv(): { url: string; anonKey: string } | null {
  if (typeof window === "undefined") return null;
  const injected = (window as Window & { __GE_TENANT_PUBLIC__?: GeTenantPublic }).__GE_TENANT_PUBLIC__;
  const url = injected?.url?.trim() ?? "";
  const anonKey = injected?.anonKey?.trim() ?? "";
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function readSupabasePublicEnv(): { url: string; anonKey: string } {
  const browser = readBrowserTenantPublicEnv();
  if (browser) return browser;
  const alsTenant = getAlsTenant();
  if (alsTenant?.supabaseUrl && alsTenant.supabaseAnonKey) {
    return { url: alsTenant.supabaseUrl, anonKey: alsTenant.supabaseAnonKey };
  }
  if (isMultiTenantEnabled()) return { url: "", anonKey: "" };
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    "";

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY?.trim() ||
    "";

  return { url, anonKey };
}

export function hasSupabasePublicEnv(): boolean {
  const { url, anonKey } = readSupabasePublicEnv();
  return url.length > 0 && anonKey.length > 0;
}
