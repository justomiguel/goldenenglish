import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getBrandForRequest } from "@/lib/brand/server";
import { loadBankTransferInstructionsSetting } from "@/lib/billing/loadBankTransferInstructionsSetting";
import { loadEnabledGatewaysForBillingCurrency } from "@/lib/payment-gateways/loadEnabledGatewaysForBillingCurrency";
import { resolveRegistrationPublicPayMethods } from "@/lib/register/resolveRegistrationPublicPayMethods";
import type { RegistrationMatriculaPayPageData } from "@/lib/register/loadRegistrationMatriculaPayPage";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";

export async function loadRegistrationTrialFeePayPage(
  token: string,
): Promise<RegistrationMatriculaPayPageData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registration_public_trial_pay_context", {
    p_token: token,
  });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const firstName = String(r.first_name ?? "").trim();
  const lastName = String(r.last_name ?? "").trim();
  if (!firstName && !lastName) return null;
  const snapshot = (r.trial_fee_snapshot ?? {}) as {
    kind?: unknown;
    total?: unknown;
    currency?: unknown;
  };
  const preferredSectionId =
    r.preferred_section_id == null ? null : String(r.preferred_section_id);
  const additionalSectionIds = Array.isArray(r.additional_section_ids)
    ? r.additional_section_ids.map(String).filter(Boolean)
    : [];
  const requested = [preferredSectionId, ...additionalSectionIds].filter(
    (id): id is string => Boolean(id),
  );
  const seatsOpen = await requestedSectionsHaveOpenSeats(supabase, requested);
  const pendingDelta = snapshot.kind === "trial_fee_delta" && Number(snapshot.total ?? 0) > 0;
  const feeCaptured = r.trial_fee_captured === true && !pendingDelta;
  let sectionLabel = "";
  if (preferredSectionId) {
    const { data: label } = await supabase.rpc("registration_public_section_label", {
      p_section_id: preferredSectionId,
    });
    sectionLabel = label ? String(label) : "";
  }
  const admin = createAdminClient();
  const [gateways, transfer, brand] = await Promise.all([
    loadEnabledGatewaysForBillingCurrency(admin, String(snapshot.currency ?? "USD")),
    loadBankTransferInstructionsSetting(admin),
    getBrandForRequest(),
  ]);
  return {
    context: {
      firstName,
      lastName,
      status: String(r.status ?? "new"),
      intakeState: "awaiting_fee",
      feeCaptured,
      snapshotTotal: Number(snapshot.total ?? 0) || 0,
      snapshotCurrency: String(snapshot.currency ?? "USD"),
      preferredSectionId,
      additionalSectionIds,
    },
    sectionIsFull: requested.length > 0 && !seatsOpen,
    sectionLabel,
    methods: resolveRegistrationPublicPayMethods({
      enabledGateways: gateways.map((row) => row.provider),
      transferInstructions: transfer.instructions,
    }),
    transferInstructions: transfer.instructions,
    alternatives: [],
    whatsappUrl: brand.socialWhatsapp.trim(),
    contactEmail: brand.contactEmail.trim(),
  };
}
