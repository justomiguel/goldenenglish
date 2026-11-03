#!/usr/bin/env node
/**
 * Vitest gate for `npm run precommit`.
 * A passed file is skipped while the product hash and the file hash match.
 * Coverage runs in full only when this product hash has no green coverage proof.
 * See .cursor/rules/34-precommit-e2e.mdc.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  UNIT_PRECOMMIT_CACHE_FILE,
  hashFile,
  hashUnitProductTree,
  listUnitTestFiles,
  mergeE2eCache,
  outcomesFromVitestReport,
  readE2eCache,
  selectE2eSpecFiles,
  writeE2eCache,
} from "../e2e/e2ePrecommitSelection.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const cachePath = path.join(ROOT, UNIT_PRECOMMIT_CACHE_FILE);
const reportPath = path.join(ROOT, "test-results/unit-precommit-report.json");

const extraArgs = process.argv.slice(2);
if (extraArgs.length > 0) {
  const child = spawnVitest(extraArgs, false);
  process.exit(child.status ?? 1);
}

const productHash = hashUnitProductTree(ROOT);
const testFiles = listUnitTestFiles(path.join(ROOT, "src"));
const fileHashes = Object.fromEntries(
  testFiles.map((file) => [file, hashFile(path.join(ROOT, file))]),
);
const cache = readE2eCache(cachePath);
const hashMatches = cache?.productHash === productHash;
const coverageOk = hashMatches && cache?.coverageOk === true;
const selected = selectE2eSpecFiles({
  specFiles: testFiles,
  cache,
  productHash,
  fileHashes,
});

if (selected.length === 0 && coverageOk) {
  console.log(`→ Unit precommit: ${testFiles.length} archivos en caché, corro 0`);
  process.exit(0);
}

const proveCoverage = !hashMatches || (selected.length === 0 && !coverageOk);
const toRun = proveCoverage ? testFiles : selected;
console.log(
  `→ Unit precommit: ${testFiles.length - toRun.length} archivos en caché, corro ${toRun.length}${proveCoverage ? " con cobertura" : ""}`,
);
const child = spawnVitest(toRun, proveCoverage);
let exitCode = child.status ?? 1;
recordUnitCache({ productHash, fileHashes, cache, fullCoverage: proveCoverage, exitCode });
if (exitCode === 0 && !proveCoverage && !coverageOk) {
  console.log("→ Unit precommit: los archivos pendientes pasaron. Corro la cobertura completa.");
  const cover = spawnVitest(testFiles, true);
  exitCode = cover.status ?? 1;
  recordUnitCache({ productHash, fileHashes, cache: readE2eCache(cachePath), fullCoverage: true, exitCode });
}
process.exit(exitCode);

function spawnVitest(files, withCoverage) {
  mkdirSync(path.dirname(reportPath), { recursive: true });
  const args = [
    "vitest",
    "run",
    "--reporter=default",
    "--reporter=json",
    `--outputFile.json=${reportPath}`,
  ];
  if (withCoverage) args.push("--coverage");
  args.push(...files);
  return spawnSync("npx", args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
}

function recordUnitCache({ productHash, fileHashes, cache, fullCoverage, exitCode }) {
  if (!existsSync(reportPath)) return;
  try {
    const report = JSON.parse(readFileSync(reportPath, "utf8"));
    const outcomes = outcomesFromVitestReport(report);
    const merged = mergeE2eCache({
      cache,
      productHash,
      fileHashes,
      outcomes,
    });
    const keptCoverage =
      cache?.productHash === productHash && cache.coverageOk === true;
    const nextCoverageOk = fullCoverage ? exitCode === 0 : keptCoverage;
    writeE2eCache(cachePath, { ...merged, coverageOk: nextCoverageOk });
  } catch (error) {
    console.error(
      "[ge:server] unit.precommit.cache",
      error instanceof Error ? error.message : error,
    );
  }
}
