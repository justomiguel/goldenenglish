"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { PulsarCloseTenantDialog } from "@/components/organisms/pulsar/PulsarCloseTenantDialog";
import type { Dictionary } from "@/types/i18n";

export interface PulsarAdminCloseTenantProps {
  locale: string;
  slug: string;
  copy: Dictionary["pulsar"]["admin"]["form"];
  redirectTo?: string;
}

export function PulsarAdminCloseTenant({ locale, slug, copy, redirectTo }: PulsarAdminCloseTenantProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-10 border-t border-[var(--color-border)] pt-6">
      <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" aria-hidden />
        {copy.closeCta}
      </Button>
      <PulsarCloseTenantDialog
        open={open}
        onOpenChange={setOpen}
        locale={locale}
        slug={slug}
        copy={copy}
        redirectTo={redirectTo}
      />
    </div>
  );
}
