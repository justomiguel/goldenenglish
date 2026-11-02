"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Save } from "lucide-react";
import { saveCentrolistoGaSettingsAction } from "@/app/[locale]/admin/ownerReviewAction";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type AnalyticsCopy = Dictionary["pulsar"]["admin"]["analytics"];

export function PulsarAdminAnalyticsSettings({
  locale,
  measurementId,
  copy,
}: {
  locale: string;
  measurementId: string;
  copy: AnalyticsCopy;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    setError(null);
    const data = new FormData(event.currentTarget);
    const result = await saveCentrolistoGaSettingsAction({
      locale,
      measurementId: String(data.get("measurementId") ?? ""),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.errorCode === "invalid_input" ? copy.invalid : copy.saveFailed);
      return;
    }
    setNotice(copy.saved);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3">
      <h2 className="inline-flex items-center gap-2 text-lg font-medium">
        <BarChart3 className="h-4 w-4" aria-hidden />
        {copy.title}
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.empty}</p>
      <label className="block text-sm font-semibold" htmlFor="centrolisto-ga-id">
        {copy.measurementId}
        <input
          id="centrolisto-ga-id"
          name="measurementId"
          type="text"
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          placeholder={copy.placeholder}
          defaultValue={measurementId}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-sm"
        />
      </label>
      {notice ? <p className="text-sm">{notice}</p> : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <Button type="submit" isLoading={pending}>
        <Save className="h-4 w-4" aria-hidden />
        {copy.save}
      </Button>
    </form>
  );
}
