#!/usr/bin/env node
/**
 * Fail-closed Playwright gate for `npm run precommit`.
 * Loads `.env.local.e2e` only (never tenant `.env.local.nago` / golden).
 * Escape hatch: SKIP_E2E=1 (explicit only — see .cursor/rules/34-precommit-e2e.mdc).
 *
 * Isolation rules mirror `e2e/env.ts` (keep in sync; covered by Vitest on the TS module).
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const E2E_ENV_FILE = path.join(ROOT, ".env.local.e2e");
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

/** @param {string} msg */
function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  console.error("  Docs: docs/runbooks/e2e-isolated-harness.md");
  console.error("  Escape (WIP only, ask user first): SKIP_E2E=1 npm run precommit\n");
  process.exit(1);
}

function main() {
  if ((process.env.SKIP_E2E ?? "").trim() === "1") {
    console.warn(
      "⚠ SKIP_E2E=1 — Playwright gate skipped. Do not use for merge-ready commits without explicit user approval.",
    );
    process.exit(0);
  }

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
  env.E2E_PORT = (env.E2E_PORT ?? String(E2E_DEFAULT_PORT)).trim() || String(E2E_DEFAULT_PORT);
  env.PLAYWRIGHT_BASE_URL =
    (env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${env.E2E_PORT}`).trim();
  env.PLAYWRIGHT_HTML_OPEN = "never";

  const isolation = resolveE2eIsolation(env);
  if (!isolation.ok) {
    fail(isolation.reason);
  }

  console.log(`→ E2E precommit: isolated stack @ ${isolation.baseURL}`);

  // Fresh E2E-only Next cache (next.config distDir=.next-e2e when GE_DEV_TARGET=e2e).
  // Do not wipe tenant `.next` — parallel `dev:mozarthitos` / `dev:nago` keep their own cache.
  rmSync(path.join(ROOT, ".next-e2e"), { recursive: true, force: true });

  const child = spawn("npx", ["playwright", "test"], {
    cwd: ROOT,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 1);
  });
}

main();
