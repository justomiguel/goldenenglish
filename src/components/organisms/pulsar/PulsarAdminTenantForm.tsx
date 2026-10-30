"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DEFAULT_GENERIC_THEME_SLUG } from "@/lib/theme/genericInstituteTemplates";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  PlugZap,
  Save,
} from "lucide-react";
import {
  savePulsarTenantAction,
  testPulsarTenantConnectionAction,
} from "@/app/[locale]/admin/actions";
import {
  PulsarAdminTenantFieldGroups,
  type PulsarTenantFormValues,
} from "@/components/organisms/pulsar/PulsarAdminTenantFieldGroups";
import { PulsarAdminTenantDataMode } from "@/components/organisms/pulsar/PulsarAdminTenantDataMode";
import { PulsarAdminCloseTenant } from "@/components/organisms/pulsar/PulsarAdminCloseTenant";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import type { Dictionary } from "@/types/i18n";

export interface PulsarAdminTenantFormProps {
  locale: string;
  dict: Dictionary;
  initialTenant?: PulsarTenantRecord | null;
  masthead?: React.ReactNode;
}

function toInitialValues(tenant?: PulsarTenantRecord | null): PulsarTenantFormValues {
  return {
    slug: tenant?.slug ?? "",
    displayName: tenant?.displayName ?? "",
    isEnabled: tenant ? tenant.isEnabled : true,
    hosts: tenant?.hosts.join(", ") ?? "",
    publicUrl: tenant?.publicUrl ?? "",
    brandThemeSlug: tenant ? (tenant.brandThemeSlug ?? "") : DEFAULT_GENERIC_THEME_SLUG,
    skipInitialSiteSetup: tenant?.skipInitialSiteSetup ?? false,
    debugLogin: tenant?.debugLogin ?? false,
    supabaseUrl: tenant?.supabaseUrl ?? "",
    supabaseAnonKey: tenant?.supabaseAnonKey ?? "",
    supabaseServiceRoleKey: tenant?.supabaseServiceRoleKey ?? "",
    databaseUrl: tenant?.databaseUrl ?? "",
    mailTenant: tenant?.mailTenant ?? "",
    resendFromEmail: tenant?.resendFromEmail ?? "",
    resendApiKey: tenant?.resendApiKey ?? "",
    paymentGatewaySecretEncryptionKey: tenant?.paymentGatewaySecretEncryptionKey ?? "",
    kvRestApiUrl: tenant?.kvRestApiUrl ?? "",
    kvRestApiToken: tenant?.kvRestApiToken ?? "",
    googleMapsApiKey: tenant?.googleMapsApiKey ?? "",
    googleMapsMapId: tenant?.googleMapsMapId ?? "",
    vapidPublicKey: tenant?.vapidPublicKey ?? "",
    vapidPrivateKey: tenant?.vapidPrivateKey ?? "",
    vapidContactEmail: tenant?.vapidContactEmail ?? "",
    whatsappAccessToken: tenant?.whatsappAccessToken ?? "",
    whatsappPhoneNumberId: tenant?.whatsappPhoneNumberId ?? "",
    whatsappClassReminderTemplateName: tenant?.whatsappClassReminderTemplateName ?? "",
    dataMode: tenant?.dataMode === "shared_schema" ? "shared_schema" : "project",
  };
}

export function PulsarAdminTenantForm({
  locale,
  dict,
  initialTenant = null,
  masthead = null,
}: PulsarAdminTenantFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialTenant);
  const copy = dict.pulsar.admin;
  const formCopy = copy.form;
  const [values, setValues] = useState<PulsarTenantFormValues>(() =>
    toInitialValues(initialTenant),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);
  const [probeBanner, setProbeBanner] = useState<{
    ok: boolean;
    latencyMs: number;
    errorCode: string | null;
  } | null>(null);

  const handleFieldChange = <K extends keyof PulsarTenantFormValues>(
    key: K,
    value: PulsarTenantFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSavedNotice(false);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setProbeBanner(null);
    const res = await testPulsarTenantConnectionAction({
      supabaseUrl: values.supabaseUrl,
      supabaseServiceRoleKey: values.supabaseServiceRoleKey,
    });
    setProbeBanner(res);
    setIsTesting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorCode(null);
    setSavedNotice(false);

    const res = await savePulsarTenantAction({
      locale,
      editingSlug: initialTenant?.slug,
      payload: { ...values },
    });
    setIsSaving(false);

    if (!res.ok) {
      setErrorCode(res.errorCode);
      return;
    }

    setSavedNotice(true);
    router.refresh();
    if (!isEditing) {
      router.push(`/${locale}/admin/tenants/${res.slug}`);
    }
  };

  const errorText = errorCode
    ? (formCopy.errors as Record<string, string>)[errorCode] ?? formCopy.errors.db_write_failed
    : null;

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <div className={`mx-auto px-4 py-8 sm:px-6 ${masthead ? "max-w-6xl" : "max-w-4xl"}`}>
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/${locale}/admin`}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            <span>{copy.backToFleet}</span>
          </Link>

          {values.dataMode === "project" ? (
          <button
            type="button"
            disabled={isTesting}
            onClick={handleTestConnection}
            className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] disabled:opacity-50"
          >
            <PlugZap className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <span>
              {isTesting ? formCopy.testingConnection : formCopy.testConnectionCta}
            </span>
          </button>
          ) : null}
        </div>

        {masthead ? (
          <div className="mt-8">{masthead}</div>
        ) : (
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-[var(--color-foreground)]">
            {isEditing ? `${formCopy.editTitle}: ${initialTenant?.slug}` : formCopy.createTitle}
          </h1>
        )}
        <p className={`text-sm text-[var(--color-muted-foreground)] ${masthead ? "mt-10" : "mt-1"}`}>
          {formCopy.lead}
        </p>

        {probeBanner ? (
          <div
            role="status"
            className={`mt-4 flex items-center gap-2 rounded-lg border p-3 text-xs font-semibold ${
              probeBanner.ok
                ? "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)]"
                : "border-[var(--color-error)] bg-[var(--color-surface)] text-[var(--color-error)]"
            }`}
          >
            {probeBanner.ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>
              {probeBanner.ok
                ? `${formCopy.testOk} (${probeBanner.latencyMs} ms)`
                : `${formCopy.testFail} (${probeBanner.errorCode ?? "error"})`}
            </span>
          </div>
        ) : null}

        {errorText ? (
          <div
            role="alert"
            className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--color-error)] bg-[var(--color-surface)] p-3 text-xs font-semibold text-[var(--color-error)]"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span>{errorText}</span>
          </div>
        ) : null}

        {savedNotice ? (
          <div
            role="status"
            className="mt-4 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs font-semibold text-[var(--color-primary)]"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
            <span>{formCopy.savedNotice}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <PulsarAdminTenantDataMode
            dict={dict}
            value={values.dataMode}
            disabled={isEditing}
            onChange={(mode) => handleFieldChange("dataMode", mode)}
          />
          <PulsarAdminTenantFieldGroups
            dict={dict}
            values={values}
            isEditing={isEditing}
            onChange={handleFieldChange}
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)] disabled:opacity-60"
            >
              <Save className="h-4 w-4" aria-hidden />
              <span>{isSaving ? formCopy.saving : formCopy.saveCta}</span>
            </button>
          </div>
        </form>
        {isEditing && initialTenant ? (
          <PulsarAdminCloseTenant locale={locale} slug={initialTenant.slug} copy={formCopy} />
        ) : null}
      </div>
    </div>
  );
}
