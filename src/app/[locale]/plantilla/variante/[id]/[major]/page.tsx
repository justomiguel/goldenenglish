import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { variantFixture } from "@/lib/design-variants/variantFixtures";
import { getVariant } from "@/lib/design-variants/variantRegistry";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import { cssRootBlock } from "@/lib/theme/themeOverrides";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

function previewOpen(): boolean {
  const target = process.env.GE_DEV_TARGET;
  return target === "e2e" || target === "local";
}

export default async function PlantillaVariantePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; major: string }>;
  searchParams: Promise<{ fixture?: string }>;
}) {
  if (!previewOpen()) notFound();
  const { id, major } = await params;
  const majorNumber = Number(major);
  if (!Number.isInteger(majorNumber)) notFound();
  const variant = getVariant(id, majorNumber);
  if (!variant) notFound();
  const query = await searchParams;
  const index = query.fixture === undefined ? 0 : Number(query.fixture);
  const props = variantFixture(variant.id, index);
  if (!props || !variant.propsSchema.safeParse(props).success) notFound();
  const loaded = await variant.web();
  const View = loaded.default as ComponentType<Record<string, unknown>>;
  return (
    <main className="mx-auto w-[1280px] max-w-full">
      <style>{cssRootBlock({ ...SYSTEM_PROPERTIES_DEFAULTS })}</style>
      <View {...(props as Record<string, unknown>)} />
    </main>
  );
}
