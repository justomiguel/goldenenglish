import { notFound } from "next/navigation";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export const metadata = { robots: { index: false, follow: false } };

export default async function PulsarAccountLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPulsarPlatformRequest())) notFound();
  return children;
}
