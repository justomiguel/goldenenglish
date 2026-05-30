"use client";

import { useId } from "react";
import { FileUp, Video } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";

import type { BlogAttachChooserLabels } from "@/lib/blog/blogEditorMediaAttach";

interface BlogAttachChooserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: BlogAttachChooserLabels;
  onChooseYoutube: () => void;
  onChooseFile: () => void;
}

export function BlogAttachChooserModal({
  open,
  onOpenChange,
  labels,
  onChooseYoutube,
  onChooseFile,
}: BlogAttachChooserModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={descriptionId}
      title={labels.title}
    >
      <p id={descriptionId} className="text-sm text-[var(--color-muted-foreground)]">
        {labels.lead}
      </p>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={() => {
            onOpenChange(false);
            onChooseYoutube();
          }}
        >
          <Video className="h-4 w-4 shrink-0" aria-hidden />
          {labels.chooseYoutube}
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full justify-start gap-2"
          onClick={() => {
            onOpenChange(false);
            onChooseFile();
          }}
        >
          <FileUp className="h-4 w-4 shrink-0" aria-hidden />
          {labels.chooseFile}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
          {labels.cancel}
        </Button>
      </div>
    </Modal>
  );
}
