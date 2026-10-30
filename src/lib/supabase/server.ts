import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { bindInstituteDataPlane } from "@/lib/supabase/bindInstituteDataPlane";
import {
  missingSupabaseEnvMessage,
  readRequestSupabaseEnvDiagnosis,
} from "@/lib/supabase/requestPublicEnv";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

export async function createClient() {
  const cookieStore = await cookies();
  const diag = await readRequestSupabaseEnvDiagnosis();
  if (!diag.url || !diag.anonKey) {
    throw new Error(missingSupabaseEnvMessage(diag));
  }
  const { url, anonKey } = diag;

  const client = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll called from a Server Component — safe to ignore.
        }
      },
    },
  });
  const tenant = getAlsTenant() ?? (await resolveRequestTenant());
  return bindInstituteDataPlane(client, tenant);
}
