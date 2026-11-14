import type { ReactNode } from "react";
import { AdminRegistrationInfoTip } from "@/components/dashboard/AdminRegistrationInfoTip";

export function AdminRegistrationChoiceRow({
  tip,
  infoLabel,
  children,
}: {
  tip: string;
  infoLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      <div className="min-w-0 flex-1">{children}</div>
      <AdminRegistrationInfoTip text={tip} label={infoLabel} />
    </div>
  );
}
