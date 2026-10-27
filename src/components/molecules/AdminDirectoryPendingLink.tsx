"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export function AdminDirectoryPendingLink({
  href,
  title,
  ariaLabel,
  pendingLabel,
  className,
  children,
}: {
  href: string;
  title?: string;
  ariaLabel: string;
  pendingLabel: string;
  className: string;
  children: ReactNode;
}) {
  const [pending, setPending] = useState(false);
  return (
    <Link
      href={href}
      title={title}
      aria-label={pending ? pendingLabel : ariaLabel}
      aria-busy={pending || undefined}
      className={className}
      onClick={() => setPending(true)}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden /> : null}
      {children}
    </Link>
  );
}
