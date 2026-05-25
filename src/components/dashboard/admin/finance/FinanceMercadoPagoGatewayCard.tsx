"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type { Dictionary } from "@/types/i18n";
import {
  deleteMercadoPagoGatewayCredentials,
  saveMercadoPagoGatewaySettings,
  type MercadoPagoAdminRowSafe,
} from "@/app/[locale]/dashboard/admin/finance/mercadoPagoGatewaySettingsActions";
import type { PaymentGatewayCountryCode } from "@/types/paymentGateway";

type SettingsDict = Dictionary["admin"]["finance"]["settings"];

export interface FinanceMercadoPagoGatewayCardProps {
  locale: string;
  initial: MercadoPagoAdminRowSafe;
  dict: SettingsDict;
}

function countryTitle(dict: SettingsDict, country: PaymentGatewayCountryCode): string {
  return country === "AR" ? dict.mpCountryArTitle : dict.mpCountryClTitle;
}

export function FinanceMercadoPagoGatewayCard({
  locale,
  initial,
  dict,
}: FinanceMercadoPagoGatewayCardProps) {
  const router = useRouter();
  const [environment, setEnvironment] = useState<"sandbox" | "production">(initial.environment);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [accessToken, setAccessToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saveResult, setSaveResult] = useState<
    "success" | "error" | "need_keys" | "encryption" | "removed_ok" | "removed_err" | null
  >(null);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  const persist = () => {
    startTransition(async () => {
      const result = await saveMercadoPagoGatewaySettings({
        locale,
        countryCode: initial.countryCode,
        environment,
        enabled,
        accessToken,
        webhookSecret,
      });
      if (result.ok) {
        setSaveResult("success");
        setAccessToken("");
        setWebhookSecret("");
        router.refresh();
        return;
      }
      if (result.error === "need_keys") setSaveResult("need_keys");
      else if (result.error === "encryption") setSaveResult("encryption");
      else setSaveResult("error");
    });
  };

  const handleSaveClick = () => {
    setSaveResult(null);
    const rotation = accessToken.trim().length > 0 || webhookSecret.trim().length > 0;
    if (initial.hasCredentials && rotation) {
      setReplaceOpen(true);
      return;
    }
    persist();
  };

  return (
    <>
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <header className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden />
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {countryTitle(dict, initial.countryCode)}
          </h2>
        </header>
        <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">{dict.mpLead}</p>

        <div className="max-w-sm space-y-4">
          <div>
            <Label htmlFor={`mp-env-${initial.countryCode}`}>{dict.mpEnvironment}</Label>
            <select
              id={`mp-env-${initial.countryCode}`}
              value={environment}
              onChange={(e) =>
                setEnvironment(e.target.value === "production" ? "production" : "sandbox")
              }
              disabled={isPending}
              className="mt-1 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
            >
              <option value="sandbox">{dict.flowEnvSandbox}</option>
              <option value="production">{dict.flowEnvProduction}</option>
            </select>
          </div>

          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-[var(--color-border)]"
            />
            {dict.mpEnabled}
          </label>

          <div>
            <Label htmlFor={`mp-token-${initial.countryCode}`}>{dict.mpAccessToken}</Label>
            <Input
              id={`mp-token-${initial.countryCode}`}
              type="password"
              autoComplete="off"
              className="mt-1"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              disabled={isPending}
              placeholder={initial.hasCredentials ? dict.mpPlaceholderTokenUnchanged : ""}
            />
          </div>

          <div>
            <Label htmlFor={`mp-webhook-${initial.countryCode}`}>{dict.mpWebhookSecret}</Label>
            <Input
              id={`mp-webhook-${initial.countryCode}`}
              type="password"
              autoComplete="off"
              className="mt-1"
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              disabled={isPending}
              placeholder={dict.mpWebhookPlaceholder}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleSaveClick} disabled={isPending} isLoading={isPending} className="min-h-[44px]">
              {!isPending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
              {dict.mpSave}
            </Button>
            {saveResult === "success" ? (
              <span className="text-sm text-[var(--color-success)]">{dict.mpSavedOk}</span>
            ) : null}
            {saveResult === "error" ? (
              <span className="text-sm text-[var(--color-error)]">{dict.mpSavedError}</span>
            ) : null}
            {saveResult === "need_keys" ? (
              <span className="text-sm text-[var(--color-error)]">{dict.mpNeedKeys}</span>
            ) : null}
            {saveResult === "encryption" ? (
              <span className="text-sm text-[var(--color-error)]">{dict.flowEncryptionError}</span>
            ) : null}
            {saveResult === "removed_ok" ? (
              <span className="text-sm text-[var(--color-success)]">{dict.mpRemovedOk}</span>
            ) : null}
          </div>

          {initial.hasCredentials ? (
            <>
              <p className="pt-2 text-xs text-[var(--color-muted-foreground)]">{dict.flowDangerHint}</p>
              <Button
                type="button"
                variant="secondary"
                className="min-h-[44px]"
                disabled={isPending}
                onClick={() => setRemoveOpen(true)}
              >
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                {dict.mpRemoveButton}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <ConfirmActionModal
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        title={dict.mpRotateConfirmTitle}
        description={dict.mpRotateConfirmDescription}
        cancelLabel={dict.flowModalCancel}
        confirmLabel={dict.flowRotateConfirmAction}
        busy={isPending}
        onConfirm={() => {
          setReplaceOpen(false);
          persist();
        }}
      />
      <ConfirmActionModal
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        title={dict.mpRemoveConfirmTitle}
        description={dict.mpRemoveConfirmDescription}
        cancelLabel={dict.flowModalCancel}
        confirmLabel={dict.flowRemoveConfirmAction}
        confirmVariant="destructive"
        busy={isPending}
        onConfirm={() => {
          setRemoveOpen(false);
          startTransition(async () => {
            const result = await deleteMercadoPagoGatewayCredentials({
              locale,
              countryCode: initial.countryCode,
            });
            setSaveResult(result.ok ? "removed_ok" : "removed_err");
            if (result.ok) router.refresh();
          });
        }}
      />
    </>
  );
}
