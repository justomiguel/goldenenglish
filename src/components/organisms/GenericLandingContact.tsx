import { AtSign, Mail, MapPin, MessageCircle, Phone, Share2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { emailHref, facebookUrl, instagramUrl, phoneHref, whatsappUrl } from "@/lib/pulsar/freeSiteShare";

export interface GenericLandingContactValue {
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
  instagram?: string;
  facebook?: string;
}

export interface GenericLandingContactLabels {
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
  instagram?: string;
  facebook?: string;
  mapTitle?: string;
  formName?: string;
  formEmail?: string;
  formPhone?: string;
  formMessage?: string;
  formSuccess?: string;
  formPreview?: string;
  formQuota?: string;
  formInvalid?: string;
  formPersist?: string;
  formUnavailable?: string;
  mailSubject?: string;
}

function row(
  key: string,
  href: string | null,
  text: string,
  label: string,
  icon: LucideIcon,
): { key: string; href: string; text: string; label: string; icon: LucideIcon } | null {
  if (!href || !text.trim()) return null;
  return { key, href, text, label, icon };
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
    row("email", emailHref(contact.email), contact.email, labels.email, Mail),
    row("phone", phoneHref(contact.phone), contact.phone, labels.phone, Phone),
    row("whatsapp", whatsappUrl(contact.whatsapp), labels.whatsapp, labels.whatsapp, MessageCircle),
    row("instagram", instagramUrl(contact.instagram ?? ""), labels.instagram ?? "", labels.instagram ?? "", AtSign),
    row("facebook", facebookUrl(contact.facebook ?? ""), labels.facebook ?? "", labels.facebook ?? "", Share2),
    contact.address.trim()
      ? { key: "address", href: "", text: contact.address, label: labels.address, icon: MapPin }
      : null,
  ].filter((item) => item !== null);
  if (rows.length === 0) return null;

  return (
    <ul className="mt-10 space-y-2">
      {rows.map((item) => {
        const Icon = item.icon;
        const body = (
          <>
            <Icon className="h-4 w-4" aria-hidden />
            <span>{item.text}</span>
          </>
        );
        return (
          <li key={item.key}>
            {item.href ? (
              <a
                href={item.href}
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
