"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { saveBlogSettingsAction } from "@/app/[locale]/dashboard/admin/cms/blog/blogPublicActions";

interface BlogConfigFormProps {
  locale: string;
  blogEnabled: boolean;
  commentsEnabled: boolean;
  guestCommentsEnabled: boolean;
  labels: {
    save: string;
    blogEnabled: string;
    comments: string;
    guestComments: string;
  };
}

export function BlogConfigForm({
  locale,
  blogEnabled,
  commentsEnabled,
  guestCommentsEnabled,
  labels,
}: BlogConfigFormProps) {
  const router = useRouter();
  const [blog, setBlog] = useState(blogEnabled);
  const [comments, setComments] = useState(commentsEnabled);
  const [guests, setGuests] = useState(guestCommentsEnabled);
  const [busy, setBusy] = useState(false);

  async function onSave() {
    setBusy(true);
    const result = await saveBlogSettingsAction({
      locale,
      blogEnabled: blog,
      commentsEnabled: comments,
      guestCommentsEnabled: guests,
    });
    setBusy(false);
    if (!result.ok) return;
    router.refresh();
  }

  return (
    <form
      className="grid max-w-lg gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
    >
      <Switch label={labels.blogEnabled} checked={blog} onChange={setBlog} />
      <Switch label={labels.comments} checked={comments} onChange={setComments} />
      <Switch label={labels.guestComments} checked={guests} onChange={setGuests} />
      <Button type="submit" isLoading={busy}>
        <Save aria-hidden className="h-4 w-4" />
        {labels.save}
      </Button>
    </form>
  );
}

function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm text-[var(--color-foreground)]">
      <span>{label}</span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}
