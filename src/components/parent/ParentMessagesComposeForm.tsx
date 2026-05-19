"use client";

import { GraduationCap, Send, Shield } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendParentMessage } from "@/app/[locale]/dashboard/parent/messages/actions";
import { Button } from "@/components/atoms/Button";
import { RecipientAutocomplete } from "@/components/molecules/RecipientAutocomplete";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import {
  UnderlineTabBar,
  type UnderlineTabItem,
} from "@/components/molecules/UnderlineTabBar";
import type { Dictionary } from "@/types/i18n";
import type { MessagingRecipient } from "@/types/messaging";

export const PARENT_MESSAGE_DEST_TEACHER = "teacher";
export const PARENT_MESSAGE_DEST_ADMINISTRATION = "administration";

type ComposeDestination =
  | typeof PARENT_MESSAGE_DEST_TEACHER
  | typeof PARENT_MESSAGE_DEST_ADMINISTRATION;

function resolveComposeDestination(
  preferred: ComposeDestination,
  teacherComposeAvailable: boolean,
  administrationComposeAvailable: boolean,
): ComposeDestination {
  if (preferred === PARENT_MESSAGE_DEST_TEACHER && teacherComposeAvailable) {
    return PARENT_MESSAGE_DEST_TEACHER;
  }
  if (preferred === PARENT_MESSAGE_DEST_ADMINISTRATION && administrationComposeAvailable) {
    return PARENT_MESSAGE_DEST_ADMINISTRATION;
  }
  if (teacherComposeAvailable) return PARENT_MESSAGE_DEST_TEACHER;
  if (administrationComposeAvailable) return PARENT_MESSAGE_DEST_ADMINISTRATION;
  return preferred;
}

export interface ParentMessagesComposeFormProps {
  locale: string;
  recipients: MessagingRecipient[];
  teacherComposeAvailable: boolean;
  administrationComposeAvailable: boolean;
  labels: Dictionary["dashboard"]["parent"];
  defaultRecipientId?: string;
  /** Called after a successful send (e.g. close PWA compose modal). */
  onSentSuccess?: () => void;
  /** Surface-specific wrapper classes on the form element. */
  className?: string;
  /** When false, skips the in-form heading (e.g. modal already has a title). */
  showHeading?: boolean;
}

export function ParentMessagesComposeForm({
  locale,
  recipients,
  teacherComposeAvailable,
  administrationComposeAvailable,
  labels,
  defaultRecipientId,
  onSentSuccess,
  className = "space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm md:p-5",
  showHeading = true,
}: ParentMessagesComposeFormProps) {
  const router = useRouter();
  const tabPrefix = useId().replace(/:/g, "");
  const presetRecipient =
    defaultRecipientId && recipients.some((r) => r.id === defaultRecipientId)
      ? defaultRecipientId
      : "";
  const singleRecipientId = recipients.length === 1 ? recipients[0].id : "";

  const [preferredDestination, setPreferredDestination] = useState<ComposeDestination>(() => {
    if (presetRecipient && teacherComposeAvailable) return PARENT_MESSAGE_DEST_TEACHER;
    if (teacherComposeAvailable) return PARENT_MESSAGE_DEST_TEACHER;
    return PARENT_MESSAGE_DEST_ADMINISTRATION;
  });
  const destination = resolveComposeDestination(
    preferredDestination,
    teacherComposeAvailable,
    administrationComposeAvailable,
  );
  const [recipientId, setRecipientId] = useState(presetRecipient);
  const [body, setBody] = useState("<p></p>");
  const [composeKey, setComposeKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const canComposeAny = teacherComposeAvailable || administrationComposeAvailable;
  const effectiveRecipientId = recipientId || singleRecipientId;

  const tabItems: UnderlineTabItem[] = useMemo(
    () => [
      {
        id: PARENT_MESSAGE_DEST_TEACHER,
        label: labels.messagesComposeTabTeacher,
        Icon: GraduationCap,
        disabled: !teacherComposeAvailable,
        title: !teacherComposeAvailable ? labels.messagesNoTeachers : undefined,
      },
      {
        id: PARENT_MESSAGE_DEST_ADMINISTRATION,
        label: labels.messagesComposeTabAdministration,
        Icon: Shield,
        disabled: !administrationComposeAvailable,
        title: !administrationComposeAvailable ? labels.messagesNoAdministration : undefined,
      },
    ],
    [
      administrationComposeAvailable,
      labels.messagesComposeTabAdministration,
      labels.messagesComposeTabTeacher,
      labels.messagesNoAdministration,
      labels.messagesNoTeachers,
      teacherComposeAvailable,
    ],
  );

  const composeHint =
    destination === PARENT_MESSAGE_DEST_TEACHER
      ? labels.messagesComposeHintTeacher
      : labels.messagesComposeHintAdministration;

  const editorTip =
    destination === PARENT_MESSAGE_DEST_TEACHER
      ? labels.tipComposeBody
      : labels.tipComposeBodyAdministration;

  const sendTip =
    destination === PARENT_MESSAGE_DEST_TEACHER
      ? labels.tipComposeSend
      : labels.tipComposeSendAdministration;

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (destination === PARENT_MESSAGE_DEST_TEACHER && !effectiveRecipientId) return;
    if (destination === PARENT_MESSAGE_DEST_TEACHER && !teacherComposeAvailable) return;
    if (destination === PARENT_MESSAGE_DEST_ADMINISTRATION && !administrationComposeAvailable) return;

    setBusy(true);
    setMsg(null);
    const res = await sendParentMessage(
      locale,
      body,
      destination,
      destination === PARENT_MESSAGE_DEST_TEACHER ? effectiveRecipientId : undefined,
    );
    setBusy(false);
    if (res.ok) {
      setMsg(labels.messagesComposeSent);
      setBody("<p></p>");
      setRecipientId("");
      setComposeKey((k) => k + 1);
      router.refresh();
      onSentSuccess?.();
    } else {
      setMsg(`${labels.messagesComposeError}${res.message ? `: ${res.message}` : ""}`);
    }
  }

  if (!canComposeAny) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.messagesNoCompose}</p>
    );
  }

  return (
    <form onSubmit={onSend} className={className}>
      {showHeading ? (
        <h2 className="font-display text-lg font-semibold text-[var(--color-secondary)]">
          {labels.messagesComposeTitle}
        </h2>
      ) : null}
      <UnderlineTabBar
        idPrefix={`par-msg-${tabPrefix}`}
        ariaLabel={labels.messagesComposeTabsAria}
        items={tabItems}
        value={destination}
        onChange={(id) => setPreferredDestination(id as ComposeDestination)}
        dense
      />
      <p className="text-sm leading-snug text-[var(--color-muted-foreground)]">{composeHint}</p>
      {destination === PARENT_MESSAGE_DEST_TEACHER ? (
        <>
          <label
            className="block text-sm font-medium text-[var(--color-foreground)]"
            htmlFor="parent-msg-to"
          >
            {labels.messagesComposeTo}
          </label>
          <RecipientAutocomplete
            id="parent-msg-to"
            options={recipients}
            value={effectiveRecipientId}
            onValueChange={setRecipientId}
            disabled={busy}
            placeholder={labels.messagesRecipientSearchPlaceholder}
            noMatchesText={labels.messagesRecipientNoMatches}
            emptyOptionsText={labels.messagesRecipientListEmpty}
            roleLabels={{ teacher: labels.messagesRoleTeacher }}
            ariaLabel={labels.messagesComposeTo}
            inputTitle={labels.tipComposeRecipient}
          />
        </>
      ) : null}
      <RichTextEditor
        key={`${composeKey}-${destination}`}
        value={body}
        onChange={setBody}
        disabled={busy}
        title={editorTip}
        aria-label={labels.messagesComposeAria}
      />
      <Button
        type="submit"
        disabled={
          busy ||
          (destination === PARENT_MESSAGE_DEST_TEACHER &&
            (!teacherComposeAvailable || !effectiveRecipientId)) ||
          (destination === PARENT_MESSAGE_DEST_ADMINISTRATION && !administrationComposeAvailable)
        }
        isLoading={busy}
        className="min-h-[44px] w-full sm:w-auto"
        title={sendTip}
      >
        {!busy ? <Send className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {labels.messagesComposeSend}
      </Button>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </form>
  );
}
