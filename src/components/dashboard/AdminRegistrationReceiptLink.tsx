"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { registrationEnrollmentReceiptUrlAction } from "@/app/[locale]/dashboard/admin/registrations/registrationIntakeActions";

export function AdminRegistrationReceiptLink({
  registrationId,
  label,
}: {
  registrationId: string;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="mt-1 min-h-11 justify-start px-2"
      onClick={async () => {
        const res = await registrationEnrollmentReceiptUrlAction(registrationId);
        if (res.ok) window.open(res.url, "_blank", "noopener,noreferrer");
      }}
    >
      <FileText className="h-4 w-4" aria-hidden />
      {label}
    </Button>
  );
}
