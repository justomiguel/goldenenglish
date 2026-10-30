"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOutPulsarStaffAction } from "@/app/[locale]/admin/actions";
import { Button } from "@/components/atoms/Button";

export function PulsarAccountSignOut({ locale, label }: { locale: string; label: string }) {
  const router = useRouter();

  async function signOut() {
    await signOutPulsarStaffAction(locale);
    router.push(`/${locale}/cuenta/login`);
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" onClick={signOut}>
      <LogOut className="h-4 w-4" aria-hidden />
      {label}
    </Button>
  );
}
