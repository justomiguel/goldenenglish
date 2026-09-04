"use client";

import { useState } from "react";
import { RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type {
  AdminMerchLabels,
  AdminMerchVariantRow,
  AdminMerchVariantUpsertInput,
} from "@/components/dashboard/admin/merch/adminMerchTypes";

interface AdminMerchVariantRowEditorProps {
  labels: AdminMerchLabels;
  variant: AdminMerchVariantRow;
  busy: boolean;
  canRestore: boolean;
  onUpsert: (input: AdminMerchVariantUpsertInput) => Promise<boolean>;
  onRemove: (id: string) => void;
}

export function AdminMerchVariantRowEditor({
  labels,
  variant,
  busy,
  canRestore,
  onUpsert,
  onRemove,
}: AdminMerchVariantRowEditorProps) {
  const [stock, setStock] = useState(String(variant.stock));
  const [price, setPrice] = useState(String(variant.price));
  const [active, setActive] = useState(variant.active);

  function payload(nextActive: boolean): AdminMerchVariantUpsertInput {
    return {
      id: variant.id,
      size: variant.size,
      color: variant.color,
      sku: variant.sku,
      stock: Number(stock),
      price: Number(price),
      active: nextActive,
    };
  }

  return (
    <li className="flex flex-wrap items-end justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm">
      <span>
        {variant.size} · {variant.color} · {variant.sku}
        {variant.active ? "" : ` · ${labels.variantArchived}`}
      </span>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <Label htmlFor={`var-${variant.id}-stock`}>{labels.variantStock}</Label>
          <Input
            id={`var-${variant.id}-stock`}
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-1 w-24"
            title={labels.tipVariantStock}
          />
        </div>
        <div>
          <Label htmlFor={`var-${variant.id}-price`}>{labels.variantPrice}</Label>
          <Input
            id={`var-${variant.id}-price`}
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 w-24"
            title={labels.tipVariantPrice}
          />
        </div>
        <label
          className="inline-flex min-h-[36px] items-center gap-2 text-sm"
          htmlFor={`var-${variant.id}-active`}
          title={labels.tipVariantActive}
        >
          <input
            id={`var-${variant.id}-active`}
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={busy}
          />
          {labels.variantActive}
        </label>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          className="min-h-[36px]"
          title={labels.tipVariantSave}
          onClick={() => void onUpsert(payload(active))}
        >
          <Save className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {labels.variantSave}
        </Button>
        {canRestore ? (
          <button
            type="button"
            className="inline-flex min-h-[36px] items-center gap-1.5 text-sm text-[var(--color-primary)] underline"
            disabled={busy}
            title={labels.tipVariantRestore}
            onClick={() => void onUpsert(payload(true))}
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {labels.variantRestore}
          </button>
        ) : null}
        <button
          type="button"
          className="inline-flex min-h-[36px] items-center gap-1.5 text-sm text-[var(--color-error)] underline"
          disabled={busy}
          title={labels.tipVariantRemove}
          onClick={() => onRemove(variant.id)}
        >
          <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {labels.variantRemove}
        </button>
      </div>
    </li>
  );
}
