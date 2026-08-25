"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { updateAcademicSectionNameAction } from "@/app/[locale]/dashboard/admin/academic/sectionNameActions";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export interface AcademicSectionNameEditorProps {
  locale: string;
  sectionId: string;
  initialName: string;
  dict: Dictionary["dashboard"]["academicSectionPage"]["nameEditor"];
  variant: "embedded" | "inline";
}

function messageForCode(
  code: "PARSE" | "DUPLICATE" | "SAVE",
  dict: AcademicSectionNameEditorProps["dict"],
): string {
  if (code === "DUPLICATE") return dict.duplicate;
  if (code === "PARSE") return dict.tooShort;
  return dict.error;
}

export function AcademicSectionNameEditor({
  locale,
  sectionId,
  initialName,
  dict,
  variant,
}: AcademicSectionNameEditorProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialName);
  const [editing, setEditing] = useState(variant === "embedded");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dirty = value.trim() !== initialName.trim();

  const save = () => {
    setMsg(null);
    start(async () => {
      const r = await updateAcademicSectionNameAction({ locale, sectionId, name: value });
      if (r.ok) {
        setMsg(dict.success);
        if (variant === "inline") setEditing(false);
        router.refresh();
        return;
      }
      setMsg(messageForCode(r.code, dict));
    });
  };

  const cancelInline = () => {
    setValue(initialName);
    setMsg(null);
    setEditing(false);
  };

  if (variant === "inline" && !editing) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <h1
          className="truncate font-display text-3xl font-bold tracking-tight text-[var(--color-primary)]"
          data-tour={ADMIN_TOUR_ANCHORS.sectionDetailTitle}
        >
          {initialName}
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          aria-label={dict.editNameAria}
          onClick={() => {
            setValue(initialName);
            setMsg(null);
            setEditing(true);
          }}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    );
  }

  const fields = (
    <div className={variant === "inline" ? "space-y-2" : "mt-3 space-y-2"}>
      <Label htmlFor={`sec-name-${sectionId}`}>{dict.label}</Label>
      <Input
        id={`sec-name-${sectionId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
        maxLength={120}
        className={variant === "inline" ? "max-w-xl text-2xl font-semibold" : "max-w-md"}
        placeholder={dict.placeholder}
        data-tour={variant === "inline" ? ADMIN_TOUR_ANCHORS.sectionDetailTitle : undefined}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" disabled={pending || !dirty} isLoading={pending} onClick={save}>
          {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {dict.save}
        </Button>
        {variant === "inline" ? (
          <Button type="button" variant="ghost" disabled={pending} onClick={cancelInline}>
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {dict.cancel}
          </Button>
        ) : null}
      </div>
      {msg ? (
        <p className="text-sm text-[var(--color-foreground)]" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );

  if (variant === "inline") {
    return <div className="min-w-0">{fields}</div>;
  }

  return (
    <div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.lead}</p>
      {fields}
    </div>
  );
}
