import type { Locale } from "@/types/i18n";

/**
 * Identificador estable de una plantilla de email.
 *
 * Las claves vienen del registry en `src/lib/email/templates/templateRegistry.ts`
 * y forman el contrato entre los emisores (que llaman `sendBrandedEmail`) y la
 * UI admin (combo de plantillas). Mantenerlo como `string` permite añadir keys
 * nuevas sin migración: el `templateRegistry` impone la lista canónica.
 */
export type EmailTemplateKey = string;

/**
 * Categoría de la plantilla para agrupar el combo del admin (Mensajería,
 * Facturación, Académico, etc.).
 */
export type EmailTemplateCategory =
  | "messaging"
  | "billing"
  | "churn"
  | "academics"
  | "notifications";

export interface EmailTemplatePlaceholder {
  /** Nombre del placeholder sin llaves (`brandName` → reemplaza `{{brandName}}`). */
  name: string;
  /** Texto corto para mostrar en el editor admin. */
  description: string;
  /** Valor de ejemplo para el preview. */
  sample: string;
}

/**
 * Definición canónica de una plantilla. Vive en código (registry); la BD solo
 * guarda overrides editables (subject + body_html) por (key, locale).
 */
export interface EmailTemplateDefinition {
  key: EmailTemplateKey;
  category: EmailTemplateCategory;
  /** Etiqueta corta para combo / títulos. */
  label: { es: string; en: string };
  /** Descripción humana de cuándo se envía y a quién. */
  description: { es: string; en: string };
  /** Defaults ES/EN: si la BD no tiene fila para (key, locale), se usan estos. */
  defaults: Record<Locale, { subject: string; bodyHtml: string }>;
  /** Variables disponibles para el cuerpo (documentación + sample para preview). */
  placeholders: EmailTemplatePlaceholder[];
}

/**
 * Override persistido en BD. `null`/ausente significa "usar default del registry".
 */
export interface EmailTemplateOverrideRow {
  templateKey: EmailTemplateKey;
  locale: Locale;
  subject: string;
  bodyHtml: string;
  updatedAt: string;
  updatedBy: string | null;
}

/**
 * Resolución final lista para enviar (registry + override + sustitución de vars).
 */
export interface ResolvedEmailTemplate {
  templateKey: EmailTemplateKey;
  locale: Locale;
  subject: string;
  bodyHtml: string;
  /** `true` si vino de un override en BD; `false` si es el default del registry. */
  fromOverride: boolean;
}
