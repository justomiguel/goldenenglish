"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { updateAcademicSectionRoomLabelAction } from "@/app/[locale]/dashboard/admin/academic/sectionRoomLabelActions";

export interface AcademicSectionRoomLabelEditorProps {
  locale: string;
  sectionId: string;
  initialRoomLabel: string | null;
  dict: Dictionary["dashboard"]["academicSectionPage"]["roomLabel"];
}

export function AcademicSectionRoomLabelEditor({
  locale,
  sectionId,
  initialRoomLabel,
  dict,
}: AcademicSectionRoomLabelEditorProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialRoomLabel ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dirty = value.trim() !== (initialRoomLabel ?? "").trim();

  const save = () => {
    setMsg(null);
    start(async () => {
      const r = await updateAcademicSectionRoomLabelAction({ locale, sectionId, roomLabel: value });
      if (r.ok) {
        setMsg(dict.success);
        router.refresh();
        return;
      }
      setMsg(dict.error);
    });
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.lead}</p>
      <div className="mt-3 space-y-2">
        <Label htmlFor={`sec-room-${sectionId}`}>{dict.label}</Label>
        <Input
          id={`sec-room-${sectionId}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
          maxLength={120}
          className="max-w-md"
          placeholder={dict.placeholder}
        />
        <Button type="button" disabled={pending || !dirty} isLoading={pending} onClick={save}>
          {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {dict.save}
        </Button>
        {msg ? (
          <p className="text-sm text-[var(--color-foreground)]" role="status">
            {msg}
          </p>
        ) : null}
      </div>
    </section>
  );
}
