"use client";

import { type FormEvent, useRef, useState } from "react";
import { submitPublicRegistration } from "@/app/[locale]/register/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { RegisterSuccessDialog } from "@/components/molecules/RegisterSuccessDialog";
import type { Dictionary } from "@/types/i18n";

interface RegisterFormProps {
  locale: string;
  dict: Dictionary["register"];
}

export function RegisterForm({ locale, dict }: RegisterFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgTone, setMsgTone] = useState<"error" | "muted">("error");
  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setMsgTone("error");
    const fd = new FormData(e.currentTarget);
    const res = await submitPublicRegistration(locale, {
      first_name: String(fd.get("first_name") ?? ""),
      last_name: String(fd.get("last_name") ?? ""),
      dni: String(fd.get("dni") ?? ""),
      email: String(fd.get("email") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      birth_date: String(fd.get("birth_date") ?? ""),
      level_interest: String(fd.get("level_interest") ?? ""),
    });
    setBusy(false);
    if (res.ok) {
      formRef.current?.reset();
      setSuccessOpen(true);
      return;
    }
    if (res.message === "closed") {
      setMsgTone("muted");
      setMsg(dict.closed);
    } else {
      setMsg(dict.error);
    }
  }

  return (
    <>
      <RegisterSuccessDialog
        locale={locale}
        open={successOpen}
        onOpenChange={setSuccessOpen}
        dict={dict}
      />
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="w-full max-w-lg space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-primary)]/[0.06]"
      >
        <div>
          <Label htmlFor="rg-fn">{dict.firstName}</Label>
          <Input
            id="rg-fn"
            name="first_name"
            required
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="rg-ln">{dict.lastName}</Label>
          <Input id="rg-ln" name="last_name" required className="mt-1 w-full" />
        </div>
        <div>
          <Label htmlFor="rg-dni">{dict.dni}</Label>
          <Input id="rg-dni" name="dni" required className="mt-1 w-full" />
        </div>
        <div>
          <Label htmlFor="rg-em">{dict.email}</Label>
          <Input
            id="rg-em"
            name="email"
            type="email"
            required
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="rg-ph">{dict.phone}</Label>
          <Input id="rg-ph" name="phone" required className="mt-1 w-full" />
        </div>
        <div>
          <Label htmlFor="rg-bd">{dict.birthDate}</Label>
          <Input
            id="rg-bd"
            name="birth_date"
            type="date"
            required
            className="mt-1 w-full"
            autoComplete="bday"
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {dict.birthDateHint}
          </p>
        </div>
        <div>
          <Label htmlFor="rg-lv">{dict.level}</Label>
          <Input id="rg-lv" name="level_interest" required className="mt-1 w-full" />
        </div>
        <Button type="submit" disabled={busy} isLoading={busy}>
          {dict.submit}
        </Button>
        {msg ? (
          <p
            className={
              msgTone === "muted"
                ? "text-sm text-[var(--color-muted-foreground)]"
                : "text-sm text-[var(--color-error)]"
            }
            role="alert"
          >
            {msg}
          </p>
        ) : null}
      </form>
    </>
  );
}
