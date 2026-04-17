"use client";

import { useState } from "react";
import { setClassRemindersGlobalsAction } from "@/app/[locale]/dashboard/admin/settings/actions";
import type { Dictionary } from "@/types/i18n";
import type { ClassReminderSiteSettings } from "@/types/classReminders";
import { INSTITUTE_TIME_ZONE_IDS } from "@/lib/notifications/instituteTimeZones";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";

interface ClassRemindersAdminSettingsFormProps {
  locale: string;
  initial: ClassReminderSiteSettings;
  labels: Dictionary["admin"]["settings"];
}

export function ClassRemindersAdminSettingsForm({
  locale,
  initial,
  labels,
}: ClassRemindersAdminSettingsFormProps) {
  const [enabled, setEnabled] = useState(initial.remindersEnabled);
  const [prep, setPrep] = useState(String(initial.prepOffsetMinutes));
  const [urgent, setUrgent] = useState(String(initial.urgentOffsetMinutes));
  const [tz, setTz] = useState(initial.instituteTimeZone);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    setBusy(true);
    const res = await setClassRemindersGlobalsAction({
      locale,
      enabled,
      prepMinutes: Number(prep),
      urgentMinutes: Number(urgent),
      instituteTz: tz,
    });
    setBusy(false);
    if (res.ok) setMsg(labels.classRemindersSaved);
    else setErr(labels.classRemindersSaveError);
  }

  return (
    <form
      onSubmit={(ev) => void onSave(ev)}
      className="mt-8 max-w-lg rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6"
    >
      <h2 className="text-lg font-semibold text-[var(--color-secondary)]">{labels.classRemindersTitle}</h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{labels.classRemindersHint}</p>
      <label className="mt-6 flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-[var(--color-border)]"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
        />
        <span className="font-medium text-[var(--color-foreground)]">{labels.classRemindersEnabled}</span>
      </label>
      <div className="mt-4">
        <Label htmlFor="cr-prep">{labels.classRemindersPrepMinutes}</Label>
        <Input
          id="cr-prep"
          type="number"
          min={30}
          max={10080}
          className="mt-1"
          value={prep}
          onChange={(e) => setPrep(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <Label htmlFor="cr-urg">{labels.classRemindersUrgentMinutes}</Label>
        <Input
          id="cr-urg"
          type="number"
          min={5}
          max={720}
          className="mt-1"
          value={urgent}
          onChange={(e) => setUrgent(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <Label htmlFor="cr-tz">{labels.classRemindersTimeZone}</Label>
        <select
          id="cr-tz"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
          value={tz}
          onChange={(e) => setTz(e.target.value)}
        >
          {INSTITUTE_TIME_ZONE_IDS.map((id) => (
            <option key={id} value={id}>
              {id}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" className="mt-6 min-h-[44px]" disabled={busy}>
        {labels.submitChanges}
      </Button>
      {msg ? <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
      {err ? <p className="mt-3 text-sm text-[var(--color-error)]">{err}</p> : null}
    </form>
  );
}
