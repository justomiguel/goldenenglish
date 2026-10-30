import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";

export interface GenericLandingContactValue {
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
}

export interface GenericLandingContactLabels {
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
}

function whatsappHref(value: string): string {
  if (value.startsWith("https://") || value.startsWith("http://")) return value;
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : value;
}

export function GenericLandingContact({
  contact,
  labels,
}: {
  contact?: GenericLandingContactValue;
  labels?: GenericLandingContactLabels;
}) {
  if (!contact || !labels) return null;
  const rows = [
    contact.email
      ? { href: `mailto:${contact.email}`, text: contact.email, label: labels.email, icon: Mail }
      : null,
    contact.phone
      ? { href: `tel:${contact.phone.replace(/\s/g, "")}`, text: contact.phone, label: labels.phone, icon: Phone }
      : null,
    contact.whatsapp
      ? {
          href: whatsappHref(contact.whatsapp),
          text: labels.whatsapp,
          label: labels.whatsapp,
          icon: MessageCircle,
        }
      : null,
    contact.address
      ? { href: "", text: contact.address, label: labels.address, icon: MapPin }
      : null,
  ].filter((row) => row !== null);
  if (rows.length === 0) return null;

  return (
    <ul className="mt-10 space-y-2">
      {rows.map((row) => {
        const Icon = row.icon;
        const body = (
          <>
            <Icon className="h-4 w-4" aria-hidden />
            <span>{row.text}</span>
          </>
        );
        return (
          <li key={row.label}>
            {row.href ? (
              <a
                href={row.href}
                className="inline-flex min-h-11 items-center gap-2 text-base text-[var(--color-foreground)]"
              >
                {body}
              </a>
            ) : (
              <p className="inline-flex min-h-11 items-center gap-2 text-base text-[var(--color-foreground)]">
                {body}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
