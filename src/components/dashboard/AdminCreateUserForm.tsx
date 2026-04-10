"use client";

import { type FormEvent, useState } from "react";
import { createDashboardUser } from "@/app/[locale]/dashboard/admin/users/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";

const ROLES = ["admin", "teacher", "parent", "student"] as const;

interface AdminCreateUserFormProps {
  labels: Dictionary["admin"]["users"];
}

export function AdminCreateUserForm({ labels }: AdminCreateUserFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await createDashboardUser({
      email,
      password,
      role,
      first_name: firstName,
      last_name: lastName,
      dni_or_passport: dni,
      phone: phone || undefined,
    });
    setBusy(false);
    setMsg(res.ok ? labels.success : `${labels.error}: ${res.message ?? ""}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-xl space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6"
    >
      <h2 className="text-lg font-semibold text-[var(--color-secondary)]">
        {labels.title}
      </h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      <div>
        <Label htmlFor="cu-email">{labels.email}</Label>
        <Input
          id="cu-email"
          type="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1 w-full"
        />
      </div>
      <div>
        <Label htmlFor="cu-pass">{labels.password}</Label>
        <Input
          id="cu-pass"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="mt-1 w-full"
        />
      </div>
      <div>
        <Label htmlFor="cu-role">{labels.role}</Label>
        <select
          id="cu-role"
          value={role}
          onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="cu-fn">{labels.firstName}</Label>
          <Input
            id="cu-fn"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </div>
        <div>
          <Label htmlFor="cu-ln">{labels.lastName}</Label>
          <Input
            id="cu-ln"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="cu-dni">{labels.dni}</Label>
        <Input
          id="cu-dni"
          value={dni}
          onChange={(e) => setDni(e.target.value)}
          required
          className="mt-1 w-full"
        />
      </div>
      <div>
        <Label htmlFor="cu-ph">{labels.phone}</Label>
        <Input
          id="cu-ph"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full"
        />
      </div>
      <Button type="submit" disabled={busy} isLoading={busy}>
        {labels.submit}
      </Button>
      {msg ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p>
      ) : null}
    </form>
  );
}
