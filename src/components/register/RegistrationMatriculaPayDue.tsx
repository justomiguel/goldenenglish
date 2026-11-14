import { formatMoneyLabel } from "@/lib/billing/formatMoneyLabel";
import { explainCodedFailure } from "@/lib/errors/revealFailureCode";
import { formatJoinPackageBreakdown } from "@/lib/register/formatJoinPackageCopy";
import { parseJoinPackageSnapshot } from "@/lib/register/parseJoinPackageSnapshot";
import { RegistrationMatriculaPayLeave } from "@/components/register/RegistrationMatriculaPayLeave";

export function RegistrationMatriculaPayDue({
  locale,
  showAmount,
  total,
  currency,
  feeSnapshot,
  enrollmentKind,
  amountLabel,
  result,
  rejectedLabel,
  pendingLabel,
  errorLabel,
  failures,
  homeHref,
  leavingLabel,
  leave,
}: {
  locale: string;
  showAmount: boolean;
  total: number;
  currency: string;
  feeSnapshot: unknown;
  enrollmentKind: string;
  amountLabel: string;
  result?: string;
  rejectedLabel?: string;
  pendingLabel?: string;
  errorLabel?: string;
  failures?: Partial<Record<string, string>>;
  homeHref?: string;
  leavingLabel?: string;
  leave: boolean;
}) {
  const money = showAmount && total > 0 ? formatMoneyLabel(total, currency, locale) : null;
  const line = resultLine(result, rejectedLabel, pendingLabel, errorLabel, failures);
  if (!money && !line && !(leave && homeHref && leavingLabel)) return null;
  const breakdown = formatJoinPackageBreakdown(parseJoinPackageSnapshot(feeSnapshot), locale, {
    enrollment: enrollmentKind,
  });
  return (
    <div className="mt-6">
      {money ? (
        <>
          <p className="text-sm">{breakdown || amountLabel}</p>
          <p className="text-3xl font-semibold">{money}</p>
          <p className="text-sm text-[var(--color-muted-foreground)]">{currency}</p>
        </>
      ) : null}
      {line ? (
        <p className="mt-4 text-sm" role="status">
          {line}
        </p>
      ) : null}
      {leave && homeHref && leavingLabel ? (
        <RegistrationMatriculaPayLeave href={homeHref} label={leavingLabel} />
      ) : null}
    </div>
  );
}

function resultLine(
  result: string | undefined,
  rejectedLabel: string | undefined,
  pendingLabel: string | undefined,
  errorLabel: string | undefined,
  failures: Partial<Record<string, string>> | undefined,
): string | null {
  const code = result?.trim() ?? "";
  if (!code || code === "paid") return null;
  if (code === "pending") return pendingLabel || code;
  if (code === "rejected") return rejectedLabel || code;
  return explainCodedFailure(code, failures, errorLabel || code);
}
