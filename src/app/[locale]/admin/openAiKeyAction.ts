"use server";

import { revalidatePath } from "next/cache";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { saveAiProvider } from "@/lib/ai/store/aiProviderStore";
import { listPlatformOpenAiModelIds } from "@/lib/ai/providers/openai/platformOpenAiModels";
import { clearPlatformOpenAiKey, savePlatformOpenAiKey } from "@/lib/ai/providers/openai/platformOpenAiKeyStore";

async function staffActor(): Promise<
  { ok: true; userId: string; email: string } | { ok: false; errorCode: "unauthorized" }
> {
  const session = await getPulsarStaffSession();
  if (!session || session.mustChangePassword) return { ok: false, errorCode: "unauthorized" };
  return { ok: true, userId: session.userId, email: session.email };
}

export async function savePlatformOpenAiKeyAction(raw: {
  locale: string;
  apiKey: string;
}): Promise<{ ok: true; last4: string } | { ok: false; errorCode: string }> {
  const actor = await staffActor();
  if (!actor.ok) return actor;
  const saved = await savePlatformOpenAiKey({
    apiKey: raw.apiKey,
    actorUserId: actor.userId,
    actorEmail: actor.email,
  });
  if (!saved.ok) return { ok: false, errorCode: saved.errorCode };
  const provider = await saveAiProvider({
    kind: "openai",
    apiKey: raw.apiKey,
    actorUserId: actor.userId,
    actorEmail: actor.email,
  });
  if (!provider.ok) return provider;
  revalidatePath(`/${raw.locale}/admin`);
  return { ok: true, last4: saved.last4 };
}

export async function clearPlatformOpenAiKeyAction(raw: {
  locale: string;
}): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const actor = await staffActor();
  if (!actor.ok) return actor;
  const cleared = await clearPlatformOpenAiKey({ actorUserId: actor.userId, actorEmail: actor.email });
  if (!cleared.ok) return cleared;
  revalidatePath(`/${raw.locale}/admin`);
  return { ok: true };
}

export async function testPlatformOpenAiModelsAction(): Promise<
  { ok: true; modelIds: string[] } | { ok: false; errorCode: string }
> {
  const actor = await staffActor();
  if (!actor.ok) return actor;
  return listPlatformOpenAiModelIds();
}
