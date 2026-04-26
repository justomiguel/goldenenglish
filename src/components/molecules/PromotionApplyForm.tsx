"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { applyPromotionCodeForStudent } from "@/app/[locale]/dashboard/student/payments/applyPromotionCodeForStudentAction";
import { Tag } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Locale } from "@/types/i18n";

export type PromotionApplyLabels = {
  promoTitle: string;
  promoLead: string;
  promoPlaceholder: string;
  promoApply: string;
  promoSuccess: string;
  promoError: string;
};

interface PromotionApplyFormProps {
  locale: Locale;
  studentId: string;
  labels: PromotionApplyLabels;
}

export function PromotionApplyForm({ locale, studentId, labels }: PromotionApplyFormProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await applyPromotionCodeForStudent(locale, studentId, code);
    setBusy(false);
    if (res.ok) {
      setCode("");
      setMsg(labels.promoSuccess);
      router.refresh();
    } else {
      setMsg(`${labels.promoError}${res.message ? `: ${res.message}` : ""}`);
    }
  }

  return (
    <section
      className="mt-8 max-w-lg rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      aria-labelledby="promo-title"
    >
      <h2 id="promo-title" className="font-semibold text-[var(--color-secondary)]">
        {labels.promoTitle}
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.promoLead}</p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[12rem] flex-1">
          <Label htmlFor="promo-code">{labels.promoPlaceholder}</Label>
          <Input
            id="promo-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            className="mt-1"
          />
        </div>
        <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px]">
          {!busy ? <Tag className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {labels.promoApply}
        </Button>
      </form>
      {msg ? (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]" role="status">
          {msg}
        </p>
      ) : null}
    </section>
  );
}
