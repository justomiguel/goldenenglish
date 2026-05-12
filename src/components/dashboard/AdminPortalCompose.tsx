"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import {
  sendAdminMessage,
  sendAdminSiteContactVisitorReply,
} from "@/app/[locale]/dashboard/admin/messages/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { RecipientAutocomplete } from "@/components/molecules/RecipientAutocomplete";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import type { MessagingRecipient } from "@/types/messaging";
import type { Dictionary } from "@/types/i18n";
import type { AdminPortalReplyBootstrap } from "@/types/adminPortalCompose";

interface AdminPortalComposeProps {
  locale: string;
  recipients: MessagingRecipient[];
  labels: Dictionary["admin"]["messages"];
  /** When set, navigates here after a successful send instead of staying on the page. */
  successNavigateTo?: string;
  replyBootstrap: AdminPortalReplyBootstrap;
}

export function AdminPortalCompose({
  locale,
  recipients,
  labels,
  successNavigateTo,
  replyBootstrap,
}: AdminPortalComposeProps) {
  const router = useRouter();
  const initialRecipient =
    replyBootstrap.kind === "portal" ? replyBootstrap.recipientProfileId : "";
  const [recipientId, setRecipientId] = useState(initialRecipient);
  const [body, setBody] = useState("<p></p>");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const roleLabels = {
    student: labels.roleStudent,
    parent: labels.roleParent,
    teacher: labels.roleTeacher,
    admin: labels.roleAdmin,
  };

  const isExternal = replyBootstrap.kind === "external_email";

  async function onSubmitPortal(e: React.FormEvent) {
    e.preventDefault();
    if (!recipientId) return;
    setBusy(true);
    setMsg(null);
    const res = await sendAdminMessage(locale, recipientId, body);
    setBusy(false);
    if (res.ok) {
      if (successNavigateTo) {
        router.push(successNavigateTo);
        return;
      }
      setMsg(labels.composeSent);
      setBody("<p></p>");
      setRecipientId("");
      router.refresh();
    } else {
      setMsg(`${labels.composeError}${res.message ? `: ${res.message}` : ""}`);
    }
  }

  async function onSubmitExternal(e: React.FormEvent) {
    e.preventDefault();
    if (replyBootstrap.kind !== "external_email") return;
    setBusy(true);
    setMsg(null);
    const res = await sendAdminSiteContactVisitorReply(
      locale,
      replyBootstrap.sourceMessageId,
      body,
    );
    setBusy(false);
    if (res.ok) {
      if (successNavigateTo) {
        router.push(successNavigateTo);
        return;
      }
      setMsg(labels.composeExternalReplySent);
      setBody("<p></p>");
      router.refresh();
    } else {
      setMsg(`${labels.composeExternalReplyEmailFailed}${res.message ? `: ${res.message}` : ""}`);
    }
  }

  const replyErrorBanner =
    replyBootstrap.kind === "error" ? (
      <p className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/40 bg-[var(--color-muted)]/40 px-3 py-2 text-sm text-[var(--color-error)]">
        {replyBootstrap.code === "missing_visitor_email"
          ? labels.composeReplyMissingVisitorEmail
          : labels.composeReplyInvalidTarget}
      </p>
    ) : null;

  return (
    <form
      onSubmit={isExternal ? onSubmitExternal : onSubmitPortal}
      className="space-y-3 overflow-visible rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
    >
      {replyErrorBanner}
      <h2 className="text-lg font-semibold text-[var(--color-secondary)]">{labels.composeTitle}</h2>
      <label className="block text-sm font-medium text-[var(--color-foreground)]" htmlFor="admin-msg-to">
        {labels.composeTo}
      </label>
      {isExternal ? (
        <>
          <p className="text-xs text-[var(--color-muted-foreground)]">{labels.composeVisitorEmailLabel}</p>
          <Input
            id="admin-msg-to"
            readOnly
            value={replyBootstrap.visitorEmail}
            aria-label={labels.composeVisitorEmailLabel}
            className="bg-[var(--color-muted)]/30"
          />
        </>
      ) : (
        <RecipientAutocomplete
          id="admin-msg-to"
          options={recipients}
          value={recipientId}
          onValueChange={setRecipientId}
          disabled={busy}
          placeholder={labels.recipientSearchPlaceholder}
          noMatchesText={labels.recipientNoMatches}
          emptyOptionsText={labels.recipientListEmpty}
          roleLabels={roleLabels}
          ariaLabel={labels.composeTo}
          inputTitle={labels.tipComposeRecipient}
        />
      )}
      <RichTextEditor
        value={body}
        onChange={setBody}
        disabled={busy}
        title={labels.tipComposeBody}
        aria-label={labels.composeAria}
      />
      <Button
        type="submit"
        disabled={busy || (!isExternal && !recipientId)}
        isLoading={busy}
        className="min-h-[44px]"
        title={isExternal ? labels.tipComposeSendExternal : labels.tipComposeSend}
      >
        {busy ? null : <Send className="h-4 w-4 shrink-0" aria-hidden />}
        {labels.composeSend}
      </Button>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </form>
  );
}
