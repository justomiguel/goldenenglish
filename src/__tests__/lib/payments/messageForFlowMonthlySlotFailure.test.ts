import { describe, expect, it } from "vitest";
import { messageForFlowMonthlySlotFailure } from "@/lib/payments/messageForFlowMonthlySlotFailure";
import type { Dictionary } from "@/types/i18n";
import dict from "@/dictionaries/en.json";

const pe = (dict as Dictionary).actionErrors.payment;

describe("messageForFlowMonthlySlotFailure", () => {
  it("maps upload_failed to paymentSlotSaveFailed (RLS / row create)", () => {
    expect(messageForFlowMonthlySlotFailure(pe, "upload_failed")).toBe(pe.paymentSlotSaveFailed);
  });
});
