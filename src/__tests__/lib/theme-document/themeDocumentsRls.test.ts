import { readFileSync } from "node:fs";
import { Client } from "pg";
import { describe, expect, it } from "vitest";

function isolatedDatabaseUrl(): string | null {
  if (process.env.E2E_STACK !== "isolated") return null;
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    const body = readFileSync(".env.local.e2e", "utf8");
    const line = body.split("\n").find((row) => row.startsWith("DATABASE_URL="));
    return line ? line.slice("DATABASE_URL=".length).trim() : null;
  } catch {
    return null;
  }
}

describe("theme_documents RLS", () => {
  const databaseUrl = isolatedDatabaseUrl();

  it.skipIf(!databaseUrl)("hides rows from anon and exposes the published document through the RPC", async () => {
    const admin = new Client({ connectionString: databaseUrl! });
    await admin.connect();
    const suffix = crypto.randomUUID();
    try {
      const theme = await admin.query<{ id: string }>(
        `insert into public.site_themes (slug, name, is_active, properties)
         values ($1, $1, false, '{}'::jsonb)
         returning id`,
        [`theme-doc-${suffix}`],
      );
      const themeId = theme.rows[0]?.id;
      expect(themeId).toBeTruthy();
      const published = await admin.query<{ id: string }>(
        `insert into public.theme_documents (site_theme_id, status, document, document_hash)
         values ($1, 'published', '{"contractVersion":1}'::jsonb, 'hash-a')
         returning id`,
        [themeId],
      );
      const anon = new Client({ connectionString: databaseUrl! });
      await anon.connect();
      try {
        await anon.query("set role anon");
        const hidden = await anon.query("select id from public.theme_documents");
        expect(hidden.rows).toEqual([]);
        const rpc = await anon.query("select public.get_published_theme_document($1) as document", [themeId]);
        expect(rpc.rows[0]?.document).toMatchObject({ contractVersion: 1 });
      } finally {
        await anon.end();
      }

      await expect(
        admin.query("update public.theme_documents set document = '{}'::jsonb where id = $1", [published.rows[0]?.id]),
      ).rejects.toThrow(/snapshot_immutable/);

      const reader = new Client({ connectionString: databaseUrl! });
      await reader.connect();
      try {
        await reader.query("set role authenticated");
        await expect(
          reader.query("select * from public.publish_theme_document($1, $2)", [themeId, "hash-a"]),
        ).rejects.toThrow(/forbidden/);
      } finally {
        await reader.end();
      }
    } finally {
      await admin.query("delete from public.site_themes where slug = $1", [`theme-doc-${suffix}`]);
      await admin.end();
    }
  });
});
