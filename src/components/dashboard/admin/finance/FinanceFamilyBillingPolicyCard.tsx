"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Receipt, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import { setFamilyBillingPolicyAction } from "@/app/[locale]/dashboard/admin/finance/billingSettingsActions";
import type { FamilyBillingPolicy } from "@/lib/billing/familyBillingPolicy";

type SettingsDict = Dictionary["admin"]["finance"]["settings"];

export function FinanceFamilyBillingPolicyCard({
  locale,
  initial,
  dict,
}: {
  locale: string;
  initial: FamilyBillingPolicy;
  dict: SettingsDict;
}) {
  const router = useRouter();
  const [creditPaidTrialOnEnroll, setCreditPaidTrialOnEnroll] = useState(
    initial.creditPaidTrialOnEnroll,
  );
  const [allowParentPartialSectionPayments, setAllowParentPartialSectionPayments] = useState(
    initial.allowParentPartialSectionPayments,
  );
  const [isPending, startTransition] = useTransition();
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(null);

  const hasChanges =
    creditPaidTrialOnEnroll !== initial.creditPaidTrialOnEnroll ||
    allowParentPartialSectionPayments !== initial.allowParentPartialSectionPayments;

  function handleSave() {
    if (!hasChanges) return;
    setSaveResult(null);
    startTransition(async () => {
      const result = await setFamilyBillingPolicyAction(locale, {
        creditPaidTrialOnEnroll,
        allowParentPartialSectionPayments,
      });
      setSaveResult(result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)]">
      <header className="mb-4 flex items-center gap-2">
        <Receipt className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--color-primary)]">
          {dict.familyBillingTitle}
        </h2>
      </header>
      <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">{dict.familyBillingLead}</p>

      <div className="max-w-2xl space-y-4">
        <label className="flex min-h-[44px] cursor-pointer items-start gap-2 text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={creditPaidTrialOnEnroll}
            onChange={(e) => {
              setCreditPaidTrialOnEnroll(e.target.checked);
              setSaveResult(null);
            }}
            disabled={isPending}
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
          />
          <span>
            {dict.familyBillingTrialCreditToggle}
            <span className="mt-1 block text-xs text-[var(--color-muted-foreground)]">
              {dict.familyBillingTrialCreditHint}
            </span>
          </span>
        </label>

        <label className="flex min-h-[44px] cursor-pointer items-start gap-2 text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={allowParentPartialSectionPayments}
            onChange={(e) => {
              setAllowParentPartialSectionPayments(e.target.checked);
              setSaveResult(null);
            }}
            disabled={isPending}
            className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
          />
          <span>
            {dict.familyBillingPartialToggle}
            <span className="mt-1 block text-xs text-[var(--color-muted-foreground)]">
              {dict.familyBillingPartialHint}
            </span>
          </span>
        </label>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            onClick={handleSave}
            disabled={isPending || !hasChanges}
            isLoading={isPending}
            className="min-h-[44px]"
          >
            {!isPending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.familyBillingSave}
          </Button>
          {saveResult === "success" ? (
            <span className="text-sm text-[var(--color-success)]">{dict.familyBillingSavedOk}</span>
          ) : saveResult === "error" ? (
            <span className="text-sm text-[var(--color-error)]">{dict.familyBillingSavedError}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
