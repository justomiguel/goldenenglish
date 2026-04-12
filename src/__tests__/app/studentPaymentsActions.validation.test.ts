/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitStudentPaymentReceipt } from "@/app/[locale]/dashboard/student/payments/actions";
import { dictEn } from "@/test/dictEn";
import { mockCreateClient, studentFd } from "./studentPaymentsActions.shared";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

const pe = dictEn.actionErrors.payment;

describe("submitStudentPaymentReceipt validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid month/year", async () => {
    const form = studentFd({ month: "xx", year: "2026" });
    expect(await submitStudentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.invalidForm,
    });
  });

  it("rejects non-positive amount", async () => {
    const form = studentFd({ amount: "0" });
    expect(await submitStudentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.invalidAmount,
    });
  });

  it("requires receipt file", async () => {
    const form = studentFd({ file: null });
    expect(await submitStudentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.receiptRequired,
    });
  });

  it("rejects empty file", async () => {
    const form = studentFd({
      file: new File([], "empty.pdf", { type: "application/pdf" }),
    });
    expect(await submitStudentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.receiptRequired,
    });
  });

  it("rejects oversized file", async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 1);
    const form = studentFd({
      file: new File([big], "big.pdf", { type: "application/pdf" }),
    });
    expect(await submitStudentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.fileTooLarge,
    });
  });

  it("rejects disallowed mime types", async () => {
    const form = studentFd({
      file: new File([new Uint8Array([1])], "x.exe", {
        type: "application/x-msdownload",
      }),
    });
    expect(await submitStudentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.mimeInvalid,
    });
  });

  it("rejects when mime falls back to octet-stream", async () => {
    const form = studentFd({
      file: new File([new Uint8Array([1])], "x", { type: "" }),
    });
    expect(await submitStudentPaymentReceipt(form)).toEqual({
      ok: false,
      message: pe.mimeInvalid,
    });
  });
});
