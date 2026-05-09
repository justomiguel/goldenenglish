import type { Dictionary, Locale } from "@/types/i18n";
import type { FlowMonthlyPaymentReturnPageModel } from "@/lib/billing/resolveFlowMonthlyPaymentReturnPage";

export type FlowReturnPresentation = {
  title: string;
  lead: string;
  variant: "default" | "success" | "warning" | "error";
};

export function formatFlowReturnPageCopy(
  locale: Locale,
  monthly: Dictionary["dashboard"]["student"]["monthly"],
  model: FlowMonthlyPaymentReturnPageModel,
): FlowReturnPresentation {
  switch (model.outcome) {
    case "no_token":
      return {
        title: monthly.flowReturnNoTokenTitle,
        lead: monthly.flowReturnNoTokenLead,
        variant: "default",
      };
    case "success": {
      const monthLabel = new Intl.DateTimeFormat(locale, { month: "long" }).format(
        new Date(2000, model.month - 1, 1),
      );
      return {
        title: monthly.flowReturnSuccessTitle,
        lead: monthly.flowReturnSuccessLead
          .replace("{month}", monthLabel)
          .replace("{year}", String(model.year)),
        variant: "success",
      };
    }
    case "not_paid":
      return {
        title: monthly.flowReturnNotCompletedTitle,
        lead: monthly.flowReturnNotCompletedLead,
        variant: "warning",
      };
    case "processing":
      return {
        title: monthly.flowReturnProcessingTitle,
        lead: monthly.flowReturnProcessingLead,
        variant: "warning",
      };
    case "unauthorized_payment":
      return {
        title: monthly.flowReturnUnauthorizedTitle,
        lead: monthly.flowReturnUnauthorizedLead,
        variant: "error",
      };
    case "misconfigured":
    case "status_failed":
    case "reconcile_error":
      return {
        title: monthly.flowReturnErrorTitle,
        lead: monthly.flowReturnErrorLead,
        variant: "error",
      };
  }
}
