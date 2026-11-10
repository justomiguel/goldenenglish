export interface PulsarHousePhoneProps {
  label: string;
  children: React.ReactNode;
}

export function PulsarHousePhone({ label, children }: PulsarHousePhoneProps) {
  return (
    <div className="mx-auto w-full max-w-[16rem] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-5">
      <p className="text-sm text-[var(--color-muted-foreground)]">{label}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}
