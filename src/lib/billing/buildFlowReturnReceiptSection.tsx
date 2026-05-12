import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPaymentReceiptCopy } from "@/lib/billing/buildPaymentReceiptCopy";
import { buildPaymentReceiptModel } from "@/lib/billing/buildPaymentReceiptModel";
import { loadPaymentForReceipt } from "@/lib/billing/loadPaymentForReceipt";
import { loadReceiptBrandForRequest } from "@/lib/billing/loadReceiptBrandForRequest";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import { PaymentReceiptHtml } from "@/components/payments/receipt/PaymentReceiptHtml";
import type { Dictionary, Locale } from "@/types/i18n";

export interface BuildFlowReturnReceiptSectionInput {
  supabase: SupabaseClient;
  locale: Locale;
  monthlyDict: Dictionary["dashboard"]["student"]["monthly"];
  paymentId: string;
}

/**
 * On Flow return success, this builds the embedded receipt JSX shown under the status panel
 * (HTML view + "Download PDF" button). Returns `null` if the receipt can't be loaded — the
 * status panel still confirms the payment, so the receipt is degradation-friendly.
 */
export async function buildFlowReturnReceiptSection(
  input: BuildFlowReturnReceiptSectionInput,
): Promise<React.ReactNode> {
  const { supabase, locale, monthlyDict, paymentId } = input;
  const copy = buildPaymentReceiptCopy(monthlyDict);

  const loaded = await loadPaymentForReceipt({
    supabase,
    paymentId,
    flowMethodLabel: copy.flowMethodLabel,
    uploadMethodLabel: copy.uploadMethodLabel,
  });

  if (!loaded.ok) {
    logServerWarn("flowReturnReceiptSection:skip", {
      reason: loaded.reason,
      payment_id_prefix: paymentId.slice(0, 8),
    });
    return null;
  }

  const brand = await loadReceiptBrandForRequest();
  const model = buildPaymentReceiptModel({
    locale,
    now: new Date(),
    brand,
    payment: loaded.payment,
    payer: loaded.payer,
    student: loaded.student,
    copy: copy.copy,
  });

  const downloadHref = `/api/payments/${paymentId}/receipt.pdf?locale=${encodeURIComponent(locale)}`;

  return (
    <PaymentReceiptHtml
      receipt={model}
      downloadHref={downloadHref}
      downloadLabel={copy.downloadLabel}
    />
  );
}
