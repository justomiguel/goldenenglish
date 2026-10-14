"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveEventEmailTemplateAction } from "@/app/[locale]/dashboard/admin/events/eventEmailTemplateActions";

type SaveInput = Parameters<typeof saveEventEmailTemplateAction>[0];

export function useSaveEventEmailTemplate() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<"saved" | "validation" | "error" | null>(null);

  async function save(input: SaveInput) {
    setPending(true);
    setNotice(null);
    const result = await saveEventEmailTemplateAction(input);
    setPending(false);
    if (!result.ok) {
      setNotice(
        result.message === "validation_failed" || result.message === "invalid_html"
          ? "validation"
          : "error",
      );
      return;
    }
    setNotice("saved");
    router.refresh();
  }

  return { pending, notice, save };
}
