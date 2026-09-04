"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { AdminMerchVariantRowEditor } from "@/components/dashboard/admin/merch/AdminMerchVariantRowEditor";
import {
  canRestoreMerchVariant,
  type AdminMerchLabels,
  type AdminMerchVariantRow,
  type AdminMerchVariantUpsertInput,
} from "@/components/dashboard/admin/merch/adminMerchTypes";

interface AdminMerchVariantEditorProps {
  labels: AdminMerchLabels;
  variants: AdminMerchVariantRow[];
  busy: boolean;
  onUpsert: (input: AdminMerchVariantUpsertInput) => Promise<boolean>;
  onRemove: (id: string) => Promise<void>;
}

export function AdminMerchVariantEditor({
  labels,
  variants,
  busy,
  onUpsert,
  onRemove,
}: AdminMerchVariantEditorProps) {
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState("0");
  const [price, setPrice] = useState("");
  const [removeId, setRemoveId] = useState<string | null>(null);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onUpsert({
      size: size.trim() || labels.sizePlaceholder,
      color: color.trim(),
      sku: sku.trim(),
      stock: Number(stock),
      price: Number(price),
      active: true,
    });
    if (ok) {
      setSize("");
      setColor("");
      setSku("");
      setStock("0");
      setPrice("");
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] md:p-6">
      <h2 className="font-semibold text-[var(--color-primary)]">{labels.variantsTitle}</h2>
      <ul className="mt-3 space-y-2">
        {variants.map((v) => (
          <AdminMerchVariantRowEditor
            key={v.id}
            labels={labels}
            variant={v}
            busy={busy}
            canRestore={canRestoreMerchVariant(v, variants)}
            onUpsert={onUpsert}
            onRemove={setRemoveId}
          />
        ))}
      </ul>
      <form onSubmit={(e) => void onAdd(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="var-new-size">{labels.variantSize}</Label>
          <Input id="var-new-size" value={size} onChange={(e) => setSize(e.target.value)} className="mt-1" placeholder={labels.sizePlaceholder} title={labels.tipVariantSize} />
        </div>
        <div>
          <Label htmlFor="var-new-color">{labels.variantColor}</Label>
          <Input id="var-new-color" value={color} onChange={(e) => setColor(e.target.value)} required className="mt-1" title={labels.tipVariantColor} />
        </div>
        <div>
          <Label htmlFor="var-new-sku">{labels.variantSku}</Label>
          <Input id="var-new-sku" value={sku} onChange={(e) => setSku(e.target.value)} required className="mt-1" title={labels.tipVariantSku} />
        </div>
        <div>
          <Label htmlFor="var-new-stock">{labels.variantStock}</Label>
          <Input id="var-new-stock" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} required className="mt-1" title={labels.tipVariantStock} />
        </div>
        <div>
          <Label htmlFor="var-new-price">{labels.variantPrice}</Label>
          <Input id="var-new-price" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="mt-1" title={labels.tipVariantPrice} />
        </div>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy} isLoading={busy} className="min-h-[44px]" title={labels.tipVariantAdd}>
            {busy ? null : <Plus className="h-4 w-4 shrink-0" aria-hidden />}
            {labels.variantAdd}
          </Button>
        </div>
      </form>
      <ConfirmActionModal
        open={removeId !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveId(null);
        }}
        title={labels.removeModalTitle}
        description={labels.removeModalBody}
        cancelLabel={labels.modalCancel}
        confirmLabel={labels.removeModalConfirm}
        confirmVariant="destructive"
        busy={busy}
        onConfirm={() => {
          if (removeId) {
            void onRemove(removeId).then(() => setRemoveId(null));
          }
        }}
      />
    </section>
  );
}
