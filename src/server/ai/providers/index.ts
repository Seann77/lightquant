import { getAiProviderMode, ServerConfigError } from "@/server/env";
import type { AiTask } from "@/server/domain";
import { getAiTaskConfig } from "@/server/ai/ai-task-config";
import { getAiSkill } from "@/server/ai/skills";
import { ApiError } from "@/server/http/api-response";
import { runChunkedCodeProcessing, shouldUseChunkedCodeProcessing } from "@/server/ai/code-chunking";
import { runDeepSeekProvider } from "@/server/ai/providers/deepseek-provider";
import { runMockAiProvider } from "@/server/ai/providers/mock-provider";
import { runOpenAiCompatibleProvider } from "@/server/ai/providers/openai-compatible-provider";
import type { AiProviderAttachment, AiProviderInput, AiProviderResult } from "@/server/ai/providers/types";

export async function runAiProvider(
  task: AiTask,
  conversationContext?: string,
  progressReporter?: AiProviderInput["progressReporter"],
  attachments?: AiProviderAttachment[]
): Promise<AiProviderResult> {
  const provider = readProviderMode();
  const input = {
    task,
    skill: getAiSkill(task.type),
    config: getAiTaskConfig(task.type),
    conversationContext,
    attachments,
    progressReporter
  };

  if (shouldUseChunkedCodeProcessing(input)) {
    return runChunkedCodeProcessing(input, (chunkInput) => runSingleAiProvider(provider, chunkInput));
  }

  return runSingleAiProvider(provider, input);
}

function runSingleAiProvider(provider: ReturnType<typeof readProviderMode>, input: AiProviderInput) {
  if (provider === "mock") {
    return runMockAiProvider(input);
  }

  if (provider === "deepseek") {
    return runDeepSeekProvider(input);
  }

  return runOpenAiCompatibleProvider(input, {
    provider
  });
}

function readProviderMode() {
  try {
    return getAiProviderMode();
  } catch (error) {
    if (error instanceof ServerConfigError) {
      throw new ApiError("AI_PROVIDER_CONFIG_ERROR", "AI 服务配置不可用", 500);
    }

    throw error;
  }
}
