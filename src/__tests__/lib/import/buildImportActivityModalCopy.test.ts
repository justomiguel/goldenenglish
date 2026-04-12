import { describe, it, expect } from "vitest";
import { buildImportActivityModalCopy } from "@/lib/import/buildImportActivityModalCopy";
import { dictEn } from "@/test/dictEn";

const labels = dictEn.admin.import;

describe("buildImportActivityModalCopy", () => {
  it("uses active row while running rows phase", () => {
    const out = buildImportActivityModalCopy({
      labels,
      importTotalRows: 10,
      logModalLive: true,
      jobSnapshot: {
        status: "running",
        phase: "rows",
        current: 3,
        total: 10,
        activeRow: 4,
      },
    });
    expect(out.introLine).toContain("10");
    expect(out.primaryLine).toContain("4");
    expect(out.primaryLine).toContain("10");
    expect(out.secondaryLine).toContain("3");
    expect(out.secondaryLine).toContain("10");
  });

  it("falls back to snapshot total when importTotalRows is null", () => {
    const out = buildImportActivityModalCopy({
      labels,
      importTotalRows: null,
      logModalLive: true,
      jobSnapshot: { status: "running", phase: "rows", current: 0, total: 5, activeRow: 1 },
    });
    expect(out.introLine).toContain("5");
  });
});
