import { describe, expect, it } from "vitest";
import {
  enrollmentPayReturnPath,
  enrollmentPayReturnResult,
} from "@/lib/register/enrollmentPayReturnResult";

describe("enrollmentPayReturnResult", () => {
  it("marks a confirmed capture as paid", () => {
    expect(enrollmentPayReturnResult({ called: true, ok: true })).toBe("paid");
  });

  it("marks a gateway rejection as rejected", () => {
    expect(
      enrollmentPayReturnResult({ called: true, ok: true, skipped: "mp_not_approved" }),
    ).toBe("rejected");
  });

  it("keeps a confirmed capture ahead of a pending label", () => {
    expect(
      enrollmentPayReturnResult({ called: true, ok: true, returnStatus: "pending" }),
    ).toBe("paid");
  });

  it("keeps a pending return pending when nothing was captured", () => {
    expect(enrollmentPayReturnResult({ called: false, returnStatus: "pending" })).toBe("pending");
  });

  it("returns the skip code when the cause has its own sentence", () => {
    expect(enrollmentPayReturnResult({ called: true, ok: true, skipped: "not_found" })).toBe(
      "not_found",
    );
  });

  it("builds the pay page path with the result", () => {
    expect(
      enrollmentPayReturnPath({
        locale: "es",
        slug: "horario-por-asignar",
        payToken: "abc",
        result: "paid",
      }),
    ).toBe("/es/matricula/horario-por-asignar/abc?result=paid");
  });
});
