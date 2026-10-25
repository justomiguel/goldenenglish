import Link from "next/link";
import { WifiOff } from "lucide-react";
import { getBrandForRequest } from "@/lib/brand/server";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";
import { PublicTenantChrome } from "@/components/organisms/PublicTenantChrome";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";
import { isMultiTenantEnabled } from "@/lib/tenant/tenantRegistry";
import { resolveRequestTenant } from "@/lib/tenant/tenantRequestContext";

export const dynamic = "force-dynamic";

export default async function OfflinePage() {
  const [dict, snapshot] = await Promise.all([
    getDictionary(defaultLocale),
    loadActiveTheme(),
  ]);
  const copy = dict.pwa.offline;
  const templateKind = snapshot?.theme.templateKind ?? "classic";
  const tenant = isMultiTenantEnabled() ? await resolveRequestTenant() : null;
  const brand = !isMultiTenantEnabled() || tenant ? await getBrandForRequest() : null;
  const retryLabel = brand?.name
    ? copy.retry.replace("{brand}", brand.name)
    : copy.retryGeneric;

  return (
    <PublicTenantChrome templateKind={templateKind}>
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-muted)] pb-[max(3rem,env(safe-area-inset-bottom,0px))] pe-[max(1.5rem,env(safe-area-inset-right,0px))] ps-[max(1.5rem,env(safe-area-inset-left,0px))] pt-[max(3rem,env(safe-area-inset-top,0px))] text-center">
      <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <WifiOff className="h-10 w-10 text-[var(--color-primary)]" aria-hidden />
        <h1 className="font-display text-xl font-bold text-[var(--color-foreground)]">
          {copy.title}
        </h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">{copy.body}</p>
        <Link
          href={`/${defaultLocale}`}
          className="mt-2 inline-flex min-h-[44px] items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-[var(--color-primary-foreground)]"
        >
          {retryLabel}
        </Link>
      </div>
      </main>
    </PublicTenantChrome>
  );
}
