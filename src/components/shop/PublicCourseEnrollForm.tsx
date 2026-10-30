"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, LogIn } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { enrollPublicCourseAction } from "@/app/[locale]/tienda/curso/actions";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["shop"]["course"];

interface PublicCourseEnrollFormProps {
  locale: string;
  slug: string;
  price: number;
  signedIn: boolean;
  role: "student" | "parent" | "other";
  wards: { id: string; name: string }[];
  labels: Labels;
}

const FAIL_KEY: Record<string, keyof Labels> = {
  minor: "minor",
  missing_birth_date: "missingBirthDate",
  not_student: "notStudent",
  not_linked: "notLinked",
};

export function PublicCourseEnrollForm({
  locale,
  slug,
  price,
  signedIn,
  role,
  wards,
  labels,
}: PublicCourseEnrollFormProps) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(wards[0]?.id ?? "");
  const [pending, setPending] = useState(false);
  const [fail, setFail] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <Button type="button" onClick={() => router.push(`/${locale}/login`)}>
        <LogIn className="h-4 w-4" aria-hidden />
        {labels.signIn}
      </Button>
    );
  }

  async function submit(gateway?: "flow" | "mercadopago") {
    setPending(true);
    setFail(null);
    const result = await enrollPublicCourseAction({
      locale,
      slug,
      studentId: role === "parent" ? studentId : undefined,
      gateway,
    });
    setPending(false);
    if (!result.ok) {
      setFail(result.code);
      return;
    }
    if (result.redirectUrl) router.push(result.redirectUrl);
  }

  const failLabel = fail ? labels[FAIL_KEY[fail] ?? "failed"] : null;

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(price > 0 ? "flow" : undefined);
      }}
    >
      {role === "parent" ? (
        <label className="block space-y-1 text-sm text-[var(--color-foreground)]">
          {labels.wardLabel}
          <select
            required
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="block min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3"
          >
            {wards.map((ward) => (
              <option key={ward.id} value={ward.id}>
                {ward.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {price <= 0 ? (
        <Button type="submit" disabled={pending}>
          <CreditCard className="h-4 w-4" aria-hidden />
          {pending ? labels.saving : labels.enrollFree}
        </Button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending} onClick={() => void submit("flow")}>
            <CreditCard className="h-4 w-4" aria-hidden />
            {labels.payFlow}
          </Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={() => void submit("mercadopago")}>
            <CreditCard className="h-4 w-4" aria-hidden />
            {labels.payMercadoPago}
          </Button>
        </div>
      )}
      {failLabel ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {failLabel}
        </p>
      ) : null}
    </form>
  );
}
