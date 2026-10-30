"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import {
  BlogGuestCommentFields,
  type BlogGuestCommentLabels,
} from "@/components/molecules/BlogGuestCommentFields";

interface BlogGuestCommentSheetProps {
  locale: string;
  articleId: string;
  openLabel: string;
  labels: BlogGuestCommentLabels;
}

export function BlogGuestCommentSheet({
  locale,
  articleId,
  openLabel,
  labels,
}: BlogGuestCommentSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" className="w-full" onClick={() => setOpen(true)}>
        <MessageSquare aria-hidden className="h-4 w-4" />
        {openLabel}
      </Button>
      {open ? (
        <Modal open title={openLabel} titleId="blog-guest-comment" onOpenChange={setOpen}>
          <BlogGuestCommentFields locale={locale} articleId={articleId} labels={labels} />
        </Modal>
      ) : null}
    </>
  );
}
