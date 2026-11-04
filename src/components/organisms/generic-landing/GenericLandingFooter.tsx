import type { GenericLandingContactValue } from "@/components/organisms/GenericLandingContact";

export interface GenericLandingFooterProps {
  siteName: string;
  contact?: GenericLandingContactValue;
}

function line(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function GenericLandingFooter({ siteName, contact }: GenericLandingFooterProps) {
  const email = line(contact?.email);
  const phone = line(contact?.phone);
  const address = line(contact?.address);

  return (
    <footer className="border-t border-[var(--color-border)] px-[max(1.25rem,env(safe-area-inset-left,0px))] py-10 pe-[max(1.25rem,env(safe-area-inset-right,0px))] pb-[max(2.5rem,env(safe-area-inset-bottom,0px))]">
      <div className="mx-auto flex max-w-3xl flex-col gap-2 text-sm text-[var(--color-muted-foreground)]">
        <p className="text-base font-semibold text-[var(--color-foreground)]">{siteName}</p>
        {address ? <p>{address}</p> : null}
        {phone ? <a href={`tel:${phone}`}>{phone}</a> : null}
        {email ? <a href={`mailto:${email}`}>{email}</a> : null}
      </div>
    </footer>
  );
}
