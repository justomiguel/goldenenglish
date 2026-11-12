#!/usr/bin/env node
/**
 * Prints variant use per tenant. Exit 0. The report never blocks a gate.
 * Usage: npm run report:variants
 */
import { spawnSync } from "node:child_process";
import { lookup } from "node:dns/promises";
import fs from "node:fs";
import { register } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import pg from "pg";
import { readEnvFile } from "./migrate-public-assets-lib.mjs";
import { createInstitutePoolerDeps } from "./institute-pooler-connect.mjs";

const { Client } = pg;
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");
const POOLER_CACHE = path.join(ROOT, "scripts/.institute-pooler-hosts.json");
const SCHEMA_NAME = /^[a-z_][a-z0-9_]*$/;

function ensureTypeStrip() {
  const flagged = process.execArgv.some((arg) => arg.includes("strip-types"));
  if (flagged || process.features?.typescript === "strip") return;
  const child = spawnSync(process.execPath, ["--experimental-strip-types", ...process.argv.slice(1)], {
    stdio: "inherit",
  });
  process.exit(child.status ?? 1);
}

ensureTypeStrip();
register(pathToFileURL(path.join(ROOT, "scripts/lib/alias-loader.mjs")).href, import.meta.url);

async function loadFleet() {
  const env = fs.existsSync(ENV_LOCAL) ? readEnvFile(ENV_LOCAL) : {};
  const pulsarUrl = (process.env.PULSAR_DATABASE_URL || env.PULSAR_DATABASE_URL || "").trim();
  if (!pulsarUrl) {
    const raw = (env.TENANTS_CONFIG_JSON || process.env.TENANTS_CONFIG_JSON || "").trim();
    if (!raw) throw new Error("Set PULSAR_DATABASE_URL or TENANTS_CONFIG_JSON");
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) throw new Error("TENANTS_CONFIG_JSON must be an array");
    return { targets: list, pins: new Map() };
  }
  const client = new Client({ connectionString: pulsarUrl });
  await client.connect();
  try {
    const result = await client.query(
      `select slug, database_url, data_mode, postgres_schema, is_enabled
       from public.platform_tenants`,
    );
    const pins = new Map();
    try {
      const pinRows = await client.query(
        `select tenant_slug, variant_id, major
         from public.platform_tenant_variant_pins
         order by tenant_slug, variant_id`,
      );
      for (const pin of pinRows.rows) {
        const list = pins.get(pin.tenant_slug) ?? [];
        list.push({ id: pin.variant_id, variantId: pin.variant_id, major: Number(pin.major), props: {} });
        pins.set(pin.tenant_slug, list);
      }
    } catch {
      // A control plane without the pins table still reports the generic fallback.
    }
    return { targets: result.rows, pins };
  } finally {
    await client.end();
  }
}

async function readTemplateKind(databaseUrl, schema) {
  if (!SCHEMA_NAME.test(schema)) throw new Error("invalid_schema");
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query(
      `select template_kind from ${schema}.site_themes
       where archived_at is null and is_active = true
       order by updated_at desc
       limit 1`,
    );
    const kind = result.rows[0]?.template_kind;
    return typeof kind === "string" ? kind : "";
  } finally {
    await client.end();
  }
}

async function main() {
  const { instituteTargetFromRecord } = await import(
    pathToFileURL(path.join(ROOT, "src/lib/tenant/planInstituteMigrationApplies.ts")).href
  );
  const { readPoolerHostCache, resolveInstituteDatabaseUrl, writePoolerHostCache } = await import(
    pathToFileURL(path.join(ROOT, "src/lib/tenant/institutePoolerUrl.ts")).href
  );
  const { genericKindToSections } = await import(
    pathToFileURL(path.join(ROOT, "src/lib/design-variants/genericKindToSections.ts")).href
  );
  const { isGenericInstituteKind } = await import(
    pathToFileURL(path.join(ROOT, "src/lib/theme/genericInstituteTemplates.ts")).href
  );
  const { variantFleetSummary } = await import(
    pathToFileURL(path.join(ROOT, "src/lib/design-variants/variantFleetSummary.ts")).href
  );
  const pooler = createInstitutePoolerDeps({
    lookup,
    Client,
    cachePath: POOLER_CACHE,
    readPoolerHostCache,
    writePoolerHostCache,
  });
  const { targets, pins } = await loadFleet();
  const rows = [];
  for (const row of targets) {
    const target = instituteTargetFromRecord(row);
    if (!target?.databaseUrl) continue;
    const pinned = pins.get(target.slug);
    if (pinned?.length) {
      rows.push({ slug: target.slug, sections: pinned });
      continue;
    }
    try {
      const databaseUrl = await resolveInstituteDatabaseUrl(target.databaseUrl, pooler);
      const kind = await readTemplateKind(databaseUrl, target.postgresSchema || "public");
      if (!isGenericInstituteKind(kind)) {
        console.log(`${target.slug} bespoke:${kind || "unknown"}`);
        continue;
      }
      rows.push({ slug: target.slug, sections: genericKindToSections(kind) });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`${target.slug} read_failed`);
      console.error(`${target.slug} ${message}`);
    }
  }
  const grouped = variantFleetSummary(rows);
  for (const key of [...grouped.keys()].sort()) {
    console.log(`${key} ${(grouped.get(key) ?? []).join(" ")}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(0);
  });
