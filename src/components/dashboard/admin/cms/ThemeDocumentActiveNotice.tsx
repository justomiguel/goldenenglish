import Link from "next/link";
import { Paintbrush } from "lucide-react";

export function ThemeDocumentActiveNotice({
  href,
  body,
  linkLabel,
}: {
  href: string;
  body: string;
  linkLabel: string;
}) {
  return (
    <p
      role="status"
      className="flex flex-wrap items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-foreground)]"
    >
      <span>{body}</span>
      <Link
        href={href}
        className="inline-flex min-h-11 items-center gap-2 font-semibold text-[var(--color-primary)] underline-offset-4 hover:text-[var(--color-primary-dark)] hover:underline"
      >
        <Paintbrush className="h-4 w-4" aria-hidden />
        {linkLabel}
      </Link>
    </p>
  );
}
