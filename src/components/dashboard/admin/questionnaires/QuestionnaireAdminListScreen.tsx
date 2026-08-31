"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, ChartNoAxesColumn, Copy, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import {
  archiveQuestionnaireAction,
  createQuestionnaireAction,
} from "@/app/[locale]/dashboard/admin/settings/questionnaires/actions";
import { clientAbsoluteUrl } from "@/lib/client/publicUrl";
import type { AdminQuestionnaireListRow } from "@/lib/questionnaires/loadAdminQuestionnaires";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["questionnaires"];

export function QuestionnaireAdminListScreen({
  locale,
  rows,
  labels,
}: {
  locale: string;
  rows: AdminQuestionnaireListRow[];
  labels: Labels;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  function create() {
    startTransition(async () => {
      const result = await createQuestionnaireAction(locale, title);
      if (!result.ok) {
        setError(result.code === "title" ? labels.errorTitle : labels.errorSave);
        return;
      }
      router.push(`/${locale}/dashboard/admin/settings/questionnaires/${result.id}`);
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title={labels.listTitle} lead={labels.listLead} iconId="questionnaires" />
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <label className="min-w-0 flex-1 text-sm">
          <span className="mb-1 block font-medium">{labels.fieldTitle}</span>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <Button type="submit" isLoading={pending}>
          <Plus className="h-4 w-4" aria-hidden />
          {labels.create}
        </Button>
      </form>
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-[var(--shadow-soft)]">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[var(--color-muted-foreground)]">
                <th className="px-4 py-3 font-medium">{labels.colTitle}</th>
                <th className="px-4 py-3 font-medium">{labels.colStatus}</th>
                <th className="px-4 py-3 font-medium">{labels.colVisibility}</th>
                <th className="px-4 py-3 font-medium">{labels.colResponses}</th>
                <th className="px-4 py-3 font-medium">{labels.colLanding}</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-4 py-3 font-medium">{row.title}</td>
                  <td className="px-4 py-3">{statusLabel(row.status, labels)}</td>
                  <td className="px-4 py-3">
                    {row.visibility === "private" ? labels.visibilityPrivate : labels.visibilityPublic}
                  </td>
                  <td className="px-4 py-3">{row.responseCount}</td>
                  <td className="px-4 py-3">{row.showOnLanding ? labels.landingYes : labels.landingNo}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          router.push(`/${locale}/dashboard/admin/settings/questionnaires/${row.id}`)
                        }
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                        {labels.edit}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          router.push(
                            `/${locale}/dashboard/admin/settings/questionnaires/${row.id}/results`,
                          )
                        }
                      >
                        <ChartNoAxesColumn className="h-4 w-4" aria-hidden />
                        {labels.results}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          const url = clientAbsoluteUrl(`/${locale}/q/${row.slug}`);
                          await navigator.clipboard.writeText(url);
                          setCopiedId(row.id);
                        }}
                      >
                        <Copy className="h-4 w-4" aria-hidden />
                        {copiedId === row.id ? labels.copyLinkCopied : labels.copyLink}
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => setArchiveId(row.id)}>
                        <Archive className="h-4 w-4" aria-hidden />
                        {labels.archive}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ConfirmActionModal
        open={Boolean(archiveId)}
        onOpenChange={(open) => {
          if (!open) setArchiveId(null);
        }}
        title={labels.archiveConfirmTitle}
        body={labels.archiveConfirmBody}
        cancelLabel={labels.archiveCancel}
        confirmLabel={labels.archiveConfirm}
        confirmVariant="destructive"
        onConfirm={() => {
          if (!archiveId) return;
          startTransition(async () => {
            await archiveQuestionnaireAction(locale, archiveId);
            setArchiveId(null);
            router.refresh();
          });
        }}
      />
    </div>
  );
}

function statusLabel(status: AdminQuestionnaireListRow["status"], labels: Labels): string {
  if (status === "published") return labels.statusPublished;
  if (status === "closed") return labels.statusClosed;
  return labels.statusDraft;
}
