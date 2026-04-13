/** @vitest-environment node */
import { describe, it, expect } from "vitest";
import {
  formatImportJobActivityLog,
  resolveImportJobActivityLine,
} from "@/lib/import/resolveImportJobActivityLine";
import en from "@/dictionaries/en.json";

const labels = en.admin.import;

describe("resolveImportJobActivityLine", () => {
  it("renders known codes with meta", () => {
    expect(resolveImportJobActivityLine("queued", undefined, labels)).toContain("server");
    expect(resolveImportJobActivityLine("rows_begin", { total: 5 }, labels)).toContain("5");
    expect(resolveImportJobActivityLine("row_progress", { current: 2, total: 5 }, labels)).toContain(
      "2",
    );
    expect(resolveImportJobActivityLine("cancelled_by_user", undefined, labels)).toContain(
      "cancelled",
    );
    expect(resolveImportJobActivityLine("failed", { error: "x" }, labels)).toContain("x");
  });

  it("formats full log", () => {
    const lines = formatImportJobActivityLog(
      [
        { t: 1, code: "queued" },
        { t: 2, code: "rows_begin", meta: { total: 1 } },
      ],
      labels,
    );
    expect(lines).toHaveLength(2);
  });
});
