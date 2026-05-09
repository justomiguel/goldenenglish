import { describe, expect, it } from "vitest";
import { formatFlowReturnPageCopy } from "@/lib/student/formatFlowReturnPageCopy";
import type { FlowMonthlyPaymentReturnPageModel } from "@/lib/billing/resolveFlowMonthlyPaymentReturnPage";

const monthly = {
  flowReturnBack: "Back",
  flowReturnNoTokenTitle: "No token title",
  flowReturnNoTokenLead: "No token lead",
  flowReturnSuccessTitle: "Success title",
  flowReturnSuccessLead: "{month} / {year}",
  flowReturnNotCompletedTitle: "Not completed title",
  flowReturnNotCompletedLead: "Not completed lead",
  flowReturnProcessingTitle: "Processing title",
  flowReturnProcessingLead: "Processing lead",
  flowReturnUnauthorizedTitle: "Unauth title",
  flowReturnUnauthorizedLead: "Unauth lead",
  flowReturnErrorTitle: "Error title",
  flowReturnErrorLead: "Error lead",
} as const;

describe("formatFlowReturnPageCopy", () => {
  it("formats success with localized month", () => {
    const model: FlowMonthlyPaymentReturnPageModel = {
      outcome: "success",
      month: 3,
      year: 2026,
    };
    const r = formatFlowReturnPageCopy("en", monthly as never, model);
    expect(r.variant).toBe("success");
    expect(r.title).toBe("Success title");
    expect(r.lead).toMatch(/2026/);
    expect(r.lead).toMatch(/March/i);
  });
});
