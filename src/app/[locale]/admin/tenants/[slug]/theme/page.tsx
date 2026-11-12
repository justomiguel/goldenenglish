import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Images } from "lucide-react";
import { SiteThemeEditorShell } from "@/components/dashboard/admin/cms/SiteThemeEditorShell";
import { ThemeDocumentActiveNoticeGate } from "@/components/dashboard/admin/cms/ThemeDocumentActiveNoticeGate";
import { PulsarAdminChrome } from "@/components/organisms/pulsar/PulsarAdminChrome";
import { GenericSiteBasicsForm } from "@/components/organisms/pulsar/GenericSiteBasicsForm";
import { GenericSiteColors } from "@/components/organisms/pulsar/GenericSiteColors";
import { GenericSiteContactForm } from "@/components/organisms/pulsar/GenericSiteContactForm";
import { GenericSiteCopyForm } from "@/components/organisms/pulsar/GenericSiteCopyForm";
import { GenericSiteLogo } from "@/components/organisms/pulsar/GenericSiteLogo";
import { GenericSitePhotos } from "@/components/organisms/pulsar/GenericSitePhotos";
import { loadGenericSitePhotoSlots } from "@/lib/cms/loadSiteThemeForLandingEditor";
import { buildGenericSiteCopyFields } from "@/lib/landing/genericSiteCopyFields";
import { PulsarAdminCloseTenant } from "@/components/organisms/pulsar/PulsarAdminCloseTenant";
import { loadSiteThemeForEditor } from "@/lib/cms/loadSiteThemeForEditor";
import { loadPulsarThemeEditor } from "@/lib/pulsar/loadPulsarThemeEditor";
import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { resolveBrandAssetUrl } from "@/lib/brand/resolveBrandAssetUrl";
import { paletteFromThemeProperties } from "@/lib/theme/templatePalette";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function PulsarTenantThemePage({ params }: PageProps) {
  const { locale, slug } = await params;
  const loaded = await loadPulsarThemeEditor(locale, slug);
  if (loaded.status === "login") {
    redirect(`/${locale}/cuenta/login?next=/${locale}/admin/tenants/${slug}/theme`);
  }
  if (loaded.status === "password") redirect(`/${locale}/admin/password`);
  if (loaded.status !== "ready") notFound();

  const copy = loaded.dict.pulsar.admin.form;
  const account = loaded.dict.pulsar.account;
  const backHref = loaded.actor === "owner" ? `/${locale}/cuenta` : `/${locale}/admin/tenants/${slug}`;
  const shell = (node: React.ReactNode) => (
    <PulsarAdminChrome locale={locale} dict={loaded.dict} email={loaded.email}>
      {node}
    </PulsarAdminChrome>
  );

  if (!loaded.themeId) {
    return shell(
      <section className="space-y-4">
        <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {copy.themeBack}
        </Link>
        <p className="text-sm text-[var(--color-muted-foreground)]">{copy.themeMissing}</p>
      </section>,
    );
  }

  const viewModel = await loadSiteThemeForEditor(loaded.supabase, loaded.themeId);
  if (!viewModel) notFound();

  return shell(
    <div className="space-y-6">
      <ThemeDocumentActiveNoticeGate
        client={loaded.supabase}
        siteThemeId={loaded.themeId}
        href={`/${locale}/admin/tenants/${slug}/theme/design`}
        body={loaded.dict.admin.cms.themeDocumentActive}
        linkLabel={loaded.dict.admin.cms.themeDocumentActiveLink}
      />
      <Link
        href={`/${locale}/admin/tenants/${slug}/theme/landing`}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
      >
        <Images className="h-4 w-4" aria-hidden />
        {copy.themePhotosCta}
      </Link>
      <SiteThemeEditorShell
        locale={locale}
        labels={loaded.dict.admin.cms.templates.editor}
        theme={viewModel.theme}
        groups={viewModel.groups}
        backHref={backHref}
      />
      {isGenericInstituteKind(viewModel.theme.templateKind) ? (
        <>
          <GenericSiteLogo
            locale={locale}
            themeId={viewModel.theme.id}
            logoUrl={resolveBrandAssetUrl(viewModel.theme.properties["app.logo.path"] ?? "", "")}
            fileUploadProgress={loaded.dict.common.fileUpload}
            labels={{
              title: account.logoTitle,
              lead: account.logoLead,
              save: account.logoSave,
              saved: account.saved,
              failed: account.logoFailed,
            }}
          />
          <GenericSiteContactForm
            locale={locale}
            themeId={viewModel.theme.id}
            properties={viewModel.theme.properties}
            labels={{
              title: account.contactTitle,
              lead: account.contactLead,
              email: account.contactEmail,
              phone: account.sharePhone,
              whatsapp: account.shareWhatsapp,
              address: account.shareAddress,
              instagram: account.shareInstagram,
              save: account.contactSave,
              saved: account.saved,
              invalid: account.contactInvalid,
            }}
          />
          <GenericSiteColors
            locale={locale}
            themeId={viewModel.theme.id}
            kind={viewModel.theme.templateKind}
            palette={paletteFromThemeProperties(viewModel.theme.templateKind, viewModel.theme.properties)}
            labels={account}
          />
          <GenericSitePhotos
            locale={locale}
            themeId={viewModel.theme.id}
            photos={await loadGenericSitePhotoSlots(loaded.supabase, viewModel.theme.id)}
            dict={loaded.dict}
            fileUploadProgress={loaded.dict.common.fileUpload}
          />
          <GenericSiteCopyForm
            locale={locale}
            themeId={viewModel.theme.id}
            labels={account.siteCopy}
            fields={buildGenericSiteCopyFields({
              kind: viewModel.theme.templateKind,
              dict: loaded.dict,
              content: viewModel.theme.content,
              locale: locale === "en" || locale === "pt" ? locale : "es",
              labels: account.siteCopy,
            })}
          />
          <GenericSiteBasicsForm
            locale={locale}
            themeId={viewModel.theme.id}
            properties={viewModel.theme.properties}
            labels={{
              title: account.basicsTitle,
              lead: account.basicsLead,
              seoTitle: account.seoTitle,
              seoDescription: account.seoDescription,
              faviconMode: account.faviconMode,
              faviconImage: account.faviconImage,
              faviconLetter: account.faviconLetter,
              save: account.saveBasics,
              saved: account.saved,
            }}
          />
        </>
      ) : null}
      {loaded.actor === "owner" ? (
        <PulsarAdminCloseTenant
          locale={locale}
          slug={slug}
          copy={copy}
          redirectTo={`/${locale}/cuenta`}
        />
      ) : null}
    </div>,
  );
}
