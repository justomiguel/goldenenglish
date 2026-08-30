import type { DirectoryBillingMark as BillingMark } from "@/lib/dashboard/directoryBillingStatus";

export function DirectoryBillingMark({
  status,
  yesLabel,
  noLabel,
  yesTitle,
  noTitle,
  naTitle,
}: {
  status: BillingMark;
  yesLabel: string;
  noLabel: string;
  yesTitle: string;
  noTitle: string;
  naTitle: string;
}) {
  if (status === "na") {
    return (
      <span className="text-[var(--color-muted-foreground)]" title={naTitle}>
        —
      </span>
    );
  }
  const yes = status === "yes";
  return (
    <span
      title={yes ? yesTitle : noTitle}
      className={`inline-flex rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
        yes ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
      }`}
    >
      {yes ? yesLabel : noLabel}
    </span>
  );
}
