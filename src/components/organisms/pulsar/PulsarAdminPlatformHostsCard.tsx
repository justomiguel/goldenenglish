"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Globe, Save } from "lucide-react";
import { savePulsarPlatformHostsAction } from "@/app/[locale]/admin/actions";
import type { Dictionary } from "@/types/i18n";

export interface PulsarAdminPlatformHostsCardProps {
  locale: string;
  dict: Dictionary;
  initialHosts: readonly string[];
}

export function PulsarAdminPlatformHostsCard({
  locale,
  dict,
  initialHosts,
}: PulsarAdminPlatformHostsCardProps) {
  const router = useRouter();
  const copy = dict.pulsar.admin.platformHosts;
  const errorCopy = dict.pulsar.admin.form.errors as Record<string, string>;
  const [rawHosts, setRawHosts] = useState(() => initialHosts.join(", "));
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedNotice(false);
    setErrorCode(null);
    const res = await savePulsarPlatformHostsAction({
      locale,
      rawHosts,
    });
    setSaving(false);
    if (!res.ok) {
      setErrorCode(res.errorCode);
      return;
    }
    setRawHosts(res.hosts.join(", "));
    setSavedNotice(true);
    router.refresh();
  };

  return (
    <section className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
          <h2 className="text-sm font-bold text-[var(--color-foreground)]">
            {copy.title}
          </h2>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">{copy.lead}</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="pulsar-platform-hosts-input"
            className="block text-xs font-semibold text-[var(--color-foreground)]"
          >
            {copy.inputLabel}
          </label>
          <input
            id="pulsar-platform-hosts-input"
            type="text"
            value={rawHosts}
            onChange={(e) => setRawHosts(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 font-mono text-xs text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-50"
        >
          <Save className="h-3.5 w-3.5" aria-hidden />
          <span>{saving ? copy.saving : copy.saveCta}</span>
        </button>
      </form>

      {errorCode ? (
        <p className="mt-2 text-xs font-semibold text-[var(--color-error)]" role="alert">
          {errorCopy[errorCode] ?? errorCopy.db_write_failed}
        </p>
      ) : null}

      {savedNotice ? (
        <p
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
          <span>{copy.savedNotice}</span>
        </p>
      ) : null}
    </section>
  );
}
