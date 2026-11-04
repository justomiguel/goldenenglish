import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import {
  ADMIN_SESSION_FORBIDDEN,
  ADMIN_SESSION_UNAUTHORIZED,
} from "@/lib/dashboard/adminSessionErrors";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadSiteThemeForEditor } from "@/lib/cms/loadSiteThemeForEditor";
import { SiteThemeEditorShell } from "@/components/dashboard/admin/cms/SiteThemeEditorShell";
import { GenericSiteBasicsForm } from "@/components/organisms/pulsar/GenericSiteBasicsForm";
import { GenericSiteColors } from "@/components/organisms/pulsar/GenericSiteColors";
import { GenericSiteContactForm } from "@/components/organisms/pulsar/GenericSiteContactForm";
import { GenericSiteCopyForm } from "@/components/organisms/pulsar/GenericSiteCopyForm";
import { GenericSiteLogo } from "@/components/organisms/pulsar/GenericSiteLogo";
import { GenericSitePhotos } from "@/components/organisms/pulsar/GenericSitePhotos";
import { loadGenericSitePhotoSlots } from "@/lib/cms/loadSiteThemeForLandingEditor";
import { buildGenericSiteCopyFields } from "@/lib/landing/genericSiteCopyFields";
import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { resolveBrandAssetUrl } from "@/lib/brand/resolveBrandAssetUrl";
import { paletteFromThemeProperties } from "@/lib/theme/templatePalette";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function AdminCmsTemplateEditorPage({ params }: PageProps) {
  const { locale, id } = await params;

  let supabase: Awaited<ReturnType<typeof assertAdmin>>["supabase"];
  try {
    ({ supabase } = await assertAdmin());
  } catch (err) {
    const message = (err as Error)?.message;
    if (message === ADMIN_SESSION_UNAUTHORIZED) {
      redirect(`/${locale}/login`);
    }
    if (message === ADMIN_SESSION_FORBIDDEN) {
      redirect(`/${locale}/dashboard`);
    }
    throw err;
  }

  const dict = await getDictionary(locale);
  const editorLabels = dict.admin.cms.templates.editor;

  const viewModel = await loadSiteThemeForEditor(supabase, id);
  if (!viewModel) {
    return (
      <section className="space-y-4">
        <Link
          href={`/${locale}/dashboard/admin/cms/templates`}
          className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)] hover:underline"
        >
          <ArrowLeft aria-hidden className="mr-1 h-4 w-4" />
          {editorLabels.backToTemplates}
        </Link>
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-8 text-center text-sm text-[var(--color-muted-foreground)]">
          {editorLabels.notFound}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <SiteThemeEditorShell
        locale={locale}
        labels={editorLabels}
        theme={viewModel.theme}
        groups={viewModel.groups}
      />
      {isGenericInstituteKind(viewModel.theme.templateKind) ? (
        <>
          <GenericSiteLogo
            locale={locale}
            themeId={viewModel.theme.id}
            logoUrl={resolveBrandAssetUrl(viewModel.theme.properties["app.logo.path"] ?? "", "")}
            fileUploadProgress={dict.common.fileUpload}
            labels={{
              title: dict.pulsar.account.logoTitle,
              lead: dict.pulsar.account.logoLead,
              save: dict.pulsar.account.logoSave,
              saved: dict.pulsar.account.saved,
              failed: dict.pulsar.account.logoFailed,
            }}
          />
          <GenericSiteContactForm
            locale={locale}
            themeId={viewModel.theme.id}
            properties={viewModel.theme.properties}
            labels={{
              title: dict.pulsar.account.contactTitle,
              lead: dict.pulsar.account.contactLead,
              email: dict.pulsar.account.contactEmail,
              phone: dict.pulsar.account.sharePhone,
              whatsapp: dict.pulsar.account.shareWhatsapp,
              address: dict.pulsar.account.shareAddress,
              instagram: dict.pulsar.account.shareInstagram,
              save: dict.pulsar.account.contactSave,
              saved: dict.pulsar.account.saved,
              invalid: dict.pulsar.account.contactInvalid,
            }}
          />
          <GenericSiteColors
            locale={locale}
            themeId={viewModel.theme.id}
            kind={viewModel.theme.templateKind}
            palette={paletteFromThemeProperties(viewModel.theme.templateKind, viewModel.theme.properties)}
            labels={dict.pulsar.account}
          />
          <GenericSitePhotos
            locale={locale}
            themeId={viewModel.theme.id}
            photos={await loadGenericSitePhotoSlots(supabase, viewModel.theme.id)}
            dict={dict}
            fileUploadProgress={dict.common.fileUpload}
          />
          <GenericSiteCopyForm
            locale={locale}
            themeId={viewModel.theme.id}
            labels={dict.pulsar.account.siteCopy}
            fields={buildGenericSiteCopyFields({
              kind: viewModel.theme.templateKind,
              dict,
              content: viewModel.theme.content,
              locale: locale === "en" || locale === "pt" ? locale : "es",
              labels: dict.pulsar.account.siteCopy,
            })}
          />
          <GenericSiteBasicsForm
            locale={locale}
            themeId={viewModel.theme.id}
            properties={viewModel.theme.properties}
            labels={{
              title: dict.pulsar.account.basicsTitle,
              lead: dict.pulsar.account.basicsLead,
              seoTitle: dict.pulsar.account.seoTitle,
              seoDescription: dict.pulsar.account.seoDescription,
              faviconMode: dict.pulsar.account.faviconMode,
              faviconImage: dict.pulsar.account.faviconImage,
              faviconLetter: dict.pulsar.account.faviconLetter,
              save: dict.pulsar.account.saveBasics,
              saved: dict.pulsar.account.saved,
            }}
          />
        </>
      ) : null}
    </div>
  );
}
