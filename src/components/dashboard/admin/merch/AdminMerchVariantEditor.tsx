"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import type {
  AdminMerchLabels,
  AdminMerchVariantRow,
} from "@/components/dashboard/admin/merch/adminMerchTypes";

interface AdminMerchVariantEditorProps {
  labels: AdminMerchLabels;
  variants: AdminMerchVariantRow[];
  busy: boolean;
  onUpsert: (input: {
    size: string;
    color: string;
    sku: string;
    stock: number;
    price: number;
  }) => Promise<boolean>;
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
          <li
            key={v.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm"
          >
            <span>
              {v.size} · {v.color} · {v.sku} · {v.stock} · {v.price}
              {v.active ? "" : ` · ${labels.variantArchived}`}
            </span>
            <button
              type="button"
              className="inline-flex min-h-[36px] items-center gap-1.5 text-sm text-[var(--color-error)] underline"
              disabled={busy}
              title={labels.tipVariantRemove}
              onClick={() => setRemoveId(v.id)}
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {labels.variantRemove}
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={(e) => void onAdd(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="var-size">{labels.variantSize}</Label>
          <Input id="var-size" value={size} onChange={(e) => setSize(e.target.value)} className="mt-1" placeholder={labels.sizePlaceholder} title={labels.tipVariantSize} />
        </div>
        <div>
          <Label htmlFor="var-color">{labels.variantColor}</Label>
          <Input id="var-color" value={color} onChange={(e) => setColor(e.target.value)} required className="mt-1" title={labels.tipVariantColor} />
        </div>
        <div>
          <Label htmlFor="var-sku">{labels.variantSku}</Label>
          <Input id="var-sku" value={sku} onChange={(e) => setSku(e.target.value)} required className="mt-1" title={labels.tipVariantSku} />
        </div>
        <div>
          <Label htmlFor="var-stock">{labels.variantStock}</Label>
          <Input id="var-stock" type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)} required className="mt-1" title={labels.tipVariantStock} />
        </div>
        <div>
          <Label htmlFor="var-price">{labels.variantPrice}</Label>
          <Input id="var-price" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="mt-1" title={labels.tipVariantPrice} />
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
