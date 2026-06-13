import Link from "next/link";
import { WifiOff } from "lucide-react";
import { getBrandForRequest } from "@/lib/brand/server";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";

export default async function OfflinePage() {
  const brand = await getBrandForRequest();
  const dict = await getDictionary(defaultLocale);
  const copy = dict.pwa.offline;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--color-muted)] px-6 py-12 text-center">
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
          {copy.retry.replace("{brand}", brand.name)}
        </Link>
      </div>
    </main>
  );
}
