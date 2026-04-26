"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { createAcademicCohortAction } from "@/app/[locale]/dashboard/admin/academics/actions";

export interface AcademicNewCohortModalProps {
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dict: {
    title: string;
    nameLabel: string;
    slugLabel: string;
    slugHint: string;
    submit: string;
    cancel: string;
    error: string;
  };
}

export function AcademicNewCohortModal({
  locale,
  open,
  onOpenChange,
  dict,
}: AcademicNewCohortModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setErr(null);
    start(async () => {
      const r = await createAcademicCohortAction({
        locale,
        name,
        slug: slug.trim() || null,
      });
      if (!r.ok) {
        setErr(dict.error);
        return;
      }
      onOpenChange(false);
      setName("");
      setSlug("");
      router.push(`/${locale}/dashboard/admin/academic/${r.id}`);
      router.refresh();
    });
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="new-cohort-title"
      title={dict.title}
      disableClose={pending}
    >
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium" htmlFor="nc-name">
            {dict.nameLabel}
          </label>
          <input
            id="nc-name"
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
          />
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="nc-slug">
            {dict.slugLabel}
          </label>
          <input
            id="nc-slug"
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={pending}
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.slugHint}</p>
        </div>
        {err ? <p className="text-sm text-[var(--color-error)]">{err}</p> : null}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
            {!pending ? <X className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.cancel}
          </Button>
          <Button type="button" isLoading={pending} disabled={pending || name.trim().length < 2} onClick={submit}>
            {!pending ? <Plus className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.submit}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
