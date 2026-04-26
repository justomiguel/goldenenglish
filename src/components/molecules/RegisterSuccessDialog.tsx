"use client";

import { useRouter } from "next/navigation";
import { Home, UserPlus } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

interface RegisterSuccessDialogProps {
  locale: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dict: Dictionary["register"];
}

const titleId = "register-success-title";
const descId = "register-success-body";

export function RegisterSuccessDialog({
  locale,
  open,
  onOpenChange,
  dict,
}: RegisterSuccessDialogProps) {
  const router = useRouter();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={descId}
      title={dict.successTitle}
    >
      <p
        id={descId}
        className="text-sm leading-relaxed text-[var(--color-muted-foreground)]"
      >
        {dict.success}
      </p>
      <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={() => {
            onOpenChange(false);
          }}
        >
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
          {dict.anotherRequest}
        </Button>
        <Button
          type="button"
          variant="primary"
          className="w-full sm:w-auto"
          onClick={() => {
            onOpenChange(false);
            router.push(`/${locale}`);
          }}
        >
          <Home className="h-4 w-4 shrink-0" aria-hidden />
          {dict.backHome}
        </Button>
      </div>
    </Modal>
  );
}
