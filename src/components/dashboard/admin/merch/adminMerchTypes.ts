import { revealFailureCode } from "@/lib/errors/revealFailureCode";
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

export type AdminMerchVariantUpsertInput = {
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  price: number;
  active?: boolean;
};

export function canRestoreMerchVariant(
  row: Pick<AdminMerchVariantRow, "id" | "size" | "color" | "active">,
  variants: Pick<AdminMerchVariantRow, "id" | "size" | "color">[],
): boolean {
  if (row.active) return false;
  return !variants.some(
    (other) =>
      other.id !== row.id &&
      other.size.trim() === row.size.trim() &&
      other.color.trim() === row.color.trim(),
  );
}

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
  const mapped =
    code === "forbidden"
      ? labels.errorForbidden
      : code === "invalid_input"
        ? labels.errorInvalid
        : code === "invalid_stock"
          ? labels.errorInvalidStock
          : code === "invalid_price"
            ? labels.errorInvalidPrice
            : code === "duplicate_variant"
              ? labels.errorDuplicateVariant
              : code === "archive_only"
                ? labels.errorArchiveOnly
                : code === "no_variants"
                  ? labels.errorNoVariants
                  : code === "save_failed"
                    ? labels.errorSave
                    : labels.genericActionError;
  return revealFailureCode(mapped, code);
}
