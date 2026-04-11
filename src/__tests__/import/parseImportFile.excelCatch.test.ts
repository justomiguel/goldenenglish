import { describe, it, expect, vi } from "vitest";

vi.mock("xlsx", () => ({
  read: () => {
    throw "not an Error instance";
  },
}));

import { parseImportFile } from "@/lib/import/parseImportFile";

describe("parseImportFile excel catch branch", () => {
  it("maps non-Error throws to a generic Excel read message", async () => {
    const file = new File([new Uint8Array([1])], "x.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const out = await parseImportFile(file);
    expect(out.data).toEqual([]);
    expect(out.errors).toEqual([{ message: "Excel read error" }]);
  });
});
