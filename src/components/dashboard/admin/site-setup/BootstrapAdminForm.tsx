"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Hash,
  Mail,
  Phone,
  Shield,
  UserPlus,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { createClient } from "@/lib/supabase/client";
import { bootstrapFirstAdminAction } from "@/app/[locale]/setup/first-run/bootstrapFirstAdminAction";

type SiteSetupDict = Dictionary["dashboard"]["siteSetup"];

interface BootstrapAdminFormProps {
  locale: string;
  labels: SiteSetupDict;
  loginLabels: Dictionary["login"];
}

export function BootstrapAdminForm({ locale, labels, loginLabels }: BootstrapAdminFormProps) {
  const router = useRouter();
  const b = labels.bootstrap;
  const err = labels.errors;
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");

  const resolveErr = (code: string) => {
    const k = err as Record<string, string>;
    const mapped: Record<string, string> = {
      invalid_input: k.invalid_input,
      password_mismatch: k.password_mismatch,
      closed: k.bootstrap_closed,
      admin_already_exists: k.bootstrap_admin_exists,
      auth_failed: k.bootstrap_auth_failed,
      persist_failed: k.persist_failed,
      bootstrap_auth_failed: k.bootstrap_auth_failed,
      bootstrap_closed: k.bootstrap_closed,
      bootstrap_admin_exists: k.bootstrap_admin_exists,
    };
    return mapped[code] ?? k.generic;
  };

  const submit = async () => {
    setBusy(true);
    setErrorKey(null);
    try {
      const res = await bootstrapFirstAdminAction({
        email,
        password,
        passwordConfirm,
        first_name: firstName,
        last_name: lastName,
        dni_or_passport: dni,
        phone,
      });
      if (!res.ok) {
        setErrorKey(res.code);
        return;
      }
      const supabase = createClient();
      const signIn = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signIn.error) {
        setErrorKey("bootstrap_auth_failed");
        return;
      }
      router.refresh();
    } catch {
      setErrorKey("generic");
    } finally {
      setBusy(false);
    }
  };

  const message = errorKey ? resolveErr(errorKey) : null;

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:py-16">
      <div className="mb-8 text-center">
        <Shield
          className="mx-auto mb-3 h-12 w-12 text-[var(--color-primary)]"
          aria-hidden
        />
        <h1 className="font-display text-2xl font-semibold text-[var(--color-primary)]">
          {b.pageTitle}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {b.pageLead}
        </p>
      </div>

      {message ? (
        <p
          className="mb-6 rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[var(--color-muted)] px-3 py-2 text-sm text-[var(--color-error)]"
          role="alert"
        >
          {message}
        </p>
      ) : null}

      <div className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div>
          <Label htmlFor="boot-email">{b.email}</Label>
          <Input
            id="boot-email"
            type="email"
            autoComplete="email"
            className="mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="boot-pw">{b.password}</Label>
          <Input
            id="boot-pw"
            type="password"
            autoComplete="new-password"
            className="mt-1"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="boot-pw2">{b.passwordConfirm}</Label>
          <Input
            id="boot-pw2"
            type="password"
            autoComplete="new-password"
            className="mt-1"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="boot-fn">{b.firstName}</Label>
            <Input
              id="boot-fn"
              className="mt-1"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
            />
          </div>
          <div>
            <Label htmlFor="boot-ln">{b.lastName}</Label>
            <Input
              id="boot-ln"
              className="mt-1"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="boot-dni">{b.dni}</Label>
          <div className="relative mt-1">
            <Hash
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]"
              aria-hidden
            />
            <Input
              id="boot-dni"
              className="pl-10"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>
        <div>
          <Label htmlFor="boot-phone">{b.phone}</Label>
          <div className="relative mt-1">
            <Phone
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]"
              aria-hidden
            />
            <Input
              id="boot-phone"
              type="tel"
              className="pl-10"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="primary"
          size="lg"
          className="mt-2 min-h-[44px] w-full"
          disabled={busy}
          onClick={() => void submit()}
        >
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
          {busy ? labels.buttons.submitting : b.submit}
        </Button>
      </div>

      <p className="mt-8 text-center text-xs text-[var(--color-muted-foreground)]">
        <a
          href={`/${locale}/login`}
          className="inline-flex items-center justify-center gap-2 font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
        >
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          {loginLabels.alreadyHaveAccount}
        </a>
      </p>
    </div>
  );
}
