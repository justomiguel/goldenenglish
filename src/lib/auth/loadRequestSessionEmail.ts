import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/** Session email for public chrome. Deduped inside one request. */
export const loadRequestSessionEmail = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
});
