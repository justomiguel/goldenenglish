import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function AdminBackLink({
  href,
  children,
  title,
}: {
  href: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <Link
      href={href}
      title={title}
      className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
      {children}
    </Link>
  );
}
