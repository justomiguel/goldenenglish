"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { FinanceFlowGatewayConfirmModals } from "@/components/dashboard/admin/finance/FinanceFlowGatewayConfirmModals";
import { FinanceFlowGatewayStatusPanel } from "@/components/dashboard/admin/finance/FinanceFlowGatewayStatusPanel";
import type { Dictionary } from "@/types/i18n";
import {
  deleteFlowChileGatewayCredentials,
  saveFlowChileGatewaySettings,
  type FlowChileAdminRowSafe,
} from "@/app/[locale]/dashboard/admin/finance/flowGatewaySettingsActions";

type FlowDict = Dictionary["admin"]["finance"]["settings"];

export interface FinanceFlowGatewayCardProps {
  locale: string;
  initial: FlowChileAdminRowSafe;
  dict: FlowDict;
}

export function FinanceFlowGatewayCard({ locale, initial, dict }: FinanceFlowGatewayCardProps) {
  const router = useRouter();
  const [environment, setEnvironment] = useState<"sandbox" | "production">(initial.environment);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [apiKey, setApiKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [isPending, startTransition] = useTransition();
  const [saveResult, setSaveResult] = useState<
    "success" | "error" | "need_keys" | "encryption" | "removed_ok" | "removed_err" | null
  >(null);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);

  useEffect(() => {
    setEnvironment(initial.environment);
    setEnabled(initial.enabled);
  }, [initial.environment, initial.enabled]);

  const persistFlowSettings = () => {
    startTransition(async () => {
      const result = await saveFlowChileGatewaySettings({
        locale,
        environment,
        enabled,
        apiKey,
        secretKey,
      });

      if (result.ok) {
        setSaveResult("success");
        setApiKey("");
        setSecretKey("");
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
    const rotation = apiKey.trim().length > 0 || secretKey.trim().length > 0;
    if (initial.hasCredentials && rotation) {
      setReplaceOpen(true);
      return;
    }
    persistFlowSettings();
  };

  const handleConfirmReplace = () => {
    setReplaceOpen(false);
    persistFlowSettings();
  };

  const handleConfirmRemove = () => {
    setRemoveOpen(false);
    setSaveResult(null);
    startTransition(async () => {
      const result = await deleteFlowChileGatewayCredentials({ locale });
      if (result.ok) {
        setSaveResult("removed_ok");
        setApiKey("");
        setSecretKey("");
        router.refresh();
      } else {
        setSaveResult("removed_err");
      }
    });
  };

  return (
    <>
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <header className="mb-4 flex items-center gap-2">
          <Landmark className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden />
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{dict.flowTitle}</h2>
        </header>
        <p className="mb-3 text-sm text-[var(--color-muted-foreground)]">{dict.flowLead}</p>
        <FinanceFlowGatewayStatusPanel initial={initial} dict={dict} />

        <div className="max-w-sm space-y-4">
          <div>
            <Label htmlFor="flow-env">{dict.flowEnvironment}</Label>
            <select
              id="flow-env"
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

          <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-sm text-[var(--color-foreground)]">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-[var(--color-border)]"
            />
            {dict.flowEnabled}
          </label>

          <p className="text-xs text-[var(--color-muted-foreground)]">{dict.flowFieldsHint}</p>

          <div>
            <Label htmlFor="flow-api-key">{dict.flowApiKey}</Label>
            <Input
              id="flow-api-key"
              type="password"
              autoComplete="off"
              className="mt-1"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isPending}
              placeholder={initial.hasCredentials ? dict.flowPlaceholderKeyUnchanged : ""}
            />
          </div>

          <div>
            <Label htmlFor="flow-secret">{dict.flowSecretKey}</Label>
            <Input
              id="flow-secret"
              type="password"
              autoComplete="off"
              className="mt-1"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              disabled={isPending}
              placeholder={dict.flowSecretPlaceholder}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              onClick={handleSaveClick}
              disabled={isPending}
              isLoading={isPending}
              className="min-h-[44px]"
            >
              {!isPending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
              {dict.flowSave}
            </Button>
            {saveResult === "success" ? (
              <span className="text-sm text-[var(--color-success)]">{dict.flowSavedOk}</span>
            ) : null}
            {saveResult === "removed_ok" ? (
              <span className="text-sm text-[var(--color-success)]">{dict.flowRemovedOk}</span>
            ) : null}
            {saveResult === "error" ? (
              <span className="text-sm text-[var(--color-error)]">{dict.flowSavedError}</span>
            ) : null}
            {saveResult === "removed_err" ? (
              <span className="text-sm text-[var(--color-error)]">{dict.flowRemovedError}</span>
            ) : null}
            {saveResult === "need_keys" ? (
              <span className="text-sm text-[var(--color-error)]">{dict.flowNeedKeys}</span>
            ) : null}
            {saveResult === "encryption" ? (
              <span className="text-sm text-[var(--color-error)]">{dict.flowEncryptionError}</span>
            ) : null}
          </div>

          {initial.hasCredentials ? (
            <>
              <p className="pt-4 text-xs text-[var(--color-muted-foreground)]">{dict.flowDangerHint}</p>
              <Button
                type="button"
                variant="secondary"
                className="min-h-[44px]"
                disabled={isPending}
                onClick={() => setRemoveOpen(true)}
              >
                <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                {dict.flowRemoveButton}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <FinanceFlowGatewayConfirmModals
        dict={dict}
        replaceOpen={replaceOpen}
        removeOpen={removeOpen}
        setReplaceOpen={setReplaceOpen}
        setRemoveOpen={setRemoveOpen}
        busy={isPending}
        onReplaceConfirm={handleConfirmReplace}
        onRemoveConfirm={handleConfirmRemove}
      />
    </>
  );
}
