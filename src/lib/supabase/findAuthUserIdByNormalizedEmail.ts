import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { instituteAuthEmail } from "@/lib/tenant/instituteAuthEmail";

const PER_PAGE = 1000;

/**
 * Pages Auth users until one matches `normalizedEmail` (trimmed, lowercased).
 * Use sparingly: worst case scans many pages when the user does not exist.
 */
export async function findAuthUserIdByNormalizedEmail(
  admin: SupabaseClient,
  normalizedEmail: string,
): Promise<{ userId: string | null; error: { message: string } | null }> {
  const target = normalizedEmail.trim().toLowerCase();
  if (!target) {
    return { userId: null, error: null };
  }
  const tenant = getAlsTenant();
  const schema =
    tenant?.dataMode === "shared_schema" ? tenant.postgresSchema ?? "public" : "public";
  const authEmail = instituteAuthEmail(target, schema);

  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error) {
      return { userId: null, error: { message: error.message } };
    }
    const batch = data?.users ?? [];
    for (const user of batch) {
      if (authUserMatchesVisibleEmail(user, target, authEmail, schema)) {
        return { userId: user.id, error: null };
      }
    }
    if (batch.length < PER_PAGE) break;
    page += 1;
  }
  return { userId: null, error: null };
}

function authUserMatchesVisibleEmail(
  user: User,
  visibleEmail: string,
  authEmail: string,
  schema: string,
): boolean {
  const email = (user.email ?? "").trim().toLowerCase();
  if (schema === "public") return email === visibleEmail;
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const storedVisible = String(meta.visible_email ?? "").trim().toLowerCase();
  return email === authEmail || (storedVisible === visibleEmail && meta.tenant_schema === schema);
}
