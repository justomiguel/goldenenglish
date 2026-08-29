import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";

export type AdminParentsToolbarChrome = {
  labels: Dictionary["admin"]["parents"];
  onInvite: () => void;
  onCompose: () => void;
  inviteBusy?: boolean;
};

export function AdminParentsToolbarFields({
  chrome,
  totalCount,
}: {
  chrome: AdminParentsToolbarChrome;
  totalCount: number;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        className="rounded-xl"
        disabled={chrome.inviteBusy || totalCount === 0}
        onClick={chrome.onInvite}
      >
        {chrome.labels.invite}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-xl border border-[var(--color-border)]"
        disabled={totalCount === 0}
        onClick={chrome.onCompose}
      >
        {chrome.labels.compose}
      </Button>
    </div>
  );
}
