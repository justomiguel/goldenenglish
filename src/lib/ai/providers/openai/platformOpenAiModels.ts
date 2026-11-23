import "server-only";

import { logServerError } from "@/lib/logging/serverActionLog";
import { mapOpenAiCallError } from "@/lib/ai/providers/openai/mapOpenAiCallError";
import type { OpenAiGateway } from "@/lib/ai/providers/openai/openAiGateway";
import { createOpenAiSdkGateway } from "@/lib/ai/providers/openai/openAiSdkGateway";

const MODEL_CAP = 40;

export async function listPlatformOpenAiModelIds(
  gateway: OpenAiGateway = createOpenAiSdkGateway(),
): Promise<{ ok: true; modelIds: string[] } | { ok: false; errorCode: string }> {
  try {
    const ids = await gateway.listModelIds();
    return { ok: true, modelIds: ids.filter((id) => id.trim()).slice(0, MODEL_CAP) };
  } catch (err) {
    const mapped = mapOpenAiCallError(err);
    await logServerError("listPlatformOpenAiModelIds", { code: mapped.code, requestId: mapped.requestId });
    return { ok: false, errorCode: mapped.code };
  }
}
