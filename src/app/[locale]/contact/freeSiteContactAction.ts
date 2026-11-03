"use server";

import { submitFreeSiteContact, type FreeSiteContactResult } from "@/lib/pulsar/submitFreeSiteContact";

export async function submitGenericLandingContactAction(input: unknown): Promise<FreeSiteContactResult> {
  return submitFreeSiteContact(input);
}
