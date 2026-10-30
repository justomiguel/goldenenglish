import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Images } from "lucide-react";
import { SiteThemeEditorShell } from "@/components/dashboard/admin/cms/SiteThemeEditorShell";
import { PulsarAdminChrome } from "@/components/organisms/pulsar/PulsarAdminChrome";
import { GenericSiteBasicsForm } from "@/components/organisms/pulsar/GenericSiteBasicsForm";
import { PulsarAdminCloseTenant } from "@/components/organisms/pulsar/PulsarAdminCloseTenant";
import { loadSiteThemeForEditor } from "@/lib/cms/loadSiteThemeForEditor";
import { loadPulsarThemeEditor } from "@/lib/pulsar/loadPulsarThemeEditor";
import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";

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
        <GenericSiteBasicsForm
          locale={locale}
          themeId={viewModel.theme.id}
          properties={viewModel.theme.properties}
          sectionLabels={loaded.dict.landing.genericSectionLabels}
          labels={{
            title: account.basicsTitle,
            lead: account.basicsLead,
            seoTitle: account.seoTitle,
            seoDescription: account.seoDescription,
            hideSections: account.hideSections,
            faviconMode: account.faviconMode,
            faviconImage: account.faviconImage,
            faviconLetter: account.faviconLetter,
            save: account.saveBasics,
            saved: account.saved,
          }}
        />
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
