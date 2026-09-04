"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { AdminMerchPhotoField } from "@/components/dashboard/admin/merch/AdminMerchPhotoField";
import type {
  AdminMerchLabels,
  AdminMerchProductRow,
} from "@/components/dashboard/admin/merch/adminMerchTypes";

interface AdminMerchProductFormProps {
  labels: AdminMerchLabels;
  product?: AdminMerchProductRow;
  busy: boolean;
  onCreate?: (input: { title: string; description: string; sortOrder: number }) => Promise<boolean>;
  onUpdate?: (input: {
    title: string;
    description: string;
    sortOrder: number;
    imagePath?: string | null;
  }) => Promise<boolean>;
}

export function AdminMerchProductForm({
  labels,
  product,
  busy,
  onCreate,
  onUpdate,
}: AdminMerchProductFormProps) {
  const isEdit = Boolean(product && onUpdate);
  const idPrefix = isEdit ? "edit" : "create";
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [sortOrder, setSortOrder] = useState(String(product?.sortOrder ?? 0));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title: title.trim(),
      description: description.trim(),
      sortOrder: Number(sortOrder) || 0,
    };
    const ok =
      isEdit && onUpdate ? await onUpdate(payload) : onCreate ? await onCreate(payload) : false;
    if (ok && !isEdit) {
      setTitle("");
      setDescription("");
      setSortOrder("0");
    }
  }

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 shadow-[var(--shadow-soft)] md:p-6">
      <h2 className="font-semibold text-[var(--color-primary)]">
        {isEdit ? product?.title : labels.createTitle}
      </h2>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-merch-title`}>{labels.createTitleLabel}</Label>
          <Input
            id={`${idPrefix}-merch-title`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1"
            title={labels.tipCreateTitle}
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-merch-desc`}>{labels.createDescription}</Label>
          <Input
            id={`${idPrefix}-merch-desc`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1"
            title={labels.tipCreateDescription}
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-merch-sort`}>{labels.createSortOrder}</Label>
          <Input
            id={`${idPrefix}-merch-sort`}
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="mt-1"
            title={labels.tipCreateSortOrder}
          />
        </div>
        {product && onUpdate ? (
          <div className="sm:col-span-2">
            <AdminMerchPhotoField
              productId={product.id}
              imageUrl={product.imageUrl}
              labels={labels}
              disabled={busy}
              onUploaded={(imagePath) =>
                onUpdate({
                  title: title.trim(),
                  description: description.trim(),
                  sortOrder: Number(sortOrder) || 0,
                  imagePath,
                })
              }
            />
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Button
            type="submit"
            disabled={busy}
            isLoading={busy}
            className="min-h-[44px]"
            title={isEdit ? labels.tipSaveProduct : labels.tipCreateSubmit}
          >
            {busy ? null : isEdit ? (
              <Save className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
            )}
            {isEdit ? labels.saveProduct : labels.createSubmit}
          </Button>
        </div>
      </form>
    </section>
  );
}
