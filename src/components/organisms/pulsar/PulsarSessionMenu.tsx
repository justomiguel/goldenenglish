"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut } from "lucide-react";
import { signOutPulsarSessionAction } from "@/app/[locale]/admin/sessionActions";
import type { Dictionary } from "@/types/i18n";

export function PulsarSessionMenu({
  locale,
  email,
  copy,
}: {
  locale: string;
  email: string | null;
  copy: Dictionary["pulsar"]["session"];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    const result = await signOutPulsarSessionAction(locale);
    setPending(false);
    if (!result.ok) return;
    router.push(`/${locale}`);
    router.refresh();
  }

  if (!email) {
    return (
      <Link
        href={`/${locale}/cuenta/login`}
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--layout-border-radius)] px-3 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        {copy.signIn}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-[12rem] truncate text-xs text-[var(--color-muted-foreground)] sm:inline">
        {email}
      </span>
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="inline-flex min-h-11 items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" aria-hidden />
        {copy.signOut}
      </button>
    </div>
  );
}
