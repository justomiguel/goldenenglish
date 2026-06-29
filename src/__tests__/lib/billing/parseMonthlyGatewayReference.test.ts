/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import {
  buildTuitionGatewayReference,
  parseMonthlyGatewayReference,
} from "@/lib/billing/parseMonthlyGatewayReference";

const STUDENT_ID = "11111111-1111-4111-8111-111111111111";
const SECTION_ID = "22222222-2222-4222-8222-222222222222";
const PARENT_ID = "33333333-3333-4333-8333-333333333333";
const PAY_UUID = "44444444-4444-4444-8444-444444444444";

describe("buildTuitionGatewayReference", () => {
  it("encodes a slot without a parent id", () => {
    expect(
      buildTuitionGatewayReference({
        studentId: STUDENT_ID,
        sectionId: SECTION_ID,
        year: 2026,
        month: 6,
        parentId: null,
      }),
    ).toBe(`tuition:${STUDENT_ID}:${SECTION_ID}:2026:6`);
  });

  it("appends the parent id when present", () => {
    expect(
      buildTuitionGatewayReference({
        studentId: STUDENT_ID,
        sectionId: SECTION_ID,
        year: 2026,
        month: 6,
        parentId: PARENT_ID,
      }),
    ).toBe(`tuition:${STUDENT_ID}:${SECTION_ID}:2026:6:${PARENT_ID}`);
  });
});

describe("parseMonthlyGatewayReference", () => {
  it("returns null for empty/blank values", () => {
    expect(parseMonthlyGatewayReference(null)).toBeNull();
    expect(parseMonthlyGatewayReference(undefined)).toBeNull();
    expect(parseMonthlyGatewayReference("   ")).toBeNull();
  });

  it("round-trips a slot reference without a parent", () => {
    const raw = buildTuitionGatewayReference({
      studentId: STUDENT_ID,
      sectionId: SECTION_ID,
      year: 2026,
      month: 6,
      parentId: null,
    });
    expect(parseMonthlyGatewayReference(raw)).toEqual({
      kind: "slot",
      slot: {
        studentId: STUDENT_ID,
        sectionId: SECTION_ID,
        year: 2026,
        month: 6,
        parentId: null,
      },
    });
  });

  it("round-trips a slot reference with a parent", () => {
    const raw = buildTuitionGatewayReference({
      studentId: STUDENT_ID,
      sectionId: SECTION_ID,
      year: 2026,
      month: 12,
      parentId: PARENT_ID,
    });
    expect(parseMonthlyGatewayReference(raw)).toEqual({
      kind: "slot",
      slot: {
        studentId: STUDENT_ID,
        sectionId: SECTION_ID,
        year: 2026,
        month: 12,
        parentId: PARENT_ID,
      },
    });
  });

  it("trims surrounding whitespace before parsing", () => {
    const ref = parseMonthlyGatewayReference(`  ${PAY_UUID}  `);
    expect(ref).toEqual({ kind: "payment", paymentId: PAY_UUID });
  });

  it("recognizes a legacy payment UUID reference", () => {
    expect(parseMonthlyGatewayReference(PAY_UUID)).toEqual({
      kind: "payment",
      paymentId: PAY_UUID,
    });
  });

  it("rejects slot references with invalid month or year", () => {
    expect(
      parseMonthlyGatewayReference(`tuition:${STUDENT_ID}:${SECTION_ID}:2026:13`),
    ).toBeNull();
    expect(
      parseMonthlyGatewayReference(`tuition:${STUDENT_ID}:${SECTION_ID}:1999:6`),
    ).toBeNull();
  });

  it("rejects slot references missing student or section", () => {
    expect(parseMonthlyGatewayReference(`tuition::${SECTION_ID}:2026:6`)).toBeNull();
    expect(parseMonthlyGatewayReference(`tuition:${STUDENT_ID}::2026:6`)).toBeNull();
  });

  it("rejects non-uuid, non-slot strings", () => {
    expect(parseMonthlyGatewayReference("pay-1")).toBeNull();
    expect(parseMonthlyGatewayReference("12345")).toBeNull();
  });
});
