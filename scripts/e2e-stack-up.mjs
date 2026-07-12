#!/usr/bin/env node
/**
 * Start local Supabase (Docker), wait for storage schema, reset DB (migrations),
 * seed e2e admin, write gitignored `.env.local.e2e`.
 *
 * Prereq: Docker runtime (Colima or Docker Desktop).
 *   brew install colima docker && colima start
 *   npm run e2e:stack:up
 */
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_ENV = path.join(ROOT, ".env.local.e2e");
const SEED_SQL = path.join(ROOT, "supabase/seeds/e2e/seed-admin.sql");
const CONFIG = path.join(ROOT, "supabase/config.toml");
const WRITE_ENV = path.join(ROOT, "scripts/e2e-write-env-from-status.mts");
const TEMP_DIR = path.join(ROOT, "supabase/.temp");

function pinLocalImageTags() {
  if (!existsSync(TEMP_DIR)) return;
  // Match current CLI defaults / linked hints — avoid broken or too-old tags.
  writeFileSync(path.join(TEMP_DIR, "storage-version"), "v1.65.1\n");
  writeFileSync(path.join(TEMP_DIR, "gotrue-version"), "v2.192.0\n");
}

function run(cmd, args, opts = {}) {
  console.log(`→ ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: opts.capture ? "pipe" : "inherit",
    env: opts.env ?? process.env,
    shell: process.platform === "win32",
  });
  if (r.status !== 0 && !opts.allowFail) {
    if (opts.capture) {
      if (r.stderr) console.error(r.stderr);
      if (r.stdout) console.error(r.stdout);
    }
    process.exit(r.status ?? 1);
  }
  return r;
}

function assertDocker() {
  const r = spawnSync("docker", ["info"], { encoding: "utf8", stdio: "pipe" });
  if (r.status !== 0) {
    console.error(`
❌ Docker is not running.

  brew install colima docker
  colima start
  npm run e2e:stack:up
`);
    process.exit(1);
  }
}

function setMigrationsEnabled(enabled) {
  let raw = readFileSync(CONFIG, "utf8");
  if (!/\[db\.migrations\][\s\S]*?enabled\s*=/.test(raw)) {
    console.error("config.toml missing [db.migrations] enabled");
    process.exit(1);
  }
  raw = raw.replace(
    /(\[db\.migrations\][\s\S]*?enabled\s*=\s*)(true|false)/,
    `$1${enabled ? "true" : "false"}`,
  );
  writeFileSync(CONFIG, raw, "utf8");
}

function waitForStorage(attempts = 60) {
  console.log("→ waiting for storage.buckets (storage-api schema)…");
  for (let i = 0; i < attempts; i++) {
    const r = spawnSync(
      "supabase",
      [
        "db",
        "query",
        "--local",
        "select to_regclass('storage.buckets')::text as reg",
      ],
      { cwd: ROOT, encoding: "utf8", stdio: "pipe" },
    );
    const out = `${r.stdout || ""}${r.stderr || ""}`;
    if (r.status === 0 && out.includes("storage.buckets")) {
      console.log("   storage.buckets ready");
      return;
    }
    spawnSync("sleep", ["2"]);
  }
  console.error("Timed out waiting for storage.buckets. Is storage-api healthy?");
  process.exit(1);
}

function main() {
  assertDocker();
  pinLocalImageTags();

  if (!existsSync(CONFIG)) {
    console.error("Missing supabase/config.toml — run `supabase init` in the repo root.");
    process.exit(1);
  }

  setMigrationsEnabled(false);
  try {
    run("supabase", ["stop"], { allowFail: true });
    run("supabase", ["start"]);
    waitForStorage();
  } finally {
    setMigrationsEnabled(true);
  }

  run("supabase", ["db", "reset", "--yes"]);

  if (!existsSync(SEED_SQL)) {
    console.error(`Missing seed file: ${SEED_SQL}`);
    process.exit(1);
  }

  const statusRawForDb = run("supabase", ["status", "-o", "env"], { capture: true }).stdout || "";
  const dbUrlLine = statusRawForDb.split("\n").find((l) => l.startsWith("DB_URL="));
  const dbUrl = dbUrlLine?.slice("DB_URL=".length).trim();
  if (!dbUrl) {
    console.error("Could not resolve DB_URL to seed admin");
    process.exit(1);
  }
  const psql =
    process.env.PSQL_PATH?.trim() ||
    (existsSync("/opt/homebrew/opt/libpq/bin/psql")
      ? "/opt/homebrew/opt/libpq/bin/psql"
      : "psql");
  run(psql, [dbUrl, "-v", "ON_ERROR_STOP=1", "-f", SEED_SQL]);

  // Resolve fixture ids for Playwright (cohort / section).
  const idsRaw =
    run(
      psql,
      [
        dbUrl,
        "-tA",
        "-c",
        "SELECT c.id::text || '|' || COALESCE(s.id::text,'') FROM public.academic_cohorts c LEFT JOIN public.academic_sections s ON s.cohort_id = c.id AND s.name = 'E2E Section A' WHERE c.slug = 'e2e-cohort' LIMIT 1;",
      ],
      { capture: true },
    ).stdout || "";
  const [cohortId, sectionId] = idsRaw.trim().split("|");

  const statusRaw = run("supabase", ["status", "-o", "env"], { capture: true }).stdout || "";
  const write = run("npx", ["--yes", "tsx", WRITE_ENV], {
    capture: true,
    env: {
      ...process.env,
      __SUPABASE_STATUS_ENV: statusRaw,
      __E2E_COHORT_ID: (cohortId || "").trim(),
      __E2E_SECTION_ID: (sectionId || "").trim(),
    },
  });

  writeFileSync(OUT_ENV, write.stdout, "utf8");
  console.log(`\n✅ Wrote ${path.relative(ROOT, OUT_ENV)}`);
  console.log("   Admin:   e2e-admin@example.test / E2eLocal!Stack1");
  console.log("   Student: e2e-student@example.test");
  console.log("   Parent:  e2e-parent@example.test");
  if (cohortId?.trim()) console.log(`   Cohort:  ${cohortId.trim()}`);
  console.log("   Next:    npm run test:e2e:precommit\n");
}

main();
