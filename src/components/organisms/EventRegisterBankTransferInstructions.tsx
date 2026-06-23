import { BankTransferInstructionsPanel } from "@/components/molecules/BankTransferInstructionsPanel";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";

interface EventRegisterBankTransferInstructionsProps {
  title: string;
  instructions: string;
  surfaceVariant?: PublicEventSurfaceVariant;
}

export function EventRegisterBankTransferInstructions({
  title,
  instructions,
  surfaceVariant = "default",
}: EventRegisterBankTransferInstructionsProps) {
  return (
    <BankTransferInstructionsPanel
      title={title}
      instructions={instructions}
      surfaceVariant={surfaceVariant}
    />
  );
}
