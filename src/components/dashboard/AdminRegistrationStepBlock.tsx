"use client";

import type { ReactNode } from "react";
import { AdminRegistrationInfoTip } from "@/components/dashboard/AdminRegistrationInfoTip";

export function AdminRegistrationStepBlock({
  sentence,
  infoLabel,
  plain = false,
  children,
}: {
  sentence: string;
  infoLabel: string;
  plain?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      data-step-block
      className={`flex w-full items-center gap-2 p-3 ${
        plain ? "" : "bg-[color-mix(in_srgb,var(--color-success)_55%,black)] text-white"
      }`}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <AdminRegistrationInfoTip text={sentence} label={infoLabel} onDark={!plain} />
    </div>
  );
}
