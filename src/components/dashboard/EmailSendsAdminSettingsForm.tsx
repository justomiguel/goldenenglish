"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setEmailSendEnabledAction } from "@/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions";
import {
  type EmailSendUiGroupId,
  type EmailSendsAdminGroup,
} from "@/lib/email/buildEmailSendsAdminGroups";
import type { Dictionary, Locale } from "@/types/i18n";

interface EmailSendsAdminSettingsFormProps {
  locale: Locale;
  groups: EmailSendsAdminGroup[];
  labels: Dictionary["admin"]["settings"];
}

function groupTitle(id: EmailSendUiGroupId, labels: Dictionary["admin"]["settings"]): string {
  if (id === "automated") return labels.emailSendsGroupAutomated;
  if (id === "billing") return labels.emailSendsGroupBilling;
  if (id === "academics") return labels.emailSendsGroupAcademics;
  if (id === "messaging") return labels.emailSendsGroupMessaging;
  return labels.emailSendsGroupOther;
}

export function EmailSendsAdminSettingsForm({
  locale,
  groups: initialGroups,
  labels,
}: EmailSendsAdminSettingsFormProps) {
  const [groups, setGroups] = useState(initialGroups);
  const [msg, setMsg] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const router = useRouter();

  async function onToggle(templateKey: string, next: boolean) {
    setMsg(null);
    setBusyKey(templateKey);
    const prev = groups;
    setGroups((g) =>
      g.map((group) => ({
        ...group,
        rows: group.rows.map((row) =>
          row.templateKey === templateKey ? { ...row, enabled: next } : row,
        ),
      })),
    );
    const res = await setEmailSendEnabledAction({ locale, templateKey, enabled: next });
    setBusyKey(null);
    if (res.ok) {
      setMsg(labels.saved);
      router.refresh();
    } else {
      setGroups(prev);
      setMsg(labels.error);
    }
  }

  return (
    <div className="max-w-2xl rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6">
      <h2 className="text-lg font-semibold text-[var(--color-secondary)]">{labels.emailSendsTitle}</h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{labels.emailSendsHint}</p>
      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <section key={group.id}>
            <h3 className="text-sm font-semibold text-[var(--color-secondary)]">
              {groupTitle(group.id, labels)}
            </h3>
            <ul className="mt-3 space-y-3">
              {group.rows.map((row) => {
                return (
                  <li key={row.templateKey}>
                    <label className="flex cursor-pointer items-center justify-between gap-4">
                      <span className="flex min-w-0 items-center gap-3">
                        <input
                          type="checkbox"
                          className="h-5 w-5 shrink-0 rounded border-[var(--color-border)]"
                          checked={row.enabled}
                          disabled={busyKey === row.templateKey}
                          onChange={(e) => void onToggle(row.templateKey, e.target.checked)}
                        />
                        <span className="font-medium text-[var(--color-foreground)]">{row.label}</span>
                      </span>
                      <span className="shrink-0 text-sm text-[var(--color-muted-foreground)]">
                        {row.enabled ? labels.emailSendsTodayOn : labels.emailSendsTodayOff}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      {msg ? <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </div>
  );
}
