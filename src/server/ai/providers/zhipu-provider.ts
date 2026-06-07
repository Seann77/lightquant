import { runOpenAiCompatibleProvider } from "@/server/ai/providers/openai-compatible-provider";
import type { AiProviderInput, AiProviderResult } from "@/server/ai/providers/types";

export async function runZhipuProvider(input: AiProviderInput): Promise<AiProviderResult> {
  return runOpenAiCompatibleProvider(input, {
    provider: "zhipu"
  });
}
