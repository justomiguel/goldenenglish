import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { loadMerchEnabled } from "@/lib/shop/loadMerchEnabled";

export default async function StudentShopLayout({ children }: { children: ReactNode }) {
  if (!(await loadMerchEnabled())) notFound();
  return children;
}
