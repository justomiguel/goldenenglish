"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SignOutButtonProps {
  locale: string;
  label: string;
  className?: string;
  /** Icon only + aria-label (mobile header). */
  iconOnly?: boolean;
  /** Native tooltip (pointer users); keep copy in dictionaries. */
  title?: string;
}

export function SignOutButton({
  locale,
  label,
  className = "",
  iconOnly = false,
  title,
}: SignOutButtonProps) {
  const router = useRouter();

  async function handleClick() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push(`/${locale}`);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-2 ${className}`}
      aria-label={iconOnly ? label : undefined}
      title={title}
    >
      <LogOut
        className={iconOnly ? "h-5 w-5" : "h-4 w-4 opacity-90"}
        aria-hidden
        strokeWidth={1.75}
      />
      {iconOnly ? null : <span>{label}</span>}
    </button>
  );
}
