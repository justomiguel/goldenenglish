"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/atoms/Button";
import {
  AcademicNewCohortModal,
  type AcademicNewCohortModalProps,
} from "@/components/organisms/AcademicNewCohortModal";

export interface AcademicHubToolbarProps {
  locale: string;
  dict: {
    newCohort: string;
    transferInbox: string;
    newCohortModal: AcademicNewCohortModalProps["dict"];
  };
}

export function AcademicHubToolbar({ locale, dict }: AcademicHubToolbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => setOpen(true)}>
          {dict.newCohort}
        </Button>
        <Link
          href={`/${locale}/dashboard/admin/requests`}
          className="inline-flex items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        >
          {dict.transferInbox}
        </Link>
      </div>
      <AcademicNewCohortModal
        locale={locale}
        open={open}
        onOpenChange={setOpen}
        dict={dict.newCohortModal}
      />
    </div>
  );
}
