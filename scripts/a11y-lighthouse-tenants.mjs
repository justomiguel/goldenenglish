#!/usr/bin/env node
/**
 * Runs Lighthouse (performance + accessibility) for each `{ slug, url }` in a JSON manifest.
 *
 * What this verifies: Lighthouse Accessibility + Performance scores per URL — useful across
 * tenants when each URL resolves a distinct deploy or local brand overlay.
 *
 * What this does NOT replace: systematic keyboard traversal, visible focus audits, axe on every
 * dialog, form error semantics, or full WCAG 2.2 human review (`docs/runbooks/accessibility-multi-tenant.md`).
 */
import { readFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import net from "node:net";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const LH_PKG = "lighthouse@12";
const OUT_DIR = path.join(ROOT, ".lighthouse");

function parseArgs() {
  const argv = process.argv.slice(2);
  let manifestPath = null;
  let minAccessibility = NaN;
  let minPerformance = NaN;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--min-accessibility" && argv[i + 1]) {
      minAccessibility = Number(argv[i + 1]);
      i++;
    } else if (a === "--min-performance" && argv[i + 1]) {
      minPerformance = Number(argv[i + 1]);
      i++;
    } else if (!a.startsWith("-") && !manifestPath) {
      manifestPath = path.resolve(process.cwd(), a);
    }
  }
  return { manifestPath, minAccessibility, minPerformance };
}

function defaultManifestPath() {
  const local = path.join(ROOT, "scripts/a11y-lighthouse-manifest.local.json");
  if (existsSync(local)) return local;
  const sample = path.join(ROOT, "scripts/a11y-lighthouse-manifest.example.json");
  if (existsSync(sample)) {
    console.warn(
      `[a11y-lighthouse] Using ${path.relative(ROOT, sample)} — copy to scripts/a11y-lighthouse-manifest.local.json and set real URLs (gitignored).\n`,
    );
    return sample;
  }
  return null;
}

function loadManifest(manifestPath) {
  const raw = readFileSync(manifestPath, "utf8");
  /** @type {unknown} */
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Manifest root must be a JSON array.");
  }
  const entries = [];
  for (const row of parsed) {
    if (!row || typeof row !== "object") continue;
    const slug =
      typeof row.slug === "string" && row.slug.trim().length ? row.slug.trim() : "";
    const url =
      typeof row.url === "string" && row.url.trim().length ? row.url.trim() : "";
    if (!slug || !url) continue;
    try {
      void new URL(url);
    } catch {
      throw new Error(`Invalid url for slug "${slug}": ${url}`);
    }
    entries.push({ slug, url });
  }
  if (!entries.length) {
    throw new Error(
      'Manifest has no usable entries (need `{ "slug", "url" }` objects).',
    );
  }
  return entries;
}

/**
 * @param {number} port
 * @param {string} host
 * @param {number} ms
 */
function tcpReachable(port, host, ms) {
  return new Promise((resolve) => {
    const sock = net.createConnection({ port, host }, () => {
      sock.end();
      resolve(true);
    });
    sock.setTimeout(ms, () => {
      sock.destroy();
      resolve(false);
    });
    sock.on("error", () => resolve(false));
  });
}

/** Chrome/Lighthouse often hits NO_FCP on `127.0.0.1`; `localhost` is reliable for Next dev */
function lighthouseTargetUrl(originalUrlStr) {
  try {
    const u = new URL(originalUrlStr);
    if (u.hostname === "127.0.0.1") {
      u.hostname = "localhost";
      const next = u.toString();
      if (next !== originalUrlStr) {
        console.warn(
          `  Lighthouse: using ${next} instead of ${originalUrlStr} (avoids Chromium NO_FCP on 127.0.0.1).\n`,
        );
      }
      return next;
    }
  } catch {
    /* fall through — runOne surfaces invalid URLs */
  }
  return originalUrlStr;
}

/** Warn when common local dev URLs have nothing accepting connections */
async function warnIfLocalUnreachable(urlStr) {
  let u;
  try {
    u = new URL(urlStr);
  } catch {
    return;
  }
  const hn = u.hostname.toLowerCase();
  if (hn !== "localhost" && hn !== "127.0.0.1") return;

  let connectPort;
  if (u.port !== "") {
    connectPort = Number(u.port);
  } else if (u.protocol === "https:") {
    connectPort = 443;
  } else {
    /** Next.js local default (`next dev`), not port 80 */
    connectPort = 3000;
  }

  const connectHost = hn === "localhost" ? "127.0.0.1" : hn;
  const ok = await tcpReachable(connectPort, connectHost, 2000);
  if (!ok) {
    console.error(
      `  WARN: Nothing accepted TCP on ${connectHost}:${connectPort}. Start Next first (e.g. npm run dev:golden), then rerun.\n`,
    );
  }
}

function runOne(entry, index) {
  const safeSlug = entry.slug.replace(/[^\w.-]+/g, "_");
  const jsonOut = path.join(
    OUT_DIR,
    `a11y-report-${safeSlug}-${index}-${Date.now()}.json`,
  );
  mkdirSync(OUT_DIR, { recursive: true });

  const auditedUrl = lighthouseTargetUrl(entry.url);

  const npmResult = spawnSync(
    "npx",
    [
      "--yes",
      LH_PKG,
      auditedUrl,
      "--preset=desktop",
      "--only-categories=performance,accessibility",
      "--max-wait-for-load=120000",
      "--output=json",
      `--output-path=${jsonOut}`,
      "--chrome-flags=--headless=new --no-sandbox",
      "--quiet",
    ],
    {
      cwd: ROOT,
      stdio: ["ignore", "inherit", "inherit"],
      env: { ...process.env },
      shell: false,
    },
  );

  if (
    npmResult.error ||
    npmResult.status !== 0 ||
    !existsSync(jsonOut)
  ) {
    rmSync(jsonOut, { force: true });
    console.error(
      `     If this was HTTP locally: ensure Next is up and "${entry.url}" returns 200 in a browser.`,
    );
    console.error(
      `     If this was HTTPS: wrong host/status (404 DNS) yields the same Lighthouse exit — fix the URL in the manifest.`,
    );
    return {
      slug: entry.slug,
      url: entry.url,
      ok: false,
      accessibility: NaN,
      performance: NaN,
      jsonOut: null,
    };
  }

  /** @type {{ categories?: { accessibility?: { score?: number|null }; performance?: { score?: number|null } } }} */
  const report = JSON.parse(readFileSync(jsonOut, "utf8"));
  const acc = report.categories?.accessibility?.score;
  const perf = report.categories?.performance?.score;
  const accessibility =
    typeof acc === "number" && !Number.isNaN(acc) ? acc : NaN;
  const performance =
    typeof perf === "number" && !Number.isNaN(perf) ? perf : NaN;

  rmSync(jsonOut, { force: true });

  return {
    slug: entry.slug,
    url: entry.url,
    ok: Number.isFinite(accessibility) && Number.isFinite(performance),
    accessibility,
    performance,
    jsonOut: null,
  };
}

function pct(score) {
  if (score == null || Number.isNaN(score)) return "n/a";
  return `${Math.round(score * 100)}`;
}

async function main() {
  let { manifestPath, minAccessibility, minPerformance } = parseArgs();
  if (!manifestPath) manifestPath = defaultManifestPath();
  if (!manifestPath || !existsSync(manifestPath)) {
    console.error(
      "Usage: node scripts/a11y-lighthouse-tenants.mjs [--min-accessibility 0.9] [--min-performance 0] <manifest.json>\n\n" +
        "Default manifest: scripts/a11y-lighthouse-manifest.local.json if present,\n" +
        "else scripts/a11y-lighthouse-manifest.example.json (replace URLs).\n",
    );
    process.exit(1);
  }

  const entries = loadManifest(manifestPath);

  console.log(
    `\n[a11y-lighthouse] ${entries.length} URL(s) from ${path.relative(ROOT, manifestPath)}\n`,
  );

  const rows = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    await warnIfLocalUnreachable(entry.url);
    const row = runOne(entry, i);
    rows.push(row);
    const line = `[${row.slug}] accessibility=${pct(row.accessibility)} performance=${pct(row.performance)} — ${row.url}`;
    console.log(row.ok ? line : `[${row.slug}] FAILED — ${row.url}`);
  }

  let exitCode = 0;
  for (const row of rows) {
    if (!row.ok) exitCode = 1;
    if (
      Number.isFinite(minAccessibility) &&
      !(Number.isFinite(row.accessibility) && row.accessibility + 1e-9 >= minAccessibility)
    ) {
      console.error(
        `[${row.slug}] accessibility score ${pct(row.accessibility)} below minimum ${pct(minAccessibility)}`,
      );
      exitCode = 1;
    }
    if (
      Number.isFinite(minPerformance) &&
      !(Number.isFinite(row.performance) && row.performance + 1e-9 >= minPerformance)
    ) {
      console.error(
        `[${row.slug}] performance score ${pct(row.performance)} below minimum ${pct(minPerformance)}`,
      );
      exitCode = 1;
    }
  }

  console.log("");
  console.table(
    rows.map((r) => ({
      slug: r.slug,
      accessibilityPct: pct(r.accessibility),
      performancePct: pct(r.performance),
      ok: r.ok,
    })),
  );

  if (exitCode !== 0) {
    console.error(
      "\n[a11y-lighthouse] One or more runs failed thresholds or Lighthouse.\n",
    );
  }
  process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
