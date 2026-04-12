/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitParentPaymentReceipt } from "@/app/[locale]/dashboard/parent/payments/actions";
import { dictEn } from "@/test/dictEn";
import { fd, mockCreateClient } from "./parentPaymentsActions.shared";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const pe = dictEn.actionErrors.payment;

describe("submitParentPaymentReceipt validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid form fields", async () => {
    const form = fd({ studentId: "" });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.invalidForm,
    });
  });

  it("rejects when studentId is missing from form data", async () => {
    const form = new FormData();
    form.set("locale", "en");
    form.set("month", "3");
    form.set("year", "2026");
    form.set("amount", "10");
    form.set(
      "receipt",
      new File([new Uint8Array([1])], "r.pdf", { type: "application/pdf" }),
    );
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.invalidForm,
    });
  });

  it("rejects non-numeric month", async () => {
    const form = fd({ month: "xx" });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.invalidForm,
    });
  });

  it("rejects non-positive amount", async () => {
    const form = fd({ amount: "0" });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.invalidAmount,
    });
  });

  it("requires receipt file", async () => {
    const form = fd({ file: null });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.receiptRequired,
    });
  });

  it("rejects empty file", async () => {
    const form = fd({
      file: new File([], "empty.pdf", { type: "application/pdf" }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.receiptRequired,
    });
  });

  it("rejects oversized file", async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 1);
    const form = fd({
      file: new File([big], "big.pdf", { type: "application/pdf" }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.fileTooLarge,
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
      message: pe.mimeInvalid,
    });
  });

  it("rejects when mime falls back to octet-stream", async () => {
    const form = fd({
      file: new File([new Uint8Array([1])], "x", { type: "" }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.mimeInvalid,
    });
  });
});
