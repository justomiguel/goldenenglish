"use server";

export {
  createShopProduct,
  updateShopProduct,
  toggleShopProductActive,
} from "@/app/[locale]/dashboard/admin/merch/productActions";
export {
  upsertShopVariant,
  deleteShopVariant,
  archiveShopVariant,
} from "@/app/[locale]/dashboard/admin/merch/variantActions";
