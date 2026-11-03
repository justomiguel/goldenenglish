import { describe, expect, it } from "vitest";
import {
  mergeE2eCache,
  outcomesFromPlaywrightReport,
  outcomesFromVitestReport,
  selectE2eSpecFiles,
} from "../../../e2e/e2ePrecommitSelection";

const files = ["e2e/a.spec.ts", "e2e/b.spec.ts", "e2e/c.spec.ts"];
const hashes = {
  "e2e/a.spec.ts": "aaa",
  "e2e/b.spec.ts": "bbb",
  "e2e/c.spec.ts": "ccc",
};

describe("selectE2eSpecFiles", () => {
  it("runs every spec when the product tree changed", () => {
    const selected = selectE2eSpecFiles({
      specFiles: files,
      productHash: "next",
      fileHashes: hashes,
      cache: {
        productHash: "prev",
        tests: { "e2e/a.spec.ts": { status: "passed", fileHash: "aaa" } },
      },
    });
    expect(selected).toEqual(files);
  });

  it("skips a passed spec and keeps failed, new, and edited specs", () => {
    const selected = selectE2eSpecFiles({
      specFiles: files,
      productHash: "same",
      fileHashes: { ...hashes, "e2e/c.spec.ts": "changed" },
      cache: {
        productHash: "same",
        tests: {
          "e2e/a.spec.ts": { status: "passed", fileHash: "aaa" },
          "e2e/b.spec.ts": { status: "failed", fileHash: "bbb" },
          "e2e/c.spec.ts": { status: "passed", fileHash: "ccc" },
        },
      },
    });
    expect(selected).toEqual(["e2e/b.spec.ts", "e2e/c.spec.ts"]);
  });
});

describe("mergeE2eCache", () => {
  it("keeps earlier passes when this run only executed the failures", () => {
    const next = mergeE2eCache({
      productHash: "same",
      fileHashes: hashes,
      outcomes: { "e2e/b.spec.ts": "passed" },
      cache: {
        productHash: "same",
        tests: { "e2e/a.spec.ts": { status: "passed", fileHash: "aaa" } },
      },
    });
    expect(next.tests["e2e/a.spec.ts"]?.status).toBe("passed");
    expect(next.tests["e2e/b.spec.ts"]?.status).toBe("passed");
  });

  it("drops the old cache when the product hash changes", () => {
    const next = mergeE2eCache({
      productHash: "next",
      fileHashes: hashes,
      outcomes: { "e2e/b.spec.ts": "passed" },
      cache: {
        productHash: "prev",
        tests: { "e2e/a.spec.ts": { status: "passed", fileHash: "aaa" } },
      },
    });
    expect(next.tests["e2e/a.spec.ts"]).toBeUndefined();
  });
});

describe("outcomesFromPlaywrightReport", () => {
  it("marks the whole file failed when one spec failed", () => {
    const outcomes = outcomesFromPlaywrightReport({
      suites: [
        {
          file: "/repo/e2e/pay.spec.ts",
          specs: [
            { ok: true, tests: [{ results: [{ status: "passed" }] }] },
            { ok: false, tests: [{ results: [{ status: "timedOut" }] }] },
          ],
        },
      ],
    });
    expect(outcomes["e2e/pay.spec.ts"]).toBe("failed");
  });

  it("ignores a file whose specs were only skipped", () => {
    const outcomes = outcomesFromPlaywrightReport({
      suites: [
        {
          file: "e2e/skip.spec.ts",
          specs: [{ ok: true, tests: [{ results: [{ status: "skipped" }] }] }],
        },
      ],
    });
    expect(outcomes["e2e/skip.spec.ts"]).toBeUndefined();
  });
});

describe("outcomesFromVitestReport", () => {
  it("keeps a passed file and marks any other status as failed", () => {
    const outcomes = outcomesFromVitestReport({
      testResults: [
        { name: "/repo/src/__tests__/a.test.ts", status: "passed" },
        { name: "/repo/src/__tests__/b.test.tsx", status: "failed" },
        { name: "/repo/src/__tests__/c.test.ts", status: "pending" },
      ],
    });
    expect(outcomes["src/__tests__/a.test.ts"]).toBe("passed");
    expect(outcomes["src/__tests__/b.test.tsx"]).toBe("failed");
    expect(outcomes["src/__tests__/c.test.ts"]).toBe("failed");
  });
});
