"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import type { Dictionary } from "@/types/i18n";
import {
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
  const [saveResult, setSaveResult] = useState<"success" | "error" | "need_keys" | "encryption" | null>(
    null,
  );

  const handleSave = () => {
    setSaveResult(null);
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

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <header className="mb-4 flex items-center gap-2">
        <Landmark className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{dict.flowTitle}</h2>
      </header>
      <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">{dict.flowLead}</p>

      <div className="max-w-lg space-y-4">
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

        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-foreground)]">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            disabled={isPending}
            className="h-4 w-4 rounded border-[var(--color-border)]"
          />
          {dict.flowEnabled}
        </label>

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
            placeholder={initial.hasCredentials ? "••••••••" : ""}
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
            onClick={handleSave}
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
          {saveResult === "error" ? (
            <span className="text-sm text-[var(--color-error)]">{dict.flowSavedError}</span>
          ) : null}
          {saveResult === "need_keys" ? (
            <span className="text-sm text-[var(--color-error)]">{dict.flowNeedKeys}</span>
          ) : null}
          {saveResult === "encryption" ? (
            <span className="text-sm text-[var(--color-error)]">{dict.flowEncryptionError}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
