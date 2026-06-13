interface BankTransferInstructionsPanelProps {
  title: string;
  instructions: string;
}

export function BankTransferInstructionsPanel({
  title,
  instructions,
}: BankTransferInstructionsPanelProps) {
  const trimmed = instructions.trim();
  if (!trimmed) return null;

  return (
    <section className="space-y-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-foreground)]">
        {trimmed}
      </p>
    </section>
  );
}
