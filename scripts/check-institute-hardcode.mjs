#!/usr/bin/env node
/**
 * Fails when a tenant slug appears in shared src more than the baseline allows.
 * Flags: --report --strict --update-baseline --init
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { readEnvFile } from "./migrate-public-assets-lib.mjs";
import { compareWithBaseline, lowerBaseline, raisedAgainstCommitted } from "./lib/instituteHardcodeBaseline.mjs";
import { matchInstituteHardcode } from "./lib/instituteHardcodeMatcher.mjs";

const { Client } = pg;
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const SLUGS_FILE = path.join(ROOT, "scripts/institute-slugs.json");
const BASELINE_FILE = path.join(ROOT, "scripts/institute-hardcode-baseline.json");
const EXT = /\.(ts|tsx|css|json)$/;

function walk(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXT.test(entry.name)) out.push(full);
  }
}

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

async function extraSlugs() {
  const env = fs.existsSync(path.join(ROOT, ".env.local"))
    ? readEnvFile(path.join(ROOT, ".env.local"))
    : {};
  const url = (process.env.PULSAR_DATABASE_URL || env.PULSAR_DATABASE_URL || "").trim();
  if (!url) return [];
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const result = await client.query(`select slug from public.platform_tenants`);
    return result.rows.map((row) => String(row.slug || "").toLowerCase()).filter(Boolean);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    return [];
  } finally {
    await client.end().catch(() => undefined);
  }
}

function committedBaseline() {
  try {
    const text = execFileSync("git", ["show", "HEAD:scripts/institute-hardcode-baseline.json"], {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readBaseline() {
  if (!fs.existsSync(BASELINE_FILE)) return [];
  const parsed = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf8"));
  return Array.isArray(parsed) ? parsed : [];
}

function countEntries(hits) {
  const { grown } = compareWithBaseline(hits, []);
  return grown;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const files = [];
  walk(SRC, files);
  const listed = JSON.parse(fs.readFileSync(SLUGS_FILE, "utf8"));
  const slugs = [...new Set([...listed, ...(await extraSlugs())])];
  const hits = files.flatMap((file) => {
    const text = fs.readFileSync(file, "utf8");
    return matchInstituteHardcode(rel(file), text, slugs);
  });

  if (args.has("--report")) {
    const totals = new Map();
    for (const hit of hits) {
      const key = `${hit.slug} ${hit.code}`;
      totals.set(key, (totals.get(key) ?? 0) + 1);
    }
    for (const [key, count] of [...totals.entries()].sort()) console.log(`${count} ${key}`);
    console.log(`total ${hits.length}`);
    return;
  }

  if (args.has("--init")) {
    if (fs.existsSync(BASELINE_FILE)) {
      console.error("Baseline already exists. Refusing --init.");
      process.exit(1);
    }
    fs.writeFileSync(BASELINE_FILE, `${JSON.stringify(countEntries(hits), null, 2)}\n`);
    console.log(`Wrote ${countEntries(hits).length} baseline rows.`);
    return;
  }

  const baseline = args.has("--strict") ? [] : readBaseline();
  if (args.has("--update-baseline")) {
    const next = lowerBaseline(hits, baseline);
    fs.writeFileSync(BASELINE_FILE, `${JSON.stringify(next, null, 2)}\n`);
    console.log(`Baseline rows: ${next.length}`);
    return;
  }

  const committed = args.has("--strict") ? null : committedBaseline();
  if (committed) {
    const raised = raisedAgainstCommitted(baseline, committed);
    if (raised.length > 0) {
      for (const entry of raised) {
        console.error(`${entry.path} ${entry.code} ${entry.slug} baseline count ${entry.count}`);
      }
      console.error("Do not raise the baseline.");
      process.exit(1);
    }
  }

  const { grown } = compareWithBaseline(hits, baseline);
  if (grown.length === 0) return;
  const grownKeys = new Set(grown.map((entry) => `${entry.path}\0${entry.code}\0${entry.slug}`));
  for (const hit of hits) {
    if (!grownKeys.has(`${hit.path}\0${hit.code}\0${hit.slug}`)) continue;
    console.error(`${hit.path}:${hit.line} ${hit.code} ${hit.slug}`);
  }
  console.error("Move the code into src/variants/owned/<slug>/ or a domain setting. Do not raise the baseline.");
  process.exit(1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
