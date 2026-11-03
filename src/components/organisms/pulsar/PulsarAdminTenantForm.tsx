"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PlugZap, Save } from "lucide-react";
import {
  savePulsarTenantAction,
  testPulsarTenantConnectionAction,
} from "@/app/[locale]/admin/actions";
import {
  PulsarAdminTenantFieldGroups,
  type PulsarTenantFormValues,
} from "@/components/organisms/pulsar/PulsarAdminTenantFieldGroups";
import { PulsarAdminTenantDataMode } from "@/components/organisms/pulsar/PulsarAdminTenantDataMode";
import { PulsarAdminTenantFormNotices } from "@/components/organisms/pulsar/PulsarAdminTenantFormNotices";
import { PulsarAdminCloseTenant } from "@/components/organisms/pulsar/PulsarAdminCloseTenant";
import { PulsarTenantProvisionDialog } from "@/components/organisms/pulsar/PulsarTenantProvisionDialog";
import { toPulsarTenantFormValues } from "@/components/organisms/pulsar/pulsarTenantFormDefaults";
import { usePulsarTenantProvisionJob } from "@/hooks/usePulsarTenantProvisionJob";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import type { Dictionary } from "@/types/i18n";

export interface PulsarAdminTenantFormProps {
  locale: string;
  dict: Dictionary;
  initialTenant?: PulsarTenantRecord | null;
  pulsarHosts?: readonly string[];
  masthead?: React.ReactNode;
}

export function PulsarAdminTenantForm({
  locale,
  dict,
  initialTenant = null,
  pulsarHosts = [],
  masthead = null,
}: PulsarAdminTenantFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialTenant);
  const copy = dict.pulsar.admin;
  const formCopy = copy.form;
  const provisionCopy = formCopy.provision;
  const provision = usePulsarTenantProvisionJob({
    schema: provisionCopy.primarySchema,
    migration: provisionCopy.primaryMigration,
    grants: provisionCopy.primaryGrants,
    theme: provisionCopy.primaryTheme,
    domain: provisionCopy.primaryDomain,
    domainSkipped: provisionCopy.primaryDomainSkipped,
    done: provisionCopy.primaryDone,
    failed: provisionCopy.primaryFailed,
    count: provisionCopy.count,
  });
  const [values, setValues] = useState<PulsarTenantFormValues>(() =>
    toPulsarTenantFormValues(initialTenant, pulsarHosts),
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

    const save = () =>
      savePulsarTenantAction({
        locale,
        editingSlug: initialTenant?.slug,
        payload: { ...values },
      });
    const res =
      values.dataMode === "shared_schema" ? await provision.track(values.slug, save) : await save();
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

        <PulsarAdminTenantFormNotices
          probeBanner={probeBanner}
          errorText={errorText}
          savedNotice={savedNotice}
          testOk={formCopy.testOk}
          testFail={formCopy.testFail}
          savedLabel={formCopy.savedNotice}
        />

        <PulsarTenantProvisionDialog
          open={provision.open}
          isRunning={provision.isRunning}
          primaryLine={provision.primaryLine}
          secondaryLine={provision.secondaryLine}
          lines={provision.lines}
          title={provisionCopy.title}
          intro={provisionCopy.intro}
          explain={provisionCopy.explain}
          logTitle={provisionCopy.logTitle}
          empty={provisionCopy.empty}
          running={provisionCopy.running}
          closeLabel={provisionCopy.close}
          onOpenChange={provision.setOpen}
        />

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
            mailSent={isEditing ? (initialTenant?.pulsarMailSent ?? 0) : null}
            pulsarHosts={pulsarHosts}
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
