import Link from "next/link";
import { Video } from "lucide-react";

export function TeacherSectionJoinButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 text-sm font-medium text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)] lg:w-auto"
    >
      <Video className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
