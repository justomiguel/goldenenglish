import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";
import {
  publicEventRegisterPanelClass,
  publicEventRegisterTypography,
} from "@/lib/events/publicEventSurfaceClasses";

interface BankTransferInstructionsPanelProps {
  title: string;
  instructions: string;
  surfaceVariant?: PublicEventSurfaceVariant;
}

export function BankTransferInstructionsPanel({
  title,
  instructions,
  surfaceVariant = "default",
}: BankTransferInstructionsPanelProps) {
  const trimmed = instructions.trim();
  if (!trimmed) return null;
  const typography = publicEventRegisterTypography(surfaceVariant);

  return (
    <section className={publicEventRegisterPanelClass(surfaceVariant)}>
      <h2 className={typography.sectionTitle}>{title}</h2>
      <p className={`whitespace-pre-wrap leading-relaxed ${typography.body}`}>{trimmed}</p>
    </section>
  );
}
