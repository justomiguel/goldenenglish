import type { MercadoPagoReturnPageModel } from "@/lib/billing/resolveMercadoPagoMonthlyPaymentReturnPage";
import type { Dictionary, Locale } from "@/types/i18n";

type MonthlyDict = Dictionary["dashboard"]["student"]["monthly"];

export function formatMercadoPagoReturnPageCopy(
  locale: Locale,
  monthly: MonthlyDict,
  model: MercadoPagoReturnPageModel,
): { title: string; lead: string; variant: "success" | "warning" | "default" | "error" } {
  if (model.outcome === "no_reference") {
    return {
      title: monthly.mpReturnNoRefTitle,
      lead: monthly.mpReturnNoRefLead,
      variant: "default",
    };
  }
  if (model.outcome === "misconfigured") {
    return {
      title: monthly.flowReturnUnauthorizedTitle,
      lead: monthly.mpErrorUnavailable,
      variant: "error",
    };
  }
  if (model.outcome === "unauthorized_payment") {
    return {
      title: monthly.flowReturnUnauthorizedTitle,
      lead: monthly.flowReturnUnauthorizedLead,
      variant: "error",
    };
  }
  if (model.outcome === "not_paid") {
    return {
      title: monthly.mpReturnNotCompletedTitle,
      lead: monthly.mpReturnNotCompletedLead,
      variant: "warning",
    };
  }
  if (model.outcome === "processing") {
    return {
      title: monthly.mpReturnProcessingTitle,
      lead: monthly.mpReturnProcessingLead,
      variant: "default",
    };
  }
  if (model.outcome === "reconcile_error") {
    return {
      title: monthly.flowReturnUnauthorizedTitle,
      lead: monthly.mpReturnProcessingLead,
      variant: "warning",
    };
  }
  if (model.outcome === "success") {
    const monthLabel = new Intl.DateTimeFormat(locale, { month: "long" }).format(
      new Date(model.year, model.month - 1, 1),
    );
    return {
      title: monthly.mpReturnSuccessTitle,
      lead: monthly.mpReturnSuccessLead
        .replace("{month}", monthLabel)
        .replace("{year}", String(model.year)),
      variant: "success",
    };
  }
  return {
    title: monthly.mpReturnNoRefTitle,
    lead: monthly.mpReturnNoRefLead,
    variant: "default",
  };
}
