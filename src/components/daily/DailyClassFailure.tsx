import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function DailyClassFailure({
  message,
  backHref,
  backLabel,
}: {
  message: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-foreground)]">{message}</p>
      <Link
        href={backHref}
        className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {backLabel}
      </Link>
    </div>
  );
}
