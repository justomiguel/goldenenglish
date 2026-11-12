import type { ReactNode } from "react";

export function AdminRegistrationStepBlock({
  sentence,
  children,
}: {
  sentence: string;
  children: ReactNode;
}) {
  return (
    <div
      data-step-block
      className="flex w-full flex-col gap-3 bg-[color-mix(in_srgb,var(--color-success)_55%,black)] p-4 text-white"
    >
      <p className="text-sm text-white">{sentence}</p>
      {children}
    </div>
  );
}
