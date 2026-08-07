import { join } from "node:path";

/** Hostnames allowed for Playwright BASE_URL when E2E_STACK=isolated. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Dedicated port so precommit never reuses a tenant `dev:nago` on :3000. */
export const E2E_DEFAULT_PORT = 3100;

export type E2eIsolationResult =
  | { ok: true; baseURL: string; locale: string }
  | { ok: false; reason: string };

function parseHost(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Precommit / CI fail-closed gate (`scripts/run-e2e-precommit.mjs` sets this). */
export function e2eRequireEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.E2E_REQUIRE ?? "").trim() === "1";
}

export function e2eSkipRequested(env: NodeJS.ProcessEnv = process.env): boolean {
  return (env.SKIP_E2E ?? "").trim() === "1";
}

export function defaultE2eBaseURL(env: NodeJS.ProcessEnv = process.env): string {
  const port = (env.E2E_PORT ?? String(E2E_DEFAULT_PORT)).trim() || String(E2E_DEFAULT_PORT);
  return `http://127.0.0.1:${port}`;
}

/**
 * Hard guards so Playwright never silently targets a day-to-day tenant DB
 * (nago / golden / prod). Full-app E2E must opt into E2E_STACK=isolated.
 */
export function resolveE2eIsolation(env: NodeJS.ProcessEnv = process.env): E2eIsolationResult {
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
      reason: `GE_DEV_TARGET=${geTarget} is a product tenant. Use GE_DEV_TARGET=e2e (or unset) with .env.local.e2e only.`,
    };
  }

  const baseURL = (env.PLAYWRIGHT_BASE_URL ?? defaultE2eBaseURL(env)).trim();
  const host = parseHost(baseURL);
  if (!host || !LOCAL_HOSTS.has(host)) {
    return {
      ok: false,
      reason: `PLAYWRIGHT_BASE_URL host '${host ?? "invalid"}' is not local. Isolated E2E allows only localhost / 127.0.0.1.`,
    };
  }

  const email = (env.E2E_ADMIN_EMAIL ?? "").trim();
  const password = (env.E2E_ADMIN_PASSWORD ?? "").trim();
  if (!email || !password) {
    return {
      ok: false,
      reason:
        "Isolated stack selected but E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD missing (seeded admin on the e2e Supabase project only).",
    };
  }

  return {
    ok: true,
    baseURL,
    locale: (env.E2E_LOCALE ?? "es").trim() || "es",
  };
}

/**
 * When E2E_REQUIRE=1, isolation failure must abort (not skip).
 * Returns null when require is off or isolation is ok.
 */
export function e2eRequireFailureMessage(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  if (!e2eRequireEnabled(env)) return null;
  const isolation = resolveE2eIsolation(env);
  if (isolation.ok) return null;
  return `[e2e] E2E_REQUIRE=1 but isolation failed: ${isolation.reason}`;
}

export function e2eAuthPaths() {
  const dir = join(process.cwd(), "e2e", ".auth");
  return {
    dir,
    storageState: join(dir, "admin.json"),
    studentStorageState: join(dir, "student.json"),
    parentStorageState: join(dir, "parent.json"),
    readyMarker: join(dir, "ready"),
  };
}

export function e2eSharedPassword(env: NodeJS.ProcessEnv = process.env): string {
  return (
    (env.E2E_USER_PASSWORD ?? env.E2E_ADMIN_PASSWORD ?? "").trim() || "E2eLocal!Stack1"
  );
}
