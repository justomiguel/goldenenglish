import { readAiEncryptionSecret } from "@/lib/ai/readAiEncryptionSecret";

export function readOpenAiEncryptionSecret(): Buffer | null {
  return readAiEncryptionSecret();
}
