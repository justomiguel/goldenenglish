"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { Modal } from "@/components/atoms/Modal";
import { ADMIN_COMMAND_PALETTE_OPEN_EVENT } from "@/components/dashboard/AdminCommandPaletteTrigger";
import { AdminHelpSearchPanel } from "@/components/dashboard/AdminHelpSearchPanel";

export interface AdminCommandPaletteProps {
  locale: string;
  dict: Dictionary["dashboard"]["adminCommandPalette"];
}

/** Student search via the chrome button or ⌘/Ctrl+K. */
export function AdminCommandPalette({ locale, dict }: AdminCommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(ADMIN_COMMAND_PALETTE_OPEN_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(ADMIN_COMMAND_PALETTE_OPEN_EVENT, onOpen);
    };
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setResetKey((k) => k + 1);
  };

  const onClose = useCallback(() => handleOpenChange(false), []);

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      titleId="admin-cmdk-title"
      descriptionId="admin-cmdk-desc"
      title={dict.title}
      ariaLabel={dict.title}
      dialogClassName="max-w-lg"
    >
      <AdminHelpSearchPanel
        locale={locale}
        dict={dict}
        resetKey={resetKey}
        onClose={onClose}
      />
    </Modal>
  );
}
