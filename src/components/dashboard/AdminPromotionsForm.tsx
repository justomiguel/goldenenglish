"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { createPromotion } from "@/app/[locale]/dashboard/admin/promotions/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["promotions"];

interface AdminPromotionsFormProps {
  locale: string;
  labels: Labels;
}

export function AdminPromotionsForm({ locale, labels }: AdminPromotionsFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [dtype, setDtype] = useState<"percent" | "fixed_amount">("percent");
  const [val, setVal] = useState("");
  const [applies, setApplies] = useState<"enrollment" | "monthly" | "both">("monthly");
  const [monthlyMonths, setMonthlyMonths] = useState("");
  const [stackable, setStackable] = useState(false);
  const [validFrom, setValidFrom] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
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
    const mm =
      applies === "enrollment"
        ? null
        : monthlyMonths.trim() === ""
          ? null
          : Number(monthlyMonths);
    if (applies !== "enrollment" && monthlyMonths.trim() !== "" && (!Number.isFinite(mm) || (mm as number) < 0)) {
      setMsg(labels.invalidMonthlyMonths);
      setBusy(false);
      return;
    }

    const res = await createPromotion({
      locale,
      code: code.trim(),
      name: name.trim(),
      description: desc.trim() || undefined,
      discountType: dtype,
      discountValue: v,
      appliesTo: applies,
      monthlyDurationMonths: mm,
      isStackable: stackable,
      validFrom: validFrom || undefined,
      expiresAt: expiresAt.trim() === "" ? null : expiresAt,
      maxUses: maxUses.trim() === "" ? null : Number(maxUses),
    });
    setBusy(false);
    if (res.ok) {
      setCode("");
      setName("");
      setDesc("");
      setVal("");
      setExpiresAt("");
      setMaxUses("");
      setMsg(null);
      router.refresh();
    } else {
      setMsg(res.message ?? labels.genericActionError);
    }
  }

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="font-semibold text-[var(--color-secondary)]">{labels.createTitle}</h2>
      <form onSubmit={onCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="pr-code">{labels.createCode}</Label>
          <Input
            id="pr-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className="mt-1"
            title={labels.tipCreateCode}
          />
        </div>
        <div>
          <Label htmlFor="pr-name">{labels.createName}</Label>
          <Input
            id="pr-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1"
            title={labels.tipCreateName}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pr-desc">{labels.createDesc}</Label>
          <Input id="pr-desc" value={desc} onChange={(e) => setDesc(e.target.value)} className="mt-1" title={labels.tipCreateDesc} />
        </div>
        <div>
          <Label htmlFor="pr-type">{labels.createDiscountType}</Label>
          <select
            id="pr-type"
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={dtype}
            title={labels.tipCreateDiscountType}
            onChange={(e) => setDtype(e.target.value as "percent" | "fixed_amount")}
          >
            <option value="percent">{labels.typePercent}</option>
            <option value="fixed_amount">{labels.typeFixed}</option>
          </select>
        </div>
        <div>
          <Label htmlFor="pr-val">{labels.createValue}</Label>
          <Input
            id="pr-val"
            type="number"
            step="0.01"
            min="0"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            required
            className="mt-1"
            title={labels.tipCreateValue}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pr-app">{labels.createAppliesTo}</Label>
          <select
            id="pr-app"
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={applies}
            title={labels.tipCreateAppliesTo}
            onChange={(e) => setApplies(e.target.value as "enrollment" | "monthly" | "both")}
          >
            <option value="enrollment">{labels.appliesEnrollment}</option>
            <option value="monthly">{labels.appliesMonthly}</option>
            <option value="both">{labels.appliesBoth}</option>
          </select>
        </div>
        {applies !== "enrollment" ? (
          <div className="sm:col-span-2">
            <Label htmlFor="pr-mm">{labels.createMonthlyMonths}</Label>
            <Input
              id="pr-mm"
              type="number"
              min={0}
              value={monthlyMonths}
              onChange={(e) => setMonthlyMonths(e.target.value)}
              className="mt-1"
              title={labels.tipCreateMonthlyMonths}
            />
          </div>
        ) : null}
        <div className="sm:col-span-2 flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm" title={labels.tipCreateStackable}>
            <input type="checkbox" checked={stackable} onChange={(e) => setStackable(e.target.checked)} />
            {labels.createStackable}
          </label>
        </div>
        <div>
          <Label htmlFor="pr-vf">{labels.createValidFrom}</Label>
          <Input
            id="pr-vf"
            type="datetime-local"
            value={validFrom}
            onChange={(e) => setValidFrom(e.target.value)}
            className="mt-1"
            title={labels.tipCreateValidFrom}
          />
        </div>
        <div>
          <Label htmlFor="pr-ex">{labels.createExpires}</Label>
          <Input
            id="pr-ex"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="mt-1"
            title={labels.tipCreateExpires}
          />
        </div>
        <div>
          <Label htmlFor="pr-mu">{labels.createMaxUses}</Label>
          <Input
            id="pr-mu"
            type="number"
            min={0}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            className="mt-1"
            title={labels.tipCreateMaxUses}
          />
        </div>
        <div className="sm:col-span-2">
          <Button
            type="submit"
            disabled={busy}
            isLoading={busy}
            className="min-h-[44px]"
            title={labels.tipCreateSubmit}
          >
            {busy ? null : <Plus className="h-4 w-4 shrink-0" aria-hidden />}
            {labels.createSubmit}
          </Button>
        </div>
      </form>
      {msg ? <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </section>
  );
}
