import "server-only";

import pg from "pg";
import { logServerActionException } from "@/lib/logging/serverActionLog";

const SCHEMA = /^tenant_[a-z0-9_]{1,50}$/;

/** Turns on one template inside the new institute schema. Uses SQL, not PostgREST. */
export async function activateFreeSiteTheme(args: {
  databaseUrl: string;
  schema: string;
  themeSlug: string;
  properties: Record<string, string>;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  if (!SCHEMA.test(args.schema) || !args.databaseUrl.trim() || !args.themeSlug.trim()) {
    return { ok: false, errorCode: "theme_missing" };
  }
  const client = new pg.Client({ connectionString: args.databaseUrl });
  try {
    await client.connect();
    await client.query("BEGIN");
    await client.query(`UPDATE ${args.schema}.site_themes SET is_active = false`);
    const updated = await client.query(
      `UPDATE ${args.schema}.site_themes
       SET is_active = true,
           properties = COALESCE(properties, '{}'::jsonb) || $2::jsonb
       WHERE slug = $1`,
      [args.themeSlug, JSON.stringify(args.properties)],
    );
    if ((updated.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return { ok: false, errorCode: "theme_missing" };
    }
    await client.query("COMMIT");
    await client.query("NOTIFY pgrst, 'reload schema'");
    return { ok: true };
  } catch (err) {
    logServerActionException("activateFreeSiteTheme", err, { schema: args.schema });
    return { ok: false, errorCode: "db_write_failed" };
  } finally {
    await client.end().catch(() => undefined);
  }
}
