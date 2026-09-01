import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getBrandForRequest } from "@/lib/brand/server";
import { loadBankTransferInstructionsSetting } from "@/lib/billing/loadBankTransferInstructionsSetting";
import { loadEnabledGatewaysForBillingCurrency } from "@/lib/payment-gateways/loadEnabledGatewaysForBillingCurrency";
import { loadRegistrationSectionOptions } from "@/lib/register/loadRegistrationSectionOptions";
import {
  parseRegistrationPayContext,
  requestedSectionIdsFromPayContext,
  type RegistrationPayContext,
} from "@/lib/register/parseRegistrationPayContext";
import { requestedSectionsHaveOpenSeats } from "@/lib/register/requestedSectionsHaveOpenSeats";
import { resolveRegistrationPublicPayMethods } from "@/lib/register/resolveRegistrationPublicPayMethods";
import type { RegistrationPublicPayMethod } from "@/lib/register/resolveRegistrationPublicPayMethods";

export type RegistrationMatriculaPayPageData = {
  context: RegistrationPayContext;
  sectionIsFull: boolean;
  sectionLabel: string;
  proposedSectionLabel: string;
  methods: RegistrationPublicPayMethod[];
  transferInstructions: string | null;
  alternatives: { id: string; label: string }[];
  whatsappUrl: string;
  contactEmail: string;
};

export async function loadRegistrationMatriculaPayPage(
  token: string,
): Promise<RegistrationMatriculaPayPageData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("registration_public_pay_context", {
    p_token: token,
  });
  if (error) return null;
  let context = parseRegistrationPayContext(data);
  if (!context) return null;

  const admin = createAdminClient();
  if (context.intakeState === "offer_pending" && context.proposedSectionId) {
    const proposedOpen = await requestedSectionsHaveOpenSeats(supabase, [
      context.proposedSectionId,
    ]);
    if (!proposedOpen) {
      await admin.from("registrations").update({
        intake_state: "section_full",
        proposed_section_id: null,
      }).eq("pay_token", token);
      context = { ...context, intakeState: "section_full", proposedSectionId: null };
    }
  }

  const requested = requestedSectionIdsFromPayContext(context);
  const [seatsOpen, options, brand] = await Promise.all([
    requestedSectionsHaveOpenSeats(supabase, requested),
    loadRegistrationSectionOptions(),
    getBrandForRequest(),
  ]);
  const sectionIsFull = requested.length > 0 && !seatsOpen;

  let sectionLabel = "";
  if (context.preferredSectionId) {
    const { data: label } = await supabase.rpc("registration_public_section_label", {
      p_section_id: context.preferredSectionId,
    });
    sectionLabel = label ? String(label) : "";
  }

  let proposedSectionLabel = "";
  if (context.proposedSectionId) {
    const { data: label } = await supabase.rpc("registration_public_section_label", {
      p_section_id: context.proposedSectionId,
    });
    proposedSectionLabel = label ? String(label) : "";
  }

  if (sectionIsFull && !context.feeCaptured && context.intakeState === "awaiting_fee") {
    await admin
      .from("registrations")
      .update({ intake_state: "section_full" })
      .eq("pay_token", token);
  }
  const [gateways, transfer] = await Promise.all([
    loadEnabledGatewaysForBillingCurrency(admin, context.snapshotCurrency),
    loadBankTransferInstructionsSetting(admin),
  ]);
  const methods = resolveRegistrationPublicPayMethods({
    enabledGateways: gateways.map((row) => row.provider),
    transferInstructions: transfer.instructions,
  });

  const hide = new Set(requested);
  if (context.proposedSectionId) hide.add(context.proposedSectionId);
  const alternatives = options.filter((row) => !hide.has(row.id));

  return {
    context,
    sectionIsFull,
    sectionLabel,
    proposedSectionLabel,
    methods,
    transferInstructions: transfer.instructions,
    alternatives,
    whatsappUrl: brand.socialWhatsapp.trim(),
    contactEmail: brand.contactEmail.trim(),
  };
}
