import type { Dictionary } from "@/types/i18n";

export type AdminMerchLabels = Dictionary["admin"]["merch"];

export type AdminMerchVariantRow = {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  price: number;
  active: boolean;
};

export type AdminMerchProductRow = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imagePath: string | null;
  active: boolean;
  sortOrder: number;
  variants: AdminMerchVariantRow[];
};

export function merchActionMessage(code: string, labels: AdminMerchLabels): string {
  if (code === "forbidden") return labels.errorForbidden;
  if (code === "invalid_input") return labels.errorInvalid;
  if (code === "invalid_stock") return labels.errorInvalidStock;
  if (code === "invalid_price") return labels.errorInvalidPrice;
  if (code === "duplicate_variant") return labels.errorDuplicateVariant;
  if (code === "archive_only") return labels.errorArchiveOnly;
  if (code === "no_variants") return labels.errorNoVariants;
  if (code === "save_failed") return labels.errorSave;
  return labels.genericActionError;
}
