"use client";

import type { Dictionary } from "@/types/i18n";

const fieldClass =
  "mt-1 min-h-11 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-base text-[var(--color-foreground)]";

function ShareField({ id, name, label }: { id: string; name: string; label: string }) {
  return (
    <label className="block text-sm font-semibold" htmlFor={id}>
      {label}
      <input id={id} name={name} className={fieldClass} />
    </label>
  );
}

export function PulsarAccountShareFields({ copy }: { copy: Dictionary["pulsar"]["account"] }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{copy.shareHint}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <ShareField id="site-phone" name="phone" label={copy.sharePhone} />
        <ShareField id="site-whatsapp" name="whatsapp" label={copy.shareWhatsapp} />
        <ShareField id="site-instagram" name="instagram" label={copy.shareInstagram} />
        <ShareField id="site-facebook" name="facebook" label={copy.shareFacebook} />
        <label className="block text-sm font-semibold sm:col-span-2" htmlFor="site-address">
          {copy.shareAddress}
          <input id="site-address" name="address" className={fieldClass} />
        </label>
      </div>
    </fieldset>
  );
}
