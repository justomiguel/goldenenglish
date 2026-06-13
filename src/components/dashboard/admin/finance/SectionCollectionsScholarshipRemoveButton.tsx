"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ban } from "lucide-react";
import { deactivateStudentScholarship } from "@/app/[locale]/dashboard/admin/users/[userId]/billing/upsertStudentScholarship";
import { Button } from "@/components/atoms/Button";
import type { Dictionary, Locale } from "@/types/i18n";

type BillingLabels = Dictionary["admin"]["billing"];

export interface SectionCollectionsScholarshipRemoveButtonProps {
  locale: Locale;
  sectionId: string;
  studentId: string;
  scholarshipId: string;
  labels: BillingLabels;
  onNotice: (text: string) => void;
}

export function SectionCollectionsScholarshipRemoveButton({
  locale,
  sectionId,
  studentId,
  scholarshipId,
  labels,
  onNotice,
}: SectionCollectionsScholarshipRemoveButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleRemove() {
    setBusy(true);
    const res = await deactivateStudentScholarship({
      locale,
      studentId,
      sectionId,
      scholarshipId,
    });
    setBusy(false);
    onNotice(res.ok ? labels.saved : res.message ?? labels.error);
    if (res.ok) router.refresh();
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={busy}
      isLoading={busy}
      onClick={() => void handleRemove()}
      className="min-h-[36px] border border-[var(--color-error)] text-xs text-[var(--color-error)]"
    >
      <Ban className="h-3.5 w-3.5 shrink-0 text-[var(--color-foreground)]" aria-hidden />
      {labels.removeScholarship}
    </Button>
  );
}
