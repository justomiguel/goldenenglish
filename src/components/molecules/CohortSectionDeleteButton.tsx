"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { AcademicSectionDeleteDialog } from "@/components/organisms/AcademicSectionDeleteDialog";
import type { AcademicSectionLifecycleDict } from "@/types/academicSectionLifecycle";

export function CohortSectionDeleteButton({
  locale,
  sectionId,
  sectionName,
  dict,
}: {
  locale: string;
  sectionId: string;
  sectionName: string;
  dict: AcademicSectionLifecycleDict;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="shrink-0 px-2"
        aria-label={dict.deleteButtonAria.replace("{name}", sectionName)}
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
      </Button>
      <AcademicSectionDeleteDialog
        open={open}
        onOpenChange={setOpen}
        locale={locale}
        sectionId={sectionId}
        dict={dict}
        onDeleted={() => router.refresh()}
      />
    </>
  );
}
