"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import type { Dictionary } from "@/types/i18n";
import type { RegistrationSortDir, RegistrationSortKey } from "@/lib/dashboard/adminRegistrationsSort";

type RegLabels = Dictionary["admin"]["registrations"];
type TableLabels = Dictionary["admin"]["table"];

const SORT_KEYS: RegistrationSortKey[] = [
  "name",
  "dni",
  "email",
  "phoneStudent",
  "phoneTutor",
  "level",
  "birth",
  "status",
  "received",
];

function colLabel(labels: RegLabels, key: RegistrationSortKey): string {
  switch (key) {
    case "name":
      return labels.name;
    case "dni":
      return labels.dni;
    case "email":
      return labels.email;
    case "phoneStudent":
      return labels.phoneStudent;
    case "phoneTutor":
      return labels.phoneTutor;
    case "level":
      return labels.level;
    case "birth":
      return labels.birthDate;
    case "status":
      return labels.status;
    case "received":
      return labels.received;
    default:
      return key;
  }
}

export function AdminRegistrationsSortSheet({
  labels,
  tableLabels,
  sortKey,
  sortDir,
  onToggleSort,
}: {
  labels: RegLabels;
  tableLabels: TableLabels;
  sortKey: RegistrationSortKey;
  sortDir: RegistrationSortDir;
  onToggleSort: (key: RegistrationSortKey) => void;
}) {
  const [open, setOpen] = useState(false);
  const field = colLabel(labels, sortKey);
  return (
    <>
      <Button type="button" variant="secondary" className="min-h-11 px-3" onClick={() => setOpen(true)}>
        <ArrowUpDown className="h-4 w-4" aria-hidden />
        {labels.mobileSortButton.replace("{{field}}", field)}
      </Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        titleId="admin-registrations-sort-title"
        title={labels.mobileSortSheetTitle}
        stackBelowTour
      >
        <ul className="space-y-1">
          {SORT_KEYS.map((key) => {
            const active = key === sortKey;
            return (
              <li key={key}>
                <button
                  type="button"
                  aria-pressed={active}
                  className={`flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-medium ${
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border border-[var(--color-border)] text-[var(--color-foreground)]"
                  }`}
                  onClick={() => onToggleSort(key)}
                >
                  <span>{colLabel(labels, key)}</span>
                  {active ? <span>{sortDir === "asc" ? tableLabels.sortAsc : tableLabels.sortDesc}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
