import Link from "next/link";
import { interpolatePrivacyCopy } from "@/lib/privacy/interpolatePrivacyCopy";
import {
  privacyControllerFields,
  type PrivacyControllerInput,
} from "@/lib/privacy/privacyControllerFields";
import { PRIVACY_SECTION_IDS } from "@/lib/privacy/privacySectionIds";
import type { Dictionary } from "@/types/i18n";

const privacyTextLinkClass =
  "inline-flex min-h-[44px] items-center underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background,#fff)]";

interface PublicPrivacyArticleProps {
  locale: string;
  dict: Dictionary;
  contact: PrivacyControllerInput;
}

export function PublicPrivacyArticle({
  locale,
  dict,
  contact,
}: PublicPrivacyArticleProps) {
  const privacy = dict.privacy;
  const fields = privacyControllerFields(contact);
  const brand = fields.brand || privacy.title;
  const vars = { ...fields, brand };
  const labels = privacy.controller;

  return (
    <article className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1
          id="privacy-page-title"
          className="font-display text-3xl font-bold text-[var(--color-heading,var(--color-primary))] md:text-4xl"
        >
          {privacy.title}
        </h1>
        <p className="mt-3 text-[var(--color-muted-foreground)] md:text-lg">
          {interpolatePrivacyCopy(privacy.lead, vars)}
        </p>
      </header>
      {PRIVACY_SECTION_IDS.map((id) => {
        const section = privacy.sections[id];
        return (
          <section key={id} className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
              {section.title}
            </h2>
            <p className="leading-relaxed text-[var(--color-muted-foreground)]">
              {interpolatePrivacyCopy(section.body, vars)}
            </p>
            {id === "controller" ? (
              <dl className="mt-3 space-y-2 text-sm text-[var(--color-foreground)]">
                {fields.registry ? (
                  <div>
                    <dt className="text-[var(--color-muted-foreground)]">{labels.registryLabel}</dt>
                    <dd>{fields.registry}</dd>
                  </div>
                ) : null}
                {fields.email ? (
                  <div>
                    <dt className="text-[var(--color-muted-foreground)]">{labels.emailLabel}</dt>
                    <dd>
                      <a
                        href={`mailto:${fields.email}`}
                        className={`${privacyTextLinkClass} text-[var(--color-primary)] decoration-current/40 hover:decoration-current`}
                      >
                        {fields.email}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {fields.phone ? (
                  <div>
                    <dt className="text-[var(--color-muted-foreground)]">{labels.phoneLabel}</dt>
                    <dd>
                      <a
                        href={`tel:${fields.phone}`}
                        className={`${privacyTextLinkClass} text-[var(--color-primary)] decoration-current/40 hover:decoration-current`}
                      >
                        {fields.phone}
                      </a>
                    </dd>
                  </div>
                ) : null}
                {fields.address ? (
                  <div>
                    <dt className="text-[var(--color-muted-foreground)]">{labels.addressLabel}</dt>
                    <dd>{fields.address}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
          </section>
        );
      })}
      <p className="pt-2">
        <Link
          href={`/${locale}`}
          className={`${privacyTextLinkClass} text-sm font-medium text-[var(--color-primary)] decoration-[var(--color-primary)]/35 hover:decoration-[var(--color-primary)]`}
        >
          {privacy.backHome}
        </Link>
      </p>
    </article>
  );
}
