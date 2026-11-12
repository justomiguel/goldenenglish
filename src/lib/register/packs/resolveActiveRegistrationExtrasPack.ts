import { createClient } from "@/lib/supabase/server";
import {
  parseRegisterExtrasPack,
  type RegisterExtrasPack,
} from "@/lib/register/packs/registerExtrasPack";

/** Reads `site_settings` key `register.extras_pack`. A missing row means no pack. */
export async function resolveActiveRegistrationExtrasPack(): Promise<RegisterExtrasPack | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "register.extras_pack")
    .maybeSingle();
  const raw = data?.value;
  return parseRegisterExtrasPack(typeof raw === "string" ? raw : null);
}
