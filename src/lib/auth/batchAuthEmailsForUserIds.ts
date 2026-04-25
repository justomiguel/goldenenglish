import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException } from "@/lib/logging/serverActionLog";

/** Resuelve emails de login (auth.users) para los ids dados. Usa service role. */
export async function batchAuthEmailsForUserIds(userIds: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(userIds)];
  if (unique.length === 0) return new Map();

  let admin;
  try {
    admin = createAdminClient();
  } catch (e) {
    logServerException("batchAuthEmailsForUserIds:createAdminClient", e);
    return new Map();
  }

  const results = await Promise.all(
    unique.map(async (id) => {
      const { data, error } = await admin.auth.admin.getUserById(id);
      if (error || !data.user?.email) return [id, null] as const;
      const e = data.user.email.trim();
      return [id, e.length > 0 ? e : null] as const;
    }),
  );

  const m = new Map<string, string>();
  for (const [id, em] of results) {
    if (em) m.set(id, em);
  }
  return m;
}
