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
    <button
      type="button"
      onClick={signOut}
      disabled={pending}
      aria-label={copy.signOut}
      title={copy.signOut}
      className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--layout-border-radius)] border-2 border-[var(--color-foreground)] bg-[var(--color-background)] text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] disabled:opacity-60"
    >
      <LogOut className="h-5 w-5" strokeWidth={2.5} aria-hidden />
    </button>
  );
}
