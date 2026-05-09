"use client";

import { ArrowRight, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { bulkSectionEnrollmentExemptionAction } from "@/app/[locale]/dashboard/admin/finance/collections/[sectionId]/bulkSectionEnrollmentExemptionAction";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { SectionCollectionsView } from "@/types/sectionCollections";
import type { Dictionary } from "@/types/i18n";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

export interface SectionCollectionsEnrollmentTabProps {
  locale: string;
  view: SectionCollectionsView;
  dict: CollectionsDict;
  billingLabels: Dictionary["admin"]["billing"];
}

export function SectionCollectionsEnrollmentTab({
  locale,
  view,
  dict,
  billingLabels,
}: SectionCollectionsEnrollmentTabProps) {
  const router = useRouter();
  const t = dict.sectionTabs;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [bulkMode, setBulkMode] = useState<"exempt" | "revoke" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const ids = useMemo(() => view.students.map((s) => s.studentId), [view.students]);
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(ids));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function runBulk(exempt: boolean) {
    const list = Array.from(selected);
    if (list.length === 0) {
      setNotice(t.enrollmentBulkNone);
      return;
    }
    setBusy(true);
    setNotice(null);
    const r = await bulkSectionEnrollmentExemptionAction({
      locale,
      sectionId: view.sectionId,
      studentIds: list,
      exempt,
      reason: exempt ? reason.trim() || undefined : undefined,
    });
    setBusy(false);
    setBulkMode(null);
    setReason("");
    if (r.ok) {
      setNotice(r.message ?? null);
      setSelected(new Set());
      router.refresh();
    } else {
      setNotice(r.message ?? t.enrollmentBulkError);
    }
  }

  return (
    <div className="space-y-4">
      {notice ? (
        <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
          {notice}
        </p>
      ) : null}
      <p className="text-sm text-[var(--color-muted-foreground)]">{t.enrollmentLead}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={toggleAll}>
          <UserCheck className="h-4 w-4" aria-hidden />
          {t.enrollmentSelectAll}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={selected.size === 0}
          onClick={() => setBulkMode("exempt")}
        >
          <UserCheck className="h-4 w-4" aria-hidden />
          {t.enrollmentBulkExempt}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={selected.size === 0}
          onClick={() => setBulkMode("revoke")}
        >
          <UserX className="h-4 w-4" aria-hidden />
          {t.enrollmentBulkRevoke}
        </Button>
      </div>
      <div className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
            <tr>
              <th className="w-10 px-2 py-2" aria-label={t.enrollmentSelectAll} />
              <th className="px-3 py-2">{dict.matrix.studentColumn}</th>
              <th className="px-3 py-2">{t.enrollmentColExempt}</th>
              <th className="px-3 py-2">{t.enrollmentColReason}</th>
              <th className="px-3 py-2">{t.enrollmentOpenBilling}</th>
            </tr>
          </thead>
          <tbody>
            {view.students.map((s) => (
              <tr key={s.studentId} className="border-b border-[var(--color-border)] last:border-0">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={selected.has(s.studentId)}
                    onChange={() => toggleOne(s.studentId)}
                    className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                    aria-label={dict.matrix.selectStudentAria.replace("{name}", s.studentName)}
                  />
                </td>
                <td className="px-3 py-2 font-medium">{s.studentName}</td>
                <td className="px-3 py-2">
                  {s.enrollmentFee.exempt ? t.enrollmentYes : t.enrollmentNo}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2 text-xs text-[var(--color-muted-foreground)]">
                  {s.enrollmentFee.exemptReason ?? billingLabels.emptyValue}
                </td>
                <td className="px-3 py-2">
                  <Link
                    href={`/${locale}/dashboard/admin/users/${s.studentId}/billing`}
                    className="inline-flex items-center gap-2 text-[var(--color-primary)] hover:underline"
                    aria-label={t.enrollmentOpenBillingAria.replace("{name}", s.studentName)}
                  >
                    <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                    {t.enrollmentOpenBilling}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmActionModal
        open={bulkMode === "exempt"}
        onOpenChange={(o) => !o && setBulkMode(null)}
        title={t.enrollmentBulkConfirmExemptTitle}
        body={t.enrollmentBulkConfirmExemptBody.replace("{count}", String(selected.size))}
        formSlot={
          <div className="space-y-2">
            <Label htmlFor="bulk-enroll-reason">{t.enrollmentBulkReasonLabel}</Label>
            <Input
              id="bulk-enroll-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t.enrollmentBulkReasonPlaceholder}
            />
          </div>
        }
        cancelLabel={billingLabels.cancel}
        confirmLabel={t.enrollmentBulkConfirm}
        busy={busy}
        disableClose={busy}
        onConfirm={() => void runBulk(true)}
      />

      <ConfirmActionModal
        open={bulkMode === "revoke"}
        onOpenChange={(o) => !o && setBulkMode(null)}
        title={t.enrollmentBulkConfirmRevokeTitle}
        body={t.enrollmentBulkConfirmRevokeBody.replace("{count}", String(selected.size))}
        cancelLabel={billingLabels.cancel}
        confirmLabel={t.enrollmentBulkConfirm}
        busy={busy}
        disableClose={busy}
        onConfirm={() => void runBulk(false)}
      />
    </div>
  );
}
