#!/usr/bin/env node
/**
 * Prints one design-token issue per line. Exit 0. The report never blocks a gate.
 * Usage: npm run report:design-tokens
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

function stringProperties(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

async function loadTargetRows() {
  const env = fs.existsSync(ENV_LOCAL) ? readEnvFile(ENV_LOCAL) : {};
  const pulsarUrl = (process.env.PULSAR_DATABASE_URL || env.PULSAR_DATABASE_URL || "").trim();
  if (pulsarUrl) {
    const client = new Client({ connectionString: pulsarUrl });
    await client.connect();
    try {
      const result = await client.query(
        `select slug, database_url, data_mode, postgres_schema, is_enabled
         from public.platform_tenants`,
      );
      return result.rows;
    } finally {
      await client.end();
    }
  }
  const raw = (env.TENANTS_CONFIG_JSON || process.env.TENANTS_CONFIG_JSON || "").trim();
  if (!raw) throw new Error("Set PULSAR_DATABASE_URL or TENANTS_CONFIG_JSON");
  const list = JSON.parse(raw);
  if (!Array.isArray(list)) throw new Error("TENANTS_CONFIG_JSON must be an array");
  return list;
}

async function readActiveProperties(databaseUrl, schema) {
  if (!SCHEMA_NAME.test(schema)) throw new Error("invalid_schema");
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    const result = await client.query(
      `select properties from ${schema}.site_themes
       where archived_at is null and is_active = true
       order by updated_at desc
       limit 1`,
    );
    return stringProperties(result.rows[0]?.properties);
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
  const { validateDesignTokens } = await import(
    pathToFileURL(path.join(ROOT, "src/lib/design-tokens/validateDesignTokens.ts")).href
  );
  const { formatDesignTokenFleetLine } = await import(
    pathToFileURL(path.join(ROOT, "src/lib/design-tokens/formatDesignTokenFleetLine.ts")).href
  );
  const pooler = createInstitutePoolerDeps({
    lookup,
    Client,
    cachePath: POOLER_CACHE,
    readPoolerHostCache,
    writePoolerHostCache,
  });
  const rows = await loadTargetRows();
  for (const row of rows) {
    const target = instituteTargetFromRecord(row);
    if (!target?.databaseUrl) continue;
    try {
      const databaseUrl = await resolveInstituteDatabaseUrl(target.databaseUrl, pooler);
      const properties = await readActiveProperties(databaseUrl, target.postgresSchema || "public");
      const checked = validateDesignTokens(properties, { tenantSlug: target.slug });
      if (checked.ok) continue;
      for (const issue of checked.issues) {
        console.log(formatDesignTokenFleetLine(target.slug, issue));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`${target.slug} read_failed - - -`);
      console.error(`${target.slug} ${message}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(0);
  });
