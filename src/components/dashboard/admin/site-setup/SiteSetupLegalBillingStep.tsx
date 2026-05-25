"use client";

import { Banknote } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { BillingCurrencySelectField } from "@/components/molecules/BillingCurrencySelectField";
import type { SiteSetupOperationalValues } from "@/lib/site/loadSiteSetupCurrentValues";

type L = Dictionary["dashboard"]["siteSetup"]["legalBilling"];

interface SiteSetupLegalBillingStepProps {
  labels: L;
  operational: SiteSetupOperationalValues;
  update: <K extends keyof SiteSetupOperationalValues>(
    key: K,
    value: SiteSetupOperationalValues[K],
  ) => void;
}

export function SiteSetupLegalBillingStep({
  labels,
  operational,
  update,
}: SiteSetupLegalBillingStepProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Banknote
          className="h-5 w-5 text-[var(--color-primary)]"
          aria-hidden
        />
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h2>
      </div>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.lead}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <BillingCurrencySelectField
            id="site-setup-billing-currency"
            value={operational.billingCurrency}
            onChange={(v) => update("billingCurrency", v)}
            label={labels.billingCurrencyLabel}
            otherOptionLabel={labels.billingCurrencyOther}
            otherInputAriaLabel={labels.billingCurrencyOtherAria}
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.billingCurrencyHint}
          </p>
        </div>
        <div>
          <Label htmlFor="legal-age">{labels.legalAgeMajority}</Label>
          <Input
            id="legal-age"
            className="mt-1"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            value={operational.legalAgeMajority}
            onChange={(e) => update("legalAgeMajority", e.target.value)}
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.legalAgeMajorityHint}
          </p>
        </div>
        <div>
          <Label htmlFor="student-renewal">
            {labels.studentRenewalWarnDays}
          </Label>
          <Input
            id="student-renewal"
            className="mt-1"
            type="number"
            inputMode="numeric"
            min={1}
            max={3650}
            value={operational.studentRenewalWarnDays}
            onChange={(e) => update("studentRenewalWarnDays", e.target.value)}
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.studentRenewalWarnDaysHint}
          </p>
        </div>
      </div>

      <h3 className="pt-2 text-sm font-semibold text-[var(--color-foreground)]">
        {labels.billingTermsTitle}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="bt-enrol-es">{labels.billingTermEnrollment}</Label>
          <Input
            id="bt-enrol-es"
            className="mt-1"
            value={operational.billingTermEnrollment}
            onChange={(e) => update("billingTermEnrollment", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="bt-enrol-en">{labels.billingTermEnrollmentEn}</Label>
          <Input
            id="bt-enrol-en"
            className="mt-1"
            value={operational.billingTermEnrollmentEn}
            onChange={(e) =>
              update("billingTermEnrollmentEn", e.target.value)
            }
          />
        </div>
        <div>
          <Label htmlFor="bt-month-es">{labels.billingTermMonthly}</Label>
          <Input
            id="bt-month-es"
            className="mt-1"
            value={operational.billingTermMonthly}
            onChange={(e) => update("billingTermMonthly", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="bt-month-en">{labels.billingTermMonthlyEn}</Label>
          <Input
            id="bt-month-en"
            className="mt-1"
            value={operational.billingTermMonthlyEn}
            onChange={(e) => update("billingTermMonthlyEn", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="bt-promo-es">{labels.billingTermPromotion}</Label>
          <Input
            id="bt-promo-es"
            className="mt-1"
            value={operational.billingTermPromotion}
            onChange={(e) => update("billingTermPromotion", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="bt-promo-en">{labels.billingTermPromotionEn}</Label>
          <Input
            id="bt-promo-en"
            className="mt-1"
            value={operational.billingTermPromotionEn}
            onChange={(e) =>
              update("billingTermPromotionEn", e.target.value)
            }
          />
        </div>
      </div>
    </div>
  );
}
