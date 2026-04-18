"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { updateWardProfile } from "@/app/[locale]/dashboard/parent/children/[studentId]/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import { trackEvent } from "@/lib/analytics/trackClient";

export interface ParentWardProfileFormProps {
  locale: string;
  studentId: string;
  initial: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    birth_date: string | null;
  };
  labels: Dictionary["dashboard"]["parent"];
}

export function ParentWardProfileForm({
  locale,
  studentId,
  initial,
  labels,
}: ParentWardProfileFormProps) {
  const [firstName, setFirstName] = useState(initial.first_name);
  const [lastName, setLastName] = useState(initial.last_name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [birth, setBirth] = useState(
    initial.birth_date ? String(initial.birth_date).slice(0, 10) : "",
  );
  const [parentPassword, setParentPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const trimmedEmail = email.trim().toLowerCase();
  const initialEmail = (initial.email ?? "").trim().toLowerCase();
  const emailChanging = trimmedEmail !== initialEmail;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await updateWardProfile({
      locale,
      studentId,
      first_name: firstName,
      last_name: lastName,
      email: email.trim(),
      phone,
      birth_date: birth,
      parentPassword: emailChanging ? parentPassword : undefined,
    });
    setBusy(false);
    if (res.ok) {
      setMsg(labels.wardSaved);
      setParentPassword("");
      trackEvent("action", "section:parent_ward_profile", { student_id: studentId });
      return;
    }
    setErr(res.message ?? labels.wardError);
  }

  const base = `/${locale}/dashboard/parent`;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link
        href={base}
        className="inline-block text-sm font-medium text-[var(--color-primary)] underline"
      >
        ← {labels.navHome}
      </Link>
      <div>
        <h1 className="font-display text-3xl font-bold text-[var(--color-secondary)]">
          {labels.editChildTitle}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{labels.editChildLead}</p>
      </div>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <div>
          <Label htmlFor="ward-fn">{labels.wardFirstName}</Label>
          <Input
            id="ward-fn"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="ward-ln">{labels.wardLastName}</Label>
          <Input
            id="ward-ln"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="ward-em">{labels.wardEmail}</Label>
          <Input
            id="ward-em"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </div>
        {emailChanging ? (
          <div>
            <Label htmlFor="ward-parent-pw">{labels.wardPasswordLabel}</Label>
            <Input
              id="ward-parent-pw"
              type="password"
              autoComplete="current-password"
              value={parentPassword}
              onChange={(e) => setParentPassword(e.target.value)}
              required
              className="mt-1 w-full"
            />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {labels.wardPasswordHelp}
            </p>
          </div>
        ) : null}
        <div>
          <Label htmlFor="ward-ph">{labels.wardPhone}</Label>
          <Input
            id="ward-ph"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="ward-bd">{labels.wardBirthDate}</Label>
          <Input
            id="ward-bd"
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </div>
        {err ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {err}
          </p>
        ) : null}
        {msg ? (
          <p className="text-sm text-[var(--color-primary)]" role="status">
            {msg}
          </p>
        ) : null}
        <Button type="submit" className="min-h-[44px] w-full sm:w-auto" disabled={busy} isLoading={busy}>
          {labels.saveWard}
        </Button>
      </form>
    </div>
  );
}
