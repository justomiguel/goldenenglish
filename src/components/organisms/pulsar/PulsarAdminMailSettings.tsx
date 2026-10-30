"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, Save } from "lucide-react";
import { savePulsarMailSettingsAction, sendPulsarMailTestAction } from "@/app/[locale]/admin/ownerReviewAction";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

type MailCopy = Dictionary["pulsar"]["admin"]["mail"];
type MailLast = { ok: boolean; code: string; detail: string; at: string } | null;

function mailErrorText(code: string, copy: MailCopy): string {
  if (code === "resend_rejected") return copy.rejected;
  if (code === "resend_failed") return copy.failed;
  if (code === "notify_missing") return copy.notifyMissing;
  if (code === "invalid_input" || code === "db_write_failed") return copy.saveFailed;
  return copy.unconfigured;
}

export function PulsarAdminMailSettings({
  locale,
  settings,
  copy,
}: {
  locale: string;
  settings: { fromEmail: string; notifyEmail: string; hasApiKey: boolean; last: MailLast };
  copy: MailCopy;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    setError(null);
    const data = new FormData(event.currentTarget);
    const result = await savePulsarMailSettingsAction({
      locale,
      fromEmail: String(data.get("fromEmail") ?? ""),
      notifyEmail: String(data.get("notifyEmail") ?? ""),
      apiKey: String(data.get("apiKey") ?? ""),
    });
    setPending(false);
    if (!result.ok) {
      setError(mailErrorText(result.errorCode, copy));
      return;
    }
    setNotice(copy.saved);
    router.refresh();
  }

  async function onTest() {
    setTesting(true);
    setNotice(null);
    setError(null);
    setDetail("");
    const result = await sendPulsarMailTestAction({ locale });
    setTesting(false);
    if (!result.ok) {
      setError(mailErrorText(result.errorCode, copy));
      setDetail(result.detail);
      router.refresh();
      return;
    }
    setNotice(copy.testSent);
    router.refresh();
  }

  const visibleDetail = detail || (settings.last && !settings.last.ok ? settings.last.detail : "");
  const when = settings.last
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(settings.last.at))
    : "";

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-3">
      <h2 className="text-lg font-medium">{copy.title}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>
      <p className="text-sm">{settings.hasApiKey ? copy.keySaved : copy.keyMissing}</p>
      {settings.last ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {when}. {settings.last.ok ? copy.lastSent : mailErrorText(settings.last.code, copy)}
        </p>
      ) : null}
      <label className="block text-sm font-semibold" htmlFor="pulsar-from-email">
        {copy.fromEmail}
        <input id="pulsar-from-email" name="fromEmail" type="email" required defaultValue={settings.fromEmail} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold" htmlFor="pulsar-notify-email">
        {copy.notifyEmail}
        <input id="pulsar-notify-email" name="notifyEmail" type="email" required defaultValue={settings.notifyEmail} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      <label className="block text-sm font-semibold" htmlFor="pulsar-resend-key">
        {copy.apiKey}
        <input id="pulsar-resend-key" name="apiKey" type="password" autoComplete="off" placeholder={settings.hasApiKey ? copy.apiKeyKeep : ""} className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2" />
      </label>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.testLead}</p>
      {notice ? <p className="text-sm">{notice}</p> : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      {visibleDetail ? <p className="text-sm text-[var(--color-muted-foreground)]">{visibleDetail}</p> : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={pending}>
          <Save className="h-4 w-4" aria-hidden />
          {copy.save}
        </Button>
        <Button type="button" variant="ghost" isLoading={testing} onClick={onTest}>
          <Mail className="h-4 w-4" aria-hidden />
          {copy.sendTest}
        </Button>
      </div>
    </form>
  );
}
