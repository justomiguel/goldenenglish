"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Dictionary } from "@/types/i18n";
import type { TeacherTransferReasonCode } from "@/lib/academics/teacherTransferSuggestionReasons";
import { TEACHER_TRANSFER_REASON_CODES } from "@/lib/academics/teacherTransferSuggestionReasons";
import {
  submitTransferSuggestionAction,
  type TransferSuggestionActionState,
} from "@/app/[locale]/dashboard/teacher/academics/actions";
import { Send, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { TeacherTransferTargetOption } from "@/types/teacherPortal";

export type { TeacherTransferTargetOption } from "@/types/teacherPortal";

function SubmitFooter({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" isLoading={pending} disabled={pending}>
      {!pending ? <Send className="h-4 w-4 shrink-0" aria-hidden /> : null}
      {label}
    </Button>
  );
}

function reasonLabel(
  dict: Dictionary["dashboard"]["teacherMySections"],
  code: TeacherTransferReasonCode,
): string {
  return dict.transferReasons[code];
}

export interface TeacherTransferSuggestionFormProps {
  locale: string;
  formInstanceKey: string;
  studentId: string;
  fromSectionId: string;
  kind: "section" | "cohort";
  targets: TeacherTransferTargetOption[];
  dict: Dictionary["dashboard"]["teacherMySections"];
  onCancel: () => void;
  onSuccess: () => void;
}

export function TeacherTransferSuggestionForm({
  locale,
  formInstanceKey,
  studentId,
  fromSectionId,
  kind,
  targets,
  dict,
  onCancel,
  onSuccess,
}: TeacherTransferSuggestionFormProps) {
  const [state, formAction] = useActionState(submitTransferSuggestionAction, null as TransferSuggestionActionState | null);
  const [toId, setToId] = useState("");
  const resolvedToId = useMemo(
    () => (targets.some((t) => t.id === toId) ? toId : (targets[0]?.id ?? "")),
    [targets, toId],
  );
  const selected = targets.find((t) => t.id === resolvedToId) ?? targets[0];
  const fired = useRef(false);

  useEffect(() => {
    if (!state?.ok) {
      fired.current = false;
      return;
    }
    if (fired.current) return;
    fired.current = true;
    onSuccess();
  }, [state, onSuccess]);

  const errMsg =
    state && !state.ok
      ? state.code === "duplicate"
        ? dict.transferErrorDuplicate
        : state.code === "validation"
          ? dict.transferErrorValidation
          : state.code === "forbidden"
            ? dict.transferErrorForbidden
            : dict.transferErrorGeneric
      : null;

  if (targets.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{dict.noTransferTargets}</p>;
  }

  return (
    <form key={formInstanceKey} action={formAction} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="fromSectionId" value={fromSectionId} />
      <input type="hidden" name="kind" value={kind} />

      <div>
        <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="tts-to">
          {dict.toSectionLabel}
        </label>
        <select
          id="tts-to"
          name="toSectionId"
          required
          value={resolvedToId}
          onChange={(e) => setToId(e.target.value)}
          className="mt-1 w-full min-h-[44px] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        >
          {targets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.atCapacity ? `${o.label} (${dict.targetFullLabel})` : o.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {selected?.atCapacity
            ? dict.targetSelectedFullWarning
            : targets.some((t) => t.atCapacity)
              ? dict.targetCapacityHint
              : dict.targetCapacityOk}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="tts-reason">
          {dict.reasonLabel}
        </label>
        <select
          id="tts-reason"
          name="reasonCode"
          required
          className="mt-1 w-full min-h-[44px] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          defaultValue={TEACHER_TRANSFER_REASON_CODES[0]}
        >
          {TEACHER_TRANSFER_REASON_CODES.map((code) => (
            <option key={code} value={code}>
              {reasonLabel(dict, code)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--color-foreground)]" htmlFor="tts-comment">
          {dict.commentLabel}
        </label>
        <textarea
          id="tts-comment"
          name="comment"
          rows={3}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </div>

      {errMsg ? <p className="text-sm text-[var(--color-error)]">{errMsg}</p> : null}

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onCancel}>
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {dict.cancel}
        </Button>
        <SubmitFooter label={dict.submit} />
      </div>
    </form>
  );
}
