"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { PortalSpecialEventTypeSlug } from "@/types/portalSpecialCalendar";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { deletePortalSpecialCalendarEventAction } from "@/app/[locale]/dashboard/admin/calendar/specialEventsActions";
import { cordobaHmFromUtcMs, cordobaIsoDateFromUtcMs } from "@/lib/calendar/cordobaFormatFromUtc";

type SpecialAdminDict = Dictionary["dashboard"]["portalCalendar"]["specialAdmin"];

export type SpecialEventListRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  event_type: PortalSpecialEventTypeSlug;
};

export interface PortalSpecialEventsTableProps {
  locale: string;
  dict: SpecialAdminDict;
  rows: SpecialEventListRow[];
}

export function PortalSpecialEventsTable({ locale, dict, rows }: PortalSpecialEventsTableProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const runRemove = (id: string) => {
    start(async () => {
      const r = await deletePortalSpecialCalendarEventAction({ locale, id });
      setDeleteId(null);
      if (r.ok) router.refresh();
    });
  };

  if (!rows.length) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>;
  }

  return (
    <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)]">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
          <tr>
            <th className="px-3 py-2 font-semibold text-[var(--color-primary)]">{dict.colTitle}</th>
            <th className="px-3 py-2 font-semibold text-[var(--color-primary)]">{dict.colType}</th>
            <th className="px-3 py-2 font-semibold text-[var(--color-primary)]">{dict.colWhen}</th>
            <th className="px-3 py-2 font-semibold text-[var(--color-primary)]">{dict.colActions}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const s = new Date(r.starts_at).getTime();
            const when = r.all_day
              ? cordobaIsoDateFromUtcMs(s)
              : `${cordobaIsoDateFromUtcMs(s)} ${cordobaHmFromUtcMs(s)}–${cordobaHmFromUtcMs(new Date(r.ends_at).getTime())}`;
            return (
              <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-3 py-2 text-[var(--color-foreground)]">{r.title}</td>
                <td className="px-3 py-2 text-xs text-[var(--color-muted-foreground)]">{dict.eventTypes[r.event_type]}</td>
                <td className="px-3 py-2 font-mono text-xs text-[var(--color-muted-foreground)]">{when}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/${locale}/dashboard/admin/calendar/special/${r.id}`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] underline underline-offset-2"
                    >
                      <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                      {dict.edit}
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      className="text-xs"
                      disabled={pending}
                      isLoading={pending && deleteId === r.id}
                      onClick={() => setDeleteId(r.id)}
                    >
                      {!(pending && deleteId === r.id) ? (
                        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                      ) : null}
                      {dict.delete}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ConfirmActionModal
        open={deleteId !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteId(null);
        }}
        title={dict.deleteConfirm}
        cancelLabel={dict.modalCancel}
        confirmLabel={dict.delete}
        confirmVariant="destructive"
        busy={pending}
        onConfirm={() => {
          if (deleteId) runRemove(deleteId);
        }}
      />
    </div>
  );
}
