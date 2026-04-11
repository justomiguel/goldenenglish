import { describe, it, expect, vi } from "vitest";

vi.mock("xlsx", () => ({
  read: () => ({ SheetNames: [], Sheets: {} }),
  utils: { sheet_to_json: () => [] },
}));

import { parseImportFile } from "@/lib/import/parseImportFile";

describe("parseImportFile empty workbook branch", () => {
  it("returns Empty workbook when SheetNames is empty", async () => {
    const file = new File([new Uint8Array([1])], "empty.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const out = await parseImportFile(file);
    expect(out.data).toEqual([]);
    expect(out.errors).toEqual([{ message: "Empty workbook" }]);
  });
});
