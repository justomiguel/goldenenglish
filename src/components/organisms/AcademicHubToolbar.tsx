"use client";

import { useState } from "react";
import Link from "next/link";
import { Inbox, Plus } from "lucide-react";
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
    newCohortTip: string;
    transferInboxTip: string;
    newCohortModal: AcademicNewCohortModalProps["dict"];
  };
}

export function AcademicHubToolbar({ locale, dict }: AcademicHubToolbarProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          title={dict.newCohortTip}
          className="inline-flex min-h-[44px] items-center gap-2"
          onClick={() => setOpen(true)}
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          {dict.newCohort}
        </Button>
        <Link
          href={`/${locale}/dashboard/admin/requests`}
          title={dict.transferInboxTip}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
        >
          <Inbox className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
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
