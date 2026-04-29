"use client";

import { Mail } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";

type ContactL = Dictionary["dashboard"]["siteSetup"]["contact"];
type SocialL = Dictionary["dashboard"]["siteSetup"]["social"];

interface SiteSetupContactStepProps {
  contact: ContactL;
  social: SocialL;
  contactEmail: string;
  setContactEmail: (v: string) => void;
  contactPhone: string;
  setContactPhone: (v: string) => void;
  contactAddress: string;
  setContactAddress: (v: string) => void;
  socialFacebook: string;
  setSocialFacebook: (v: string) => void;
  socialInstagram: string;
  setSocialInstagram: (v: string) => void;
  socialWhatsapp: string;
  setSocialWhatsapp: (v: string) => void;
}

export function SiteSetupContactStep({
  contact,
  social,
  contactEmail,
  setContactEmail,
  contactPhone,
  setContactPhone,
  contactAddress,
  setContactAddress,
  socialFacebook,
  setSocialFacebook,
  socialInstagram,
  setSocialInstagram,
  socialWhatsapp,
  setSocialWhatsapp,
}: SiteSetupContactStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          {contact.title}
        </h2>
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        {contact.socialHint}
      </p>
      <div>
        <Label htmlFor="site-email">{contact.email}</Label>
        <Input
          id="site-email"
          type="email"
          className="mt-1"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="site-phone">{contact.phone}</Label>
        <Input
          id="site-phone"
          className="mt-1"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>
      <div>
        <Label htmlFor="site-address">{contact.address}</Label>
        <textarea
          id="site-address"
          className="mt-1 min-h-[84px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1"
          value={contactAddress}
          onChange={(e) => setContactAddress(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="soc-fb">{social.facebook}</Label>
        <Input
          id="soc-fb"
          className="mt-1"
          value={socialFacebook}
          onChange={(e) => setSocialFacebook(e.target.value)}
          placeholder="https://"
        />
      </div>
      <div>
        <Label htmlFor="soc-ig">{social.instagram}</Label>
        <Input
          id="soc-ig"
          className="mt-1"
          value={socialInstagram}
          onChange={(e) => setSocialInstagram(e.target.value)}
          placeholder="https://"
        />
      </div>
      <div>
        <Label htmlFor="soc-wa">{social.whatsapp}</Label>
        <Input
          id="soc-wa"
          className="mt-1"
          value={socialWhatsapp}
          onChange={(e) => setSocialWhatsapp(e.target.value)}
          placeholder="https://"
        />
      </div>
    </div>
  );
}
