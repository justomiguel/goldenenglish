/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitParentPaymentReceipt } from "@/app/[locale]/dashboard/parent/payments/actions";
import {
  fd,
  mockCreateClient,
  supabaseFor,
} from "./parentPaymentsActions.shared";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

describe("submitParentPaymentReceipt supabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthorized without user", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: null,
        profileRole: null,
        link: false,
        pay: null,
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: "Unauthorized",
    });
  });

  it("returns forbidden for non-parent profile", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "student",
        link: false,
        pay: null,
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: "Forbidden",
    });
  });

  it("requires parent-student link", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: false,
        pay: null,
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: "Student not linked",
    });
  });

  it("handles missing payment row", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: null,
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: "Payment slot not found",
    });
  });

  it("treats payment query error like missing row", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: null,
        payErr: { message: "timeout" },
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: "Payment slot not found",
    });
  });

  it("rejects non-pending payment", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "approved" },
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: "Payment already processed",
    });
  });

  it("surfaces upload errors", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
        uploadErr: { message: "quota" },
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: "quota",
    });
  });

  it("surfaces update errors", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
        updateErr: { message: "row conflict" },
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: "row conflict",
    });
  });

  it("accepts webp and completes flow", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
      }),
    );
    const form = fd({
      file: new File([new Uint8Array([2])], "r.webp", {
        type: "image/webp",
      }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({ ok: true });
  });

  it("uses jpg extension for jpeg mime", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
      }),
    );
    const form = fd({
      file: new File([new Uint8Array([3])], "r.jpg", {
        type: "image/jpeg",
      }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({ ok: true });
  });

  it("uses bin extension for non-png image types", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
      }),
    );
    const form = fd({
      file: new File([new Uint8Array([4])], "r.gif", {
        type: "image/gif",
      }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({ ok: true });
  });

  it("maps image/png to png extension", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
      }),
    );
    const form = fd({
      file: new File([new Uint8Array([5])], "r.png", {
        type: "image/png",
      }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({ ok: true });
  });

  it("maps image/jpg alias mime", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
      }),
    );
    const form = fd({
      file: new File([new Uint8Array([6])], "r.jpg", {
        type: "image/jpg",
      }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({ ok: true });
  });
});
