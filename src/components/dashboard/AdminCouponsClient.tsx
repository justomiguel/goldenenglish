"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useClientTableSort } from "@/hooks/useClientTableSort";
import { tableSortLabels } from "@/lib/i18n/tableSortLabels";
import {
  createDiscountCoupon,
  toggleDiscountCoupon,
} from "@/app/[locale]/dashboard/admin/coupons/actions";
import { Plus } from "lucide-react";
import { AdminCouponsTable } from "@/components/dashboard/AdminCouponsTable";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { AdminCouponRow } from "@/components/dashboard/AdminCouponsEntry";
import type { Dictionary } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";

interface AdminCouponsClientProps {
  locale: string;
  initialRows: AdminCouponRow[];
  labels: Dictionary["admin"]["coupons"];
}

export function AdminCouponsClient({ locale, initialRows, labels }: AdminCouponsClientProps) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sortLabels = tableSortLabels(locale);
  const { sortKey, sortDir, onToggleSort, sortedRows } = useClientTableSort(
    initialRows,
    {
      code: (r) => r.code,
      type: (r) => r.discount_type,
      value: (r) => r.discount_value,
      validFrom: (r) => r.valid_from,
      validUntil: (r) => r.valid_until ?? "",
      uses: (r) => r.uses_count,
      active: (r) => (r.is_active ? 1 : 0),
    },
    "code",
  );

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
      setMsg(labels.invalidDiscountValue);
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
      setMsg(res.message ?? labels.genericActionError);
    }
  }

  async function toggle(id: string, next: boolean) {
    setBusy(true);
    const res = await toggleDiscountCoupon(locale, id, next);
    setBusy(false);
    if (res.ok) {
      router.refresh();
    } else {
      setMsg(res.message ?? labels.genericActionError);
    }
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={labels.title}
        lead={labels.lead}
        iconId="coupons"
        tourAnchor={ADMIN_TOUR_ANCHORS.couponsTitle}
      />
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}

      <section
        data-tour={ADMIN_TOUR_ANCHORS.couponsCreateForm}
        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] md:p-6"
      >
        <h2 className="font-semibold text-[var(--color-primary)]">{labels.createTitle}</h2>
        <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="cp-code">{labels.createCode}</Label>
            <Input
              id="cp-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              title={labels.tipCreateCode}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cp-type">{labels.createDiscountType}</Label>
            <select
              id="cp-type"
              className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              value={dtype}
              title={labels.tipCreateType}
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
              title={labels.tipCreateValue}
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
              title={labels.tipCreateValidFrom}
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
              title={labels.tipCreateValidUntil}
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
              title={labels.tipCreateMaxUses}
              className="mt-1"
            />
          </div>
          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={busy}
              isLoading={busy}
              title={labels.tipCreateSubmit}
              className="min-h-[44px]"
            >
              {busy ? null : <Plus className="h-4 w-4 shrink-0" aria-hidden />}
              {labels.createSubmit}
            </Button>
          </div>
        </form>
      </section>

      <AdminCouponsTable
        rows={sortedRows}
        labels={labels}
        sortKey={sortKey}
        sortDir={sortDir}
        onToggleSort={onToggleSort}
        sortLabels={sortLabels}
        busy={busy}
        onToggle={(id, next) => void toggle(id, next)}
      />
    </div>
  );
}
