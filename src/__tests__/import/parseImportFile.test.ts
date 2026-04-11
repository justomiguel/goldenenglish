import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseImportFile } from "@/lib/import/parseImportFile";

describe("parseImportFile", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("reads File bytes via FileReader (jsdom-safe)", async () => {
    const u8 = new Uint8Array([1, 2, 3, 4]);
    const file = new File([u8], "t.bin");
    const ab = await new Promise<ArrayBuffer>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as ArrayBuffer);
      r.onerror = () => reject(r.error);
      r.readAsArrayBuffer(file);
    });
    expect(new Uint8Array(ab)).toEqual(u8);
  });

  it("parses CSV text", async () => {
    const file = new File(["a,b\n1,2"], "t.csv", { type: "text/csv" });
    const out = await parseImportFile(file);
    expect(out.errors).toEqual([]);
    expect(out.data).toEqual([{ a: "1", b: "2" }]);
  });

  it("returns error for corrupt xlsx bytes", async () => {
    const file = new File([new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0xff])], "bad.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const out = await parseImportFile(file);
    expect(out.data).toHaveLength(0);
    expect(out.errors.length).toBeGreaterThan(0);
  });

  it("parses first sheet of xlsx", async () => {
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nombre", "DNI"],
      ["", ""],
      ["Ana", "123"],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Hoja1");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    const file = new File([buf], "a.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const out = await parseImportFile(file);
    expect(out.errors).toHaveLength(0);
    expect(out.data).toEqual([{ Nombre: "Ana", DNI: "123" }]);
  });
});
