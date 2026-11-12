import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewSurfaceProvider } from "@/hooks/useAppSurface";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { previewSigningKeyFromEnv, verifyPreviewTokenAtRequest } from "@/lib/theme-document/previewToken";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function PlantillaBorradorPage({
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string; surface?: string }>;
}) {
  const query = await searchParams;
  const token = query.token?.trim();
  if (!token) notFound();
  const key = await previewSigningKeyFromEnv();
  if (!key) notFound();
  const verified = await verifyPreviewTokenAtRequest(token, key);
  if (!verified.ok) notFound();
  const host = getAlsTenant();
  if (!host || host.slug !== verified.tenantSlug) notFound();
  const surface = query.surface === "pwa-mobile" ? "pwa-mobile" : null;
  return (
    <PreviewSurfaceProvider surface={surface}>
      <main data-draft-id={verified.draftId} />
    </PreviewSurfaceProvider>
  );
}
