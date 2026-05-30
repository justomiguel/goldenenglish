"use client";

import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";

export interface EventRegisterSuccessDialogLabels {
  title: string;
  body: string;
  close: string;
}

interface EventRegisterSuccessDialogProps {
  locale: string;
  open: boolean;
  labels: EventRegisterSuccessDialogLabels;
}

const titleId = "event-register-success-title";
const descId = "event-register-success-body";

export function EventRegisterSuccessDialog({
  locale,
  open,
  labels,
}: EventRegisterSuccessDialogProps) {
  const router = useRouter();

  function dismiss() {
    router.push(`/${locale}`);
  }

  return (
    <Modal
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss();
      }}
      titleId={titleId}
      descriptionId={descId}
      title={labels.title}
    >
      <p
        id={descId}
        className="text-sm leading-relaxed text-[var(--color-muted-foreground)]"
      >
        {labels.body}
      </p>
      <div className="mt-4 flex justify-end">
        <Button type="button" variant="primary" className="w-full sm:w-auto" onClick={dismiss}>
          <Home className="h-4 w-4 shrink-0" aria-hidden />
          {labels.close}
        </Button>
      </div>
    </Modal>
  );
}
