#!/usr/bin/env node
/**
 * Fail-closed Playwright gate for `npm run precommit`.
 * Loads `.env.local.e2e` only (never tenant `.env.local.nago` / golden).
 * Escape hatch: SKIP_E2E=1 (explicit only — see .cursor/rules/34-precommit-e2e.mdc).
 *
 * Isolation rules mirror `e2e/env.ts` (keep in sync; covered by Vitest on the TS module).
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const E2E_ENV_FILE = path.join(ROOT, ".env.local.e2e");
const SEED_SQL = path.join(ROOT, "supabase/seeds/e2e/seed-admin.sql");
const E2E_DEFAULT_PORT = 3100;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** @param {string} raw */
function parseDotenvContents(raw) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/** @param {NodeJS.ProcessEnv} env */
function resolveE2eIsolation(env) {
  const stack = (env.E2E_STACK ?? "").trim().toLowerCase();
  if (stack !== "isolated") {
    return {
      ok: false,
      reason:
        "E2E_STACK must be 'isolated'. Do not point Playwright at shared tenant DBs (nago/golden/prod). See docs/runbooks/e2e-isolated-harness.md",
    };
  }

  const geTarget = (env.GE_DEV_TARGET ?? "").trim().toLowerCase();
  if (geTarget && geTarget !== "e2e") {
    return {
      ok: false,
      reason: `GE_DEV_TARGET=${geTarget} is a product tenant. Use GE_DEV_TARGET=e2e with .env.local.e2e only.`,
    };
  }

  const port = (env.E2E_PORT ?? String(E2E_DEFAULT_PORT)).trim() || String(E2E_DEFAULT_PORT);
  const baseURL = (env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`).trim();
  let host = null;
  try {
    host = new URL(baseURL).hostname.toLowerCase();
  } catch {
    host = null;
  }
  if (!host || !LOCAL_HOSTS.has(host)) {
    return {
      ok: false,
      reason: `PLAYWRIGHT_BASE_URL host '${host ?? "invalid"}' is not local.`,
    };
  }

  const email = (env.E2E_ADMIN_EMAIL ?? "").trim();
  const password = (env.E2E_ADMIN_PASSWORD ?? "").trim();
  if (!email || !password) {
    return {
      ok: false,
      reason: "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD missing in .env.local.e2e",
    };
  }

  return {
    ok: true,
    baseURL,
    locale: (env.E2E_LOCALE ?? "es").trim() || "es",
  };
}

/** Newest mtime under `target` (file or directory), or 0 when absent. */
function newestMtime(target) {
  let newest = 0;
  /** @param {string} p */
  const walk = (p) => {
    let st;
    try {
      st = statSync(p);
    } catch {
      return;
    }
    if (st.isDirectory()) {
      for (const entry of readdirSync(p)) walk(path.join(p, entry));
      return;
    }
    if (st.mtimeMs > newest) newest = st.mtimeMs;
  };
  walk(target);
  return newest;
}

/**
 * Rebuild `.next-e2e` unless it is strictly newer than every build input.
 * Fail-closed: any doubt (missing BUILD_ID, unreadable path) rebuilds, because a stale
 * bundle would let the gate pass against code that is not what gets committed.
 */
function needsE2eBuild() {
  const buildId = path.join(ROOT, ".next-e2e", "BUILD_ID");
  let builtAt;
  try {
    builtAt = statSync(buildId).mtimeMs;
  } catch {
    return true;
  }
  // `public/` is intentionally absent: `next start` serves it from disk at request time, and
  // the one build-time consumer (Serwist) is disabled for e2e. Including it would force a
  // rebuild on every precommit, since `npm run build` regenerates `public/sw.js` just before.
  const inputs = [
    "src",
    "middleware.ts",
    "next.config.ts",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    ".env.local.e2e",
  ];
  const newestInput = Math.max(...inputs.map((rel) => newestMtime(path.join(ROOT, rel))));
  if (newestInput >= builtAt) return true;
  console.log("→ E2E precommit: .next-e2e está al día, se reutiliza (sin rebuild)");
  return false;
}

/**
 * Re-apply the e2e fixture seed (~1s) so the suite is idempotent.
 * Specs mutate shared fixtures — `critical-parent-ward-email` renames
 * `e2e-student@example.test` to a random address — so without this the second run in a row
 * fails in `auth.setup.ts` (student login) and every project is blocked behind it.
 * `seed-admin.sql` matches fixtures by email *or* DNI precisely so it can restore them.
 * @param {NodeJS.ProcessEnv} env
 */
function reseedFixtures(env) {
  const dbUrl = (env.DATABASE_URL ?? "").trim();
  if (!dbUrl) {
    fail("DATABASE_URL missing in .env.local.e2e — cannot reseed fixtures before Playwright.");
  }
  if (!existsSync(SEED_SQL)) {
    fail(`Missing seed file: ${path.relative(ROOT, SEED_SQL)}`);
  }
  const psql =
    env.PSQL_PATH?.trim() ||
    (existsSync("/opt/homebrew/opt/libpq/bin/psql")
      ? "/opt/homebrew/opt/libpq/bin/psql"
      : "psql");

  const r = spawnSync(psql, [dbUrl, "-q", "-v", "ON_ERROR_STOP=1", "-f", SEED_SQL], {
    cwd: ROOT,
    env,
    encoding: "utf8",
    stdio: "pipe",
  });
  if (r.error) {
    fail(`Could not run psql (${psql}): ${r.error.message}. Is the e2e stack up?`);
  }
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout || "");
    fail("Fixture reseed failed — run `npm run e2e:stack:up` to rebuild the isolated stack.");
  }
  console.log("→ E2E precommit: fixtures reseeded");
}

/** Lo que este proceso levantó — y por lo tanto lo único que debe bajar. */
const started = { colima: false, supabase: false };

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: opts.quiet ? "pipe" : "inherit",
    ...opts,
  });
}

function dockerResponds() {
  return run("docker", ["info"], { quiet: true }).status === 0;
}

function supabaseRunning() {
  const r = run("docker", ["ps", "--format", "{{.Names}}"], { quiet: true });
  return r.status === 0 && /supabase_db_/.test(r.stdout ?? "");
}

/** Versiones (`001`, `173`, …) de `supabase/migrations/NNN_*.sql`. `masterdb.sql` no cuenta. */
function migrationVersionsOnDisk() {
  const dir = path.join(ROOT, "supabase", "migrations");
  const out = new Set();
  for (const f of readdirSync(dir)) {
    const m = /^(\d+)_.*\.sql$/.exec(f);
    if (m) out.add(m[1]);
  }
  return out;
}

/** true si el disco tiene migraciones que la BD no aplicó (o no se puede saber). */
function migrationsStale(psql, dbUrl) {
  const r = run(psql, [dbUrl, "-tA", "-c", "select version from supabase_migrations.schema_migrations;"], {
    quiet: true,
  });
  if (r.status !== 0) return true;
  const applied = new Set(
    (r.stdout ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  );
  for (const v of migrationVersionsOnDisk()) {
    if (!applied.has(v)) return true;
  }
  return false;
}

function resolvePsql() {
  return (
    process.env.PSQL_PATH?.trim() ||
    (existsSync("/opt/homebrew/opt/libpq/bin/psql")
      ? "/opt/homebrew/opt/libpq/bin/psql"
      : "psql")
  );
}

/** `e2e:stack:up` completo: reset + seed + reescribe `.env.local.e2e`. Minutos, no segundos. */
function fullStackUp(why) {
  console.log(`→ E2E precommit: ${why} — corriendo e2e:stack:up completo`);
  const r = run("npm", ["run", "e2e:stack:up"]);
  if (r.status !== 0) {
    fail("e2e:stack:up falló — revisá Docker/Colima y volvé a intentar.");
  }
}

/**
 * Levanta lo que falte para que el gate pueda correr solo.
 * El volumen de Docker sobrevive a `supabase stop`, así que reiniciar (~78s) no necesita
 * `db reset`; solo se paga el `e2e:stack:up` completo si falta el env o el esquema quedó viejo.
 */
function ensureStack() {
  if (!dockerResponds()) {
    console.log("→ E2E precommit: Docker no responde — colima start");
    if (run("colima", ["start"]).status !== 0) {
      fail("No pude arrancar Colima. Instalá/arrancá un runtime de Docker y reintentá.");
    }
    started.colima = true;
    if (!dockerResponds()) {
      fail("Colima arrancó pero Docker sigue sin responder.");
    }
  }

  if (!supabaseRunning()) {
    console.log("→ E2E precommit: Supabase local apagado — supabase start");
    if (run("npx", ["supabase", "start"]).status !== 0) {
      fail("`supabase start` falló — probá `npm run e2e:stack:up`.");
    }
    started.supabase = true;
  }

  if (!existsSync(E2E_ENV_FILE)) {
    fullStackUp(`falta ${path.relative(ROOT, E2E_ENV_FILE)}`);
    return;
  }

  const dbUrl = parseDotenvContents(readFileSync(E2E_ENV_FILE, "utf8")).DATABASE_URL?.trim();
  if (!dbUrl || migrationsStale(resolvePsql(), dbUrl)) {
    fullStackUp("la BD local tiene migraciones pendientes");
  }
}

/** Baja solo lo que levantamos, para no matar un stack que el usuario dejó corriendo. */
function teardownStack() {
  if ((process.env.E2E_STACK_KEEP ?? "").trim() === "1") {
    if (started.supabase || started.colima) {
      console.log("→ E2E_STACK_KEEP=1 — dejo el stack arriba");
    }
    return;
  }
  if (started.supabase) {
    console.log("→ E2E precommit: bajando Supabase local (lo levantó este gate)");
    run("npm", ["run", "e2e:stack:down"], { quiet: true });
    started.supabase = false;
  }
  if (started.colima) {
    console.log("→ E2E precommit: deteniendo Colima (lo levantó este gate)");
    run("colima", ["stop"], { quiet: true });
    started.colima = false;
  }
}

/** @param {string} msg */
function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  console.error("  Docs: docs/runbooks/e2e-isolated-harness.md");
  console.error("  Escape (WIP only, ask user first): SKIP_E2E=1 npm run precommit\n");
  teardownStack();
  process.exit(1);
}

function main() {
  if ((process.env.SKIP_E2E ?? "").trim() === "1") {
    console.warn(
      "⚠ SKIP_E2E=1 — Playwright gate skipped. Do not use for merge-ready commits without explicit user approval.",
    );
    process.exit(0);
  }

  // El gate se administra su propio stack: levanta lo que falte y al final baja solo eso.
  ensureStack();

  if (!existsSync(E2E_ENV_FILE)) {
    fail(
      `Missing ${path.relative(ROOT, E2E_ENV_FILE)}. Copy from .env.example, point at a dedicated e2e Supabase project, seed E2E_ADMIN_* credentials.`,
    );
  }

  const fileVars = parseDotenvContents(readFileSync(E2E_ENV_FILE, "utf8"));
  /** @type {NodeJS.ProcessEnv} */
  const env = { ...process.env, ...fileVars };

  env.E2E_STACK = "isolated";
  env.GE_DEV_TARGET = "e2e";
  env.E2E_REQUIRE = "1";
  // Fail-closed: never let shell/tenant RESEND_* leak into the e2e Next process.
  env.EMAIL_PROVIDER = "recording";
  delete env.RESEND_API_KEY;
  delete env.RESEND_FROM_EMAIL;
  env.E2E_PORT = (env.E2E_PORT ?? String(E2E_DEFAULT_PORT)).trim() || String(E2E_DEFAULT_PORT);
  env.PLAYWRIGHT_BASE_URL =
    (env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${env.E2E_PORT}`).trim();
  env.PLAYWRIGHT_HTML_OPEN = "never";

  const isolation = resolveE2eIsolation(env);
  if (!isolation.ok) {
    fail(isolation.reason);
  }

  console.log(`→ E2E precommit: isolated stack @ ${isolation.baseURL}`);

  // Optional cold cache (E2E_COLD=1). Default keeps `.next-e2e` so webpack does not
  // recompile every route from scratch — full-suite timeouts were cascading under wipe.
  // Do not wipe tenant `.next` — parallel `dev:mozarthitos` / `dev:nago` keep their own cache.
  if ((env.E2E_COLD ?? "").trim() === "1") {
    rmSync(path.join(ROOT, ".next-e2e"), { recursive: true, force: true });
    console.log("→ E2E_COLD=1 — wiped .next-e2e");
  }

  // Playwright serves `next start` from `.next-e2e`; build it first. `next dev` used to
  // compile routes on demand (~17s per first hit), which timed out auth.setup.ts.
  if ((env.E2E_SKIP_BUILD ?? "").trim() !== "1" && needsE2eBuild()) {
    console.log("→ E2E precommit: building .next-e2e (E2E_SKIP_BUILD=1 to reuse)");
    const build = spawnSync("npx", ["next", "build", "--webpack"], {
      cwd: ROOT,
      env,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (build.error) {
      fail(`next build failed to start: ${build.error.message}`);
    }
    if (build.status !== 0) {
      fail(`next build failed (exit ${build.status}) — Playwright needs .next-e2e to serve.`);
    }
  }

  if ((env.E2E_SKIP_SEED ?? "").trim() !== "1") {
    reseedFixtures(env);
  }

  const extraArgs = process.argv.slice(2);
  const child = spawn("npx", ["playwright", "test", ...extraArgs], {
    cwd: ROOT,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("exit", (code, signal) => {
    teardownStack();
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

// Ctrl+C / kill durante los tests no debe dejar el stack colgado.
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    teardownStack();
    process.exit(1);
  });
}

main();
