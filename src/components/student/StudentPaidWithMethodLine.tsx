import { formatPaidWithMethod, paymentMethodSchema } from "@/lib/billing/paymentMethod";
import type { Dictionary } from "@/types/i18n";

type MonthlyLabels = Dictionary["dashboard"]["student"]["monthly"];

function methodLabel(method: string, labels: MonthlyLabels): string {
  switch (method) {
    case "cash":
      return labels.paymentMethodCash;
    case "transfer":
      return labels.paymentMethodTransfer;
    case "card":
      return labels.paymentMethodCard;
    case "gateway":
      return labels.paymentMethodGateway;
    case "other":
      return labels.paymentMethodOther;
    default:
      return method;
  }
}

export function StudentPaidWithMethodLine({
  method,
  paidOn,
  locale,
  labels,
}: {
  method: string | null | undefined;
  paidOn: string | null | undefined;
  locale: string;
  labels: MonthlyLabels;
}) {
  const parsed = paymentMethodSchema.safeParse(method);
  if (!parsed.success || !paidOn) return null;
  return (
    <p className="text-sm text-[var(--color-foreground)]">
      {formatPaidWithMethod({
        template: labels.paidWithMethod,
        methodLabel: methodLabel(parsed.data, labels),
        paidOn,
        locale,
      })}
    </p>
  );
}
