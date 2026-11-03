"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Megaphone } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import {
  archiveSectionNoticeAction,
  publishSectionNoticeAction,
} from "@/app/[locale]/dashboard/teacher/sections/noticeActions";

interface TeacherSectionNoticesProps {
  locale: string;
  sectionId: string;
  notices: { id: string; body: string }[];
  labels: {
    noticeTitle: string;
    noticePlaceholder: string;
    noticePublish: string;
    noticeArchive: string;
    noticeArchiveTitle: string;
    noticeArchiveBody: string;
    noticeCancel: string;
    noticeLimit: string;
    noticeFailed: string;
  };
}

export function TeacherSectionNotices({ locale, sectionId, notices, labels }: TeacherSectionNoticesProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function publish() {
    startTransition(async () => {
      const result = await publishSectionNoticeAction({ locale, sectionId, body });
      if (!result.ok) {
        setMessage(result.code === "limit" ? labels.noticeLimit : labels.noticeFailed);
        return;
      }
      setBody("");
      setMessage(null);
      router.refresh();
    });
  }

  function archive() {
    if (!archiveId) return;
    startTransition(async () => {
      const result = await archiveSectionNoticeAction({ locale, sectionId, noticeId: archiveId });
      setArchiveId(null);
      if (!result.ok) setMessage(labels.noticeFailed);
      else router.refresh();
    });
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.noticeTitle}</h2>
      <textarea
        value={body}
        maxLength={500}
        onChange={(event) => setBody(event.target.value)}
        placeholder={labels.noticePlaceholder}
        className="min-h-24 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
      />
      <Button type="button" disabled={pending || body.trim().length === 0} onClick={publish}>
        <Megaphone className="h-4 w-4" aria-hidden />
        {labels.noticePublish}
      </Button>
      {message ? <p className="text-sm text-[var(--color-error)]" role="alert">{message}</p> : null}
      <ul className="space-y-2">
        {notices.map((notice) => (
          <li key={notice.id} className="flex items-start justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] px-3 py-2">
            <p className="text-sm text-[var(--color-foreground)]">{notice.body}</p>
            <Button type="button" variant="secondary" aria-label={labels.noticeArchive} onClick={() => setArchiveId(notice.id)}>
              <Archive className="h-4 w-4" aria-hidden />
              {labels.noticeArchive}
            </Button>
          </li>
        ))}
      </ul>
      <ConfirmActionModal
        open={archiveId !== null}
        onOpenChange={(open) => { if (!open) setArchiveId(null); }}
        title={labels.noticeArchiveTitle}
        body={labels.noticeArchiveBody}
        cancelLabel={labels.noticeCancel}
        confirmLabel={labels.noticeArchive}
        confirmVariant="destructive"
        busy={pending}
        onConfirm={archive}
      />
    </section>
  );
}
