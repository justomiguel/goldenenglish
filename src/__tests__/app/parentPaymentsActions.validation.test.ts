/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitParentPaymentReceipt } from "@/app/[locale]/dashboard/parent/payments/actions";
import { fd, mockCreateClient } from "./parentPaymentsActions.shared";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

describe("submitParentPaymentReceipt validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid form fields", async () => {
    const form = fd({ studentId: "" });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: "Invalid form",
    });
  });

  it("rejects non-positive amount", async () => {
    const form = fd({ amount: "0" });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: "Invalid amount",
    });
  });

  it("requires receipt file", async () => {
    const form = fd({ file: null });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: "Receipt file required",
    });
  });

  it("rejects empty file", async () => {
    const form = fd({
      file: new File([], "empty.pdf", { type: "application/pdf" }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: "Receipt file required",
    });
  });

  it("rejects oversized file", async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 1);
    const form = fd({
      file: new File([big], "big.pdf", { type: "application/pdf" }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: "File too large",
    });
  });

  it("rejects disallowed mime types", async () => {
    const form = fd({
      file: new File([new Uint8Array([1])], "x.exe", {
        type: "application/x-msdownload",
      }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: "Use PDF or image",
    });
  });

  it("rejects when mime falls back to octet-stream", async () => {
    const form = fd({
      file: new File([new Uint8Array([1])], "x", { type: "" }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: "Use PDF or image",
    });
  });
});
