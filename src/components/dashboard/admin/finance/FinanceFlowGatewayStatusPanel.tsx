import { AlertCircle, CircleCheck } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { buildFlowStoredResumeLine } from "@/lib/payment-gateways/flowAdminStoredResume";
import type { FlowChileAdminRowSafe } from "@/app/[locale]/dashboard/admin/finance/flowGatewaySettingsActions";

type FlowDict = Dictionary["admin"]["finance"]["settings"];

export interface FinanceFlowGatewayStatusPanelProps {
  initial: FlowChileAdminRowSafe;
  dict: FlowDict;
  /** When credentials exist and Flow might be switched on soon or already enabled. */
  showFlowMinimumOperationalNotice: boolean;
}

export function FinanceFlowGatewayStatusPanel({
  initial,
  dict,
  showFlowMinimumOperationalNotice,
}: FinanceFlowGatewayStatusPanelProps) {
  const configured = initial.hasCredentials;
  const detailConfigured = buildFlowStoredResumeLine(
    {
      hasCredentials: initial.hasCredentials,
      environment: initial.environment,
      enabled: initial.enabled,
    },
    dict,
  );

  return (
    <div
      role="status"
      className={
        configured
          ? "mb-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] border-l-4 border-l-[var(--color-success)] bg-[var(--color-success)]/10 px-3 py-3"
          : "mb-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] border-l-4 border-l-[var(--color-warning)] bg-[var(--color-warning)]/10 px-3 py-3"
      }
    >
      <div className="flex gap-3">
        {configured ? (
          <CircleCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]"
            aria-hidden
          />
        ) : (
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]"
            aria-hidden
          />
        )}
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            {configured ? dict.flowBannerTitleOk : dict.flowBannerTitleMissing}
          </p>
          <p className="text-xs leading-relaxed text-[var(--color-muted-foreground)]">
            {configured ? detailConfigured : dict.flowBannerBodyMissing}
          </p>
          {configured && showFlowMinimumOperationalNotice ? (
            <div
              role="note"
              className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-warning)]/40 bg-[var(--color-muted)]/30 px-3 py-2"
            >
              <p className="text-xs font-semibold text-[var(--color-foreground)]">
                {dict.flowMinimumOperationalTitle}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                {dict.flowMinimumOperationalBody}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
