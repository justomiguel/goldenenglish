"use client";

import { Building2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";

type L = Dictionary["dashboard"]["siteSetup"]["institute"];

interface SiteSetupInstituteStepProps {
  labels: L;
  appName: string;
  setAppName: (v: string) => void;
  legalName: string;
  setLegalName: (v: string) => void;
  tagline: string;
  setTagline: (v: string) => void;
  taglineEn: string;
  setTaglineEn: (v: string) => void;
  logoAlt: string;
  setLogoAlt: (v: string) => void;
  setLogoFile: (f: File | null) => void;
  setFaviconFile: (f: File | null) => void;
  initialLogoUrl?: string;
  initialFaviconUrl?: string;
  hasExistingLogo?: boolean;
  hasExistingFavicon?: boolean;
}

export function SiteSetupInstituteStep({
  labels,
  appName,
  setAppName,
  legalName,
  setLegalName,
  tagline,
  setTagline,
  taglineEn,
  setTaglineEn,
  logoAlt,
  setLogoAlt,
  setLogoFile,
  setFaviconFile,
  initialLogoUrl = "",
  initialFaviconUrl = "",
  hasExistingLogo = false,
  hasExistingFavicon = false,
}: SiteSetupInstituteStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h2>
      </div>
      <div>
        <Label htmlFor="site-app-name">{labels.appName}</Label>
        <Input
          id="site-app-name"
          className="mt-1"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          autoComplete="organization"
        />
      </div>
      <div>
        <Label htmlFor="site-legal">{labels.legalName}</Label>
        <Input
          id="site-legal"
          className="mt-1"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="site-tag">{labels.tagline}</Label>
        <Input
          id="site-tag"
          className="mt-1"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="site-tag-en">{labels.taglineEn}</Label>
        <Input
          id="site-tag-en"
          className="mt-1"
          value={taglineEn}
          onChange={(e) => setTaglineEn(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="site-logo-alt">{labels.logoAlt}</Label>
        <Input
          id="site-logo-alt"
          className="mt-1"
          value={logoAlt}
          onChange={(e) => setLogoAlt(e.target.value)}
          placeholder={appName}
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {labels.logoAltHint}
        </p>
      </div>
      <div>
        <Label htmlFor="site-logo">{labels.logo}</Label>
        {hasExistingLogo && initialLogoUrl ? (
          <div className="mt-1 flex items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={initialLogoUrl}
              alt={labels.currentLogoPreviewAlt ?? ""}
              className="h-12 w-12 rounded object-contain"
            />
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {labels.currentLogoHint}
            </p>
          </div>
        ) : null}
        <input
          id="site-logo"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="mt-1 block w-full text-sm text-[var(--color-muted-foreground)] file:mr-3 file:rounded-[var(--layout-border-radius)] file:border file:border-[var(--color-border)] file:bg-[var(--color-background)] file:px-3 file:py-2 file:text-sm file:text-[var(--color-foreground)]"
          onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {labels.logoHint}
        </p>
      </div>
      <div>
        <Label htmlFor="site-favicon">{labels.favicon}</Label>
        {hasExistingFavicon && initialFaviconUrl ? (
          <div className="mt-1 flex items-center gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={initialFaviconUrl}
              alt={labels.currentFaviconPreviewAlt ?? ""}
              className="h-8 w-8 rounded object-contain"
            />
            <p className="text-xs text-[var(--color-muted-foreground)]">
              {labels.currentFaviconHint}
            </p>
          </div>
        ) : null}
        <input
          id="site-favicon"
          type="file"
          accept="image/png,image/jpeg,image/webp,.ico,.zip,application/zip,application/x-zip-compressed"
          className="mt-1 block w-full text-sm text-[var(--color-muted-foreground)] file:mr-3 file:rounded-[var(--layout-border-radius)] file:border file:border-[var(--color-border)] file:bg-[var(--color-background)] file:px-3 file:py-2 file:text-sm file:text-[var(--color-foreground)]"
          onChange={(e) => setFaviconFile(e.target.files?.[0] ?? null)}
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {labels.faviconHint}
        </p>
      </div>
    </div>
  );
}
