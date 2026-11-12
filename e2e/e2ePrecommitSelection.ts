import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

export const E2E_PRECOMMIT_CACHE_FILE = ".e2e-precommit-cache.json";

const SKIP_DIR = new Set(["node_modules", ".next", ".next-e2e", "__tests__", "test-results"]);

export type E2eSpecStatus = "passed" | "failed";

export type E2ePrecommitCache = {
  productHash: string;
  /** True only after a full `vitest run --coverage` exits 0 for this product hash. */
  coverageOk?: boolean;
  tests: Record<string, { status: E2eSpecStatus; fileHash: string }>;
};

type SelectInput = {
  specFiles: string[];
  cache: E2ePrecommitCache | null;
  productHash: string;
  fileHashes: Record<string, string>;
};

/**
 * Keep a spec file when it failed, never ran, or its source changed.
 * A passed file stays skipped only while the product tree hash matches.
 */
export function selectE2eSpecFiles(input: SelectInput): string[] {
  const { specFiles, cache, productHash, fileHashes } = input;
  if (!cache || cache.productHash !== productHash) return specFiles.slice();
  return specFiles.filter((file) => {
    const entry = cache.tests[file];
    if (!entry || entry.status !== "passed") return true;
    return entry.fileHash !== fileHashes[file];
  });
}

export function mergeE2eCache(input: {
  cache: E2ePrecommitCache | null;
  productHash: string;
  fileHashes: Record<string, string>;
  outcomes: Record<string, E2eSpecStatus>;
}): E2ePrecommitCache {
  const tests =
    input.cache && input.cache.productHash === input.productHash
      ? { ...input.cache.tests }
      : {};
  for (const [file, status] of Object.entries(input.outcomes)) {
    tests[file] = { status, fileHash: input.fileHashes[file] ?? "" };
  }
  return { productHash: input.productHash, tests };
}

type PwSuite = {
  file?: string;
  specs?: Array<{ ok?: boolean; tests?: Array<{ results?: Array<{ status?: string }> }> }>;
  suites?: PwSuite[];
};

/** A file fails when any spec in it failed. Skipped-only specs do not count as a pass. */
export function outcomesFromPlaywrightReport(report: {
  suites?: PwSuite[];
}): Record<string, E2eSpecStatus> {
  const acc: Record<string, E2eSpecStatus> = {};
  for (const suite of report.suites ?? []) walkSuite(suite, acc);
  return acc;
}

function walkSuite(suite: PwSuite, acc: Record<string, E2eSpecStatus>): void {
  const specFile = specPath(suite.file);
  for (const spec of suite.specs ?? []) {
    if (!specFile) continue;
    if (spec.ok === false) {
      acc[specFile] = "failed";
      continue;
    }
    if (acc[specFile] === "failed" || skippedOnly(spec)) continue;
    acc[specFile] = "passed";
  }
  for (const child of suite.suites ?? []) walkSuite(child, acc);
}

function skippedOnly(spec: NonNullable<PwSuite["specs"]>[number]): boolean {
  const tests = spec.tests ?? [];
  if (tests.length === 0) return true;
  return tests.every((test) => {
    const results = test.results ?? [];
    return results.length > 0 && results.every((result) => result.status === "skipped");
  });
}

function specPath(file: string | undefined): string {
  if (!file) return "";
  const normalized = file.replace(/\\/g, "/");
  const at = normalized.lastIndexOf("e2e/");
  if (at < 0 || !normalized.endsWith(".spec.ts")) return "";
  return normalized.slice(at);
}

export function hashFile(absPath: string): string {
  return createHash("sha1").update(readFileSync(absPath)).digest("hex");
}

export function hashProductTree(root: string): string {
  const hash = createHash("sha1");
  const found: string[] = [];
  for (const rel of ["src", "supabase/migrations", "supabase/seeds/e2e", "e2e/helpers"]) {
    collectFiles(path.join(root, rel), root, found);
  }
  for (const rel of [
    "e2e/env.ts",
    "e2e/auth.setup.ts",
    "playwright.config.ts",
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "middleware.ts",
  ]) {
    if (existsSync(path.join(root, rel))) found.push(rel);
  }
  found.sort();
  for (const rel of found) {
    hash.update(rel);
    hash.update("\0");
    hash.update(readFileSync(path.join(root, rel)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function collectFiles(dir: string, root: string, out: string[]): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue;
    if (name.endsWith(".test.ts") || name.endsWith(".test.tsx")) continue;
    const abs = path.join(dir, name);
    if (statSync(abs).isDirectory()) {
      collectFiles(abs, root, out);
      continue;
    }
    out.push(path.relative(root, abs).split(path.sep).join("/"));
  }
}

export function listE2eSpecFiles(e2eDir: string): string[] {
  const found: string[] = [];
  collectFiles(e2eDir, path.dirname(e2eDir), found);
  return found
    .filter((file) => file.endsWith(".spec.ts") && !file.includes("/clients/"))
    .sort();
}

export function readE2eCache(file: string): E2ePrecommitCache | null {
  if (!existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8")) as E2ePrecommitCache;
    if (!parsed || typeof parsed.productHash !== "string" || !parsed.tests) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeE2eCache(file: string, cache: E2ePrecommitCache): void {
  writeFileSync(file, `${JSON.stringify(cache)}\n`);
}

const UNIT_CACHE_FILE = ".unit-precommit-cache.json";

export const UNIT_PRECOMMIT_CACHE_FILE = UNIT_CACHE_FILE;

/** Hash the product inputs that can change unit behavior or coverage. Test files stay out. */
export function hashUnitProductTree(root: string): string {
  const hash = createHash("sha1");
  const found: string[] = [];
  for (const rel of ["src", "supabase/migrations", "supabase/pulsar-migrations"]) {
    collectFiles(path.join(root, rel), root, found);
  }
  for (const rel of ["vitest.config.ts", "package.json", "package-lock.json"]) {
    if (existsSync(path.join(root, rel))) found.push(rel);
  }
  found.sort();
  for (const rel of found) {
    hash.update(rel);
    hash.update("\0");
    hash.update(readFileSync(path.join(root, rel)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function listUnitTestFiles(srcDir: string): string[] {
  const root = path.dirname(srcDir);
  const found: string[] = [];
  walkUnitTests(srcDir, root, found);
  return found.sort();
}

function walkUnitTests(dir: string, root: string, out: string[]): void {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".next-e2e") continue;
    const abs = path.join(dir, name);
    if (statSync(abs).isDirectory()) {
      walkUnitTests(abs, root, out);
      continue;
    }
    if (name.endsWith(".test.ts") || name.endsWith(".test.tsx")) {
      out.push(path.relative(root, abs).split(path.sep).join("/"));
    }
  }
}

/** A file fails when Vitest marks the file failed. Any other status is not a pass. */
export function outcomesFromVitestReport(report: {
  testResults?: Array<{ name?: string; status?: string }>;
}): Record<string, E2eSpecStatus> {
  const acc: Record<string, E2eSpecStatus> = {};
  for (const result of report.testResults ?? []) {
    const name = (result.name ?? "").replace(/\\/g, "/");
    const at = name.lastIndexOf("src/");
    if (at < 0) continue;
    const file = name.slice(at);
    if (!file.endsWith(".test.ts") && !file.endsWith(".test.tsx")) continue;
    acc[file] = result.status === "passed" ? "passed" : "failed";
  }
  return acc;
}
