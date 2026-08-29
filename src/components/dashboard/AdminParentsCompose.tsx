"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminComposeShell } from "@/components/dashboard/AdminComposeShell";
import { sendParentBulkMailAction } from "@/app/[locale]/dashboard/admin/parents/actions";
import type { Dictionary } from "@/types/i18n";
import type { ParentMailMode } from "@/lib/parents/parentRecipient";
import type { InviteParentRow } from "@/lib/email/inviteParentsToPlatform";

type ParentsLabels = Dictionary["admin"]["parents"];

export function AdminParentsCompose({
  locale,
  labels,
  parents,
  scopeParams,
  listHref,
}: {
  locale: string;
  labels: ParentsLabels;
  parents: InviteParentRow[];
  scopeParams: Record<string, string>;
  listHref: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [mode, setMode] = useState<ParentMailMode>("individual");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const emailed = parents.filter((p) => p.email).length;
  const summary = labels.composeSummary
    .replace("{{n}}", String(parents.length))
    .replace("{{e}}", String(emailed))
    .replace("{{p}}", String(parents.length - emailed));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await sendParentBulkMailAction(locale, scopeParams, { subject, html: body, mode });
    setBusy(false);
    if (res.ok) {
      router.push(listHref);
      return;
    }
    setMsg(res.message);
  }

  return (
    <AdminComposeShell
      title={labels.composeTitle}
      recipientSlot={
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {summary}
          {parents.length >= 200 ? ` ${labels.cappedWarning}` : ""}
        </p>
      }
      subject={{ id: "parents-mail-subject", label: labels.composeSubject, value: subject, onChange: setSubject }}
      modeSlot={
        <fieldset className="space-y-2 text-sm">
          <legend className="font-medium text-[var(--color-foreground)]">{labels.composeMode}</legend>
          {(
            [
              ["cc", labels.modeCc],
              ["bcc", labels.modeBcc],
              ["individual", labels.modeIndividual],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-center gap-2">
              <input
                type="radio"
                name="parents-mail-mode"
                checked={mode === value}
                onChange={() => setMode(value)}
              />
              {label}
            </label>
          ))}
          <p className="text-[var(--color-muted-foreground)]">{labels.placeholderHint}</p>
        </fieldset>
      }
      body={body}
      onBodyChange={setBody}
      onSubmit={onSubmit}
      busy={busy}
      message={msg}
      submitLabel={labels.composeSend}
      submitDisabled={parents.length === 0}
      bodyAriaLabel={labels.composeTitle}
    />
  );
}
