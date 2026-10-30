"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { createGuestBlogCommentAction } from "@/app/[locale]/dashboard/admin/cms/blog/blogPublicActions";

export interface BlogGuestCommentLabels {
  name: string;
  email: string;
  comment: string;
  send: string;
  pending: string;
}

interface BlogGuestCommentFieldsProps {
  locale: string;
  articleId: string;
  labels: BlogGuestCommentLabels;
}

export function BlogGuestCommentFields({
  locale,
  articleId,
  labels,
}: BlogGuestCommentFieldsProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = await createGuestBlogCommentAction({
      locale,
      articleId,
      displayName: name,
      email,
      bodyText: body,
    });
    if (!result.ok) return;
    setName("");
    setEmail("");
    setBody("");
    setPending(true);
  }

  return (
    <form className="grid gap-3" onSubmit={(event) => void onSubmit(event)}>
      <label className="grid gap-1 text-sm">
        <span>{labels.name}</span>
        <input
          name="name"
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span>{labels.email}</span>
        <input
          name="email"
          type="email"
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span>{labels.comment}</span>
        <textarea
          className="min-h-20 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>
      <Button type="submit">
        <Send aria-hidden className="h-4 w-4" />
        {labels.send}
      </Button>
      {pending ? <p className="text-sm text-[var(--color-muted-foreground)]">{labels.pending}</p> : null}
    </form>
  );
}
