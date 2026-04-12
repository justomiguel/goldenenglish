"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createDiscountCoupon,
  toggleDiscountCoupon,
} from "@/app/[locale]/dashboard/admin/coupons/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { AdminCouponRow } from "@/components/dashboard/AdminCouponsEntry";
import type { Dictionary } from "@/types/i18n";

interface AdminCouponsClientProps {
  locale: string;
  initialRows: AdminCouponRow[];
  labels: Dictionary["admin"]["coupons"];
}

export function AdminCouponsClient({ locale, initialRows, labels }: AdminCouponsClientProps) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [code, setCode] = useState("");
  const [dtype, setDtype] = useState<"percent" | "fixed_amount">("percent");
  const [val, setVal] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [maxUses, setMaxUses] = useState("");

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const v = Number(val);
    if (!Number.isFinite(v) || v <= 0) {
      setMsg("Invalid value");
      setBusy(false);
      return;
    }
    const res = await createDiscountCoupon({
      locale,
      code: code.trim(),
      discountType: dtype,
      discountValue: v,
      validFrom: validFrom || undefined,
      validUntil: validUntil.trim() === "" ? null : validUntil,
      maxUses: maxUses.trim() === "" ? null : Number(maxUses),
    });
    setBusy(false);
    if (res.ok) {
      setCode("");
      setVal("");
      setValidUntil("");
      setMaxUses("");
      setMsg(null);
      router.refresh();
    } else {
      setMsg(res.message ?? "Error");
    }
  }

  async function toggle(id: string, next: boolean) {
    setBusy(true);
    const res = await toggleDiscountCoupon(locale, id, next);
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setMsg(res.message ?? "Error");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-secondary)]">{labels.title}</h1>
        <p className="mt-2 text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </div>
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}

      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="font-semibold text-[var(--color-secondary)]">{labels.createTitle}</h2>
        <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="cp-code">{labels.createCode}</Label>
            <Input id="cp-code" value={code} onChange={(e) => setCode(e.target.value)} required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="cp-type">{labels.createDiscountType}</Label>
            <select
              id="cp-type"
              className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              value={dtype}
              onChange={(e) => setDtype(e.target.value as "percent" | "fixed_amount")}
            >
              <option value="percent">{labels.typePercent}</option>
              <option value="fixed_amount">{labels.typeFixed}</option>
            </select>
          </div>
          <div>
            <Label htmlFor="cp-val">{labels.createValue}</Label>
            <Input
              id="cp-val"
              type="number"
              step="0.01"
              min="0"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cp-vf">{labels.createValidFrom}</Label>
            <Input
              id="cp-vf"
              type="datetime-local"
              value={validFrom}
              onChange={(e) => setValidFrom(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cp-vu">{labels.createValidUntil}</Label>
            <Input
              id="cp-vu"
              type="datetime-local"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cp-mu">{labels.createMaxUses}</Label>
            <Input
              id="cp-mu"
              type="number"
              min={0}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px]">
              {labels.createSubmit}
            </Button>
          </div>
        </form>
      </section>

      <section className="overflow-x-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)]">
        {initialRows.length === 0 ? (
          <p className="p-6 text-sm text-[var(--color-muted-foreground)]">{labels.none}</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/40">
              <tr>
                <th className="px-3 py-2">{labels.colCode}</th>
                <th className="px-3 py-2">{labels.colType}</th>
                <th className="px-3 py-2">{labels.colValue}</th>
                <th className="px-3 py-2">{labels.colValidFrom}</th>
                <th className="px-3 py-2">{labels.colValidUntil}</th>
                <th className="px-3 py-2">{labels.colUses}</th>
                <th className="px-3 py-2">{labels.colActive}</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.map((r) => (
                <tr key={r.id} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{r.code}</td>
                  <td className="px-3 py-2">
                    {r.discount_type === "percent" ? labels.typePercent : labels.typeFixed}
                  </td>
                  <td className="px-3 py-2">{r.discount_value}</td>
                  <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                    {new Date(r.valid_from).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-[var(--color-muted-foreground)]">
                    {r.valid_until ? new Date(r.valid_until).toLocaleString() : labels.eternal}
                  </td>
                  <td className="px-3 py-2">
                    {r.max_uses != null ? `${r.uses_count}/${r.max_uses}` : `${r.uses_count} (${labels.unlimited})`}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-sm text-[var(--color-primary)] underline"
                      disabled={busy}
                      onClick={() => toggle(r.id, !r.is_active)}
                    >
                      {r.is_active ? labels.toggleOff : labels.toggleOn}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
