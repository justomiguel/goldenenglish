"use client";

import { useId, useMemo, useState } from "react";
import { GraduationCap, Send, Shield, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deleteStudentMessage,
  sendStudentMessage,
} from "@/app/[locale]/dashboard/student/messages/actions";
import { Button } from "@/components/atoms/Button";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import {
  UnderlineTabBar,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import type { Dictionary } from "@/types/i18n";
import type { StudentPortalMessageLineDto } from "@/types/studentPortal";

export type StudentMessageLineDto = StudentPortalMessageLineDto;

export const STUDENT_MESSAGE_DEST_TEACHER = "teacher";
export const STUDENT_MESSAGE_DEST_ADMINISTRATION = "administration";

type ComposeDestination = typeof STUDENT_MESSAGE_DEST_TEACHER | typeof STUDENT_MESSAGE_DEST_ADMINISTRATION;

const htmlBlockClass =
  "max-w-none text-sm leading-relaxed text-[var(--color-foreground)] [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5";

interface StudentMessagesClientProps {
  locale: string;
  initialLines?: StudentMessageLineDto[];
  teacherComposeAvailable: boolean;
  administrationComposeAvailable: boolean;
  labels: Dictionary["dashboard"]["student"];
}

export function StudentMessagesClient({
  locale,
  initialLines = [],
  teacherComposeAvailable,
  administrationComposeAvailable,
  labels,
}: StudentMessagesClientProps) {
  const router = useRouter();
  const tabPrefix = useId().replace(/:/g, "");
  const [destination, setDestination] = useState<ComposeDestination>(
    teacherComposeAvailable ? STUDENT_MESSAGE_DEST_TEACHER : STUDENT_MESSAGE_DEST_ADMINISTRATION,
  );
  const [body, setBody] = useState("<p></p>");
  const [composeKey, setComposeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canComposeAny = teacherComposeAvailable || administrationComposeAvailable;
  const showComposeTabs = teacherComposeAvailable && administrationComposeAvailable;

  const tabItems: UnderlineTabItem[] = useMemo(
    () => [
      {
        id: STUDENT_MESSAGE_DEST_TEACHER,
        label: labels.messagesComposeTabTeacher,
        Icon: GraduationCap,
      },
      {
        id: STUDENT_MESSAGE_DEST_ADMINISTRATION,
        label: labels.messagesComposeTabAdministration,
        Icon: Shield,
      },
    ],
    [labels.messagesComposeTabAdministration, labels.messagesComposeTabTeacher],
  );

  const composeHint =
    destination === STUDENT_MESSAGE_DEST_TEACHER
      ? labels.messagesComposeHintTeacher
      : labels.messagesComposeHintAdministration;

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await sendStudentMessage(locale, body, destination);
    setBusy(false);
    if (res.ok) {
      setMsg(labels.messagesSentOk);
      setBody("<p></p>");
      setComposeKey((k) => k + 1);
      router.refresh();
    } else {
      setMsg(`${labels.messagesError}${res.message ? `: ${res.message}` : ""}`);
    }
  }

  async function onDelete(id: string) {
    setBusy(true);
    const res = await deleteStudentMessage(locale, id);
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setMsg(labels.messagesError);
    }
  }

  const editorTip =
    destination === STUDENT_MESSAGE_DEST_TEACHER
      ? labels.tipComposeBody
      : labels.tipComposeBodyAdministration;

  const sendTip =
    destination === STUDENT_MESSAGE_DEST_TEACHER ? labels.tipComposeSend : labels.tipComposeSendAdministration;

  return (
    <div className="space-y-8">
      {!canComposeAny ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.messagesNoCompose}</p>
      ) : (
        <form onSubmit={onSend} className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm md:p-5">
          <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
            {labels.messagesCompose}
          </h2>
          {showComposeTabs ? (
            <>
              <UnderlineTabBar
                idPrefix={`stu-msg-${tabPrefix}`}
                ariaLabel={labels.messagesComposeTabsAria}
                items={tabItems}
                value={destination}
                onChange={(id) => setDestination(id as ComposeDestination)}
              />
              <p className="text-sm leading-snug text-[var(--color-muted-foreground)]">{composeHint}</p>
            </>
          ) : (
            <p className="text-sm leading-snug text-[var(--color-muted-foreground)]">{composeHint}</p>
          )}
          <RichTextEditor
            key={`${composeKey}-${destination}`}
            value={body}
            onChange={setBody}
            disabled={busy}
            title={editorTip}
            aria-label={labels.messagesPlaceholder}
          />
          <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px]" title={sendTip}>
            {!busy ? <Send className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {labels.messagesSend}
          </Button>
        </form>
      )}
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}

      <ul className="space-y-4">
        {initialLines.length === 0 ? (
          <li className="text-sm text-[var(--color-muted-foreground)]">{labels.messagesEmpty}</li>
        ) : (
          initialLines.map((m) => (
            <li
              key={m.id}
              className={`rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-4 shadow-sm ${
                m.from_me
                  ? "ml-2 border-[var(--color-primary)]/35 bg-[var(--color-surface)] md:ml-8"
                  : "mr-2 bg-[var(--color-muted)]/35 md:mr-8"
              }`}
            >
              <p className="text-xs uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {new Date(m.created_at).toLocaleString(locale)}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">
                {m.from_me
                  ? `${labels.messagesYouSentTo}: ${m.peer_name}`
                  : `${m.incoming_label}: ${m.peer_name}`}
              </p>
              <div className={htmlBlockClass} dangerouslySetInnerHTML={{ __html: m.body_html }} />
              {m.from_me && m.can_delete ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-3 min-h-[44px]"
                  disabled={busy}
                  title={labels.tipMessagesDelete}
                  onClick={() => onDelete(m.id)}
                >
                  <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                  {labels.messagesDelete}
                </Button>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
