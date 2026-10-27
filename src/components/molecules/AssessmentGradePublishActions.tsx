"use client";

import { useId, useTransition, type RefObject } from "react";
import { Check, Send } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  publishGradeWithNotification,
  upsertGradeAction,
} from "@/app/[locale]/dashboard/teacher/sections/assessmentGradeActions";

export interface AssessmentGradePublishActionsProps {
  formRef: RefObject<HTMLFormElement | null>;
  enrollmentId: string;
  publishLabel: string;
  publishHelp: string;
  notifyLabel: string;
  notifyHelp: string;
  onPublished: (enrollmentId: string) => void;
  onBegin: () => void;
  onError: (code: string) => void;
}

export function AssessmentGradePublishActions({
  formRef,
  enrollmentId,
  publishLabel,
  publishHelp,
  notifyLabel,
  notifyHelp,
  onPublished,
  onBegin,
  onError,
}: AssessmentGradePublishActionsProps) {
  const [silentPending, startSilent] = useTransition();
  const [notifyPending, startNotify] = useTransition();
  const publishOnlyHelpId = useId();
  const publishNotifyHelpId = useId();
  const saveBusy = silentPending || notifyPending;

  function publishOnly() {
    onBegin();
    const el = formRef.current;
    if (!el) return;
    const fd = new FormData(el);
    fd.set("gradeStatus", "published");
    startSilent(() => {
      void upsertGradeAction(null, fd).then((result) => {
        if (result.ok) onPublished(enrollmentId);
        else onError(result.code);
      });
    });
  }

  function publishAndNotify() {
    onBegin();
    const el = formRef.current;
    if (!el) return;
    const fd = new FormData(el);
    startNotify(() => {
      void publishGradeWithNotification(fd).then((result) => {
        if (result.ok) onPublished(enrollmentId);
        else onError(result.ok === false ? result.code : "save");
      });
    });
  }

  return (
    <>
      <div className="flex w-full flex-col gap-1 sm:flex-1">
        <Button
          type="button"
          variant="ghost"
          className="min-h-[44px] w-full border border-[var(--color-border)]"
          aria-describedby={publishOnlyHelpId}
          isLoading={silentPending}
          disabled={saveBusy}
          onClick={publishOnly}
        >
          {!silentPending ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {publishLabel}
        </Button>
        <p id={publishOnlyHelpId} className="text-xs leading-snug text-[var(--color-foreground)]">
          {publishHelp}
        </p>
      </div>
      <div className="flex w-full flex-col gap-1 sm:flex-1">
        <Button
          type="button"
          className="min-h-[44px] w-full"
          aria-describedby={publishNotifyHelpId}
          isLoading={notifyPending}
          disabled={saveBusy}
          onClick={publishAndNotify}
        >
          {!notifyPending ? <Send className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {notifyLabel}
        </Button>
        <p id={publishNotifyHelpId} className="text-xs leading-snug text-[var(--color-foreground)]">
          {notifyHelp}
        </p>
      </div>
    </>
  );
}
