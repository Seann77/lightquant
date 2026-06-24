import { ServerConfigError } from "@/server/env";
import type { AiTask } from "@/server/domain";
import { getAiTaskConfig } from "@/server/ai/ai-task-config";
import { resolveAiRuntimeConfig, type AiRuntimeConfig } from "@/server/ai/ai-runtime-config";
import { getAiSkill } from "@/server/ai/skills";
import { ApiError } from "@/server/http/api-response";
import { runChunkedCodeProcessing, shouldUseChunkedCodeProcessing } from "@/server/ai/code-chunking";
import { runMockAiProvider, runMockAiProviderStream } from "@/server/ai/providers/mock-provider";
import { runOpenAiCompatibleProvider, runOpenAiCompatibleProviderStream } from "@/server/ai/providers/openai-compatible-provider";
import type { AiProviderAttachment, AiProviderInput, AiProviderResult, AiProviderStreamCallbacks, AiProviderStreamResult } from "@/server/ai/providers/types";

export async function runAiProvider(
  task: AiTask,
  conversationContext?: string,
  progressReporter?: AiProviderInput["progressReporter"],
  attachments?: AiProviderAttachment[]
): Promise<AiProviderResult> {
  const runtimeConfig = await readRuntimeConfig();
  const input = {
    task,
    skill: getAiSkill(task.type),
    config: getAiTaskConfig(task.type),
    conversationContext,
    attachments,
    progressReporter
  };

  if (shouldUseChunkedCodeProcessing(input)) {
    return runChunkedCodeProcessing(input, (chunkInput) => runSingleAiProvider(runtimeConfig, chunkInput));
  }

  return runSingleAiProvider(runtimeConfig, input);
}

export async function runAiProviderStream(
  task: AiTask,
  conversationContext?: string,
  callbacks?: AiProviderStreamCallbacks,
  attachments?: AiProviderAttachment[]
): Promise<AiProviderStreamResult> {
  const runtimeConfig = await readRuntimeConfig();
  const input = {
    task,
    skill: getAiSkill(task.type),
    config: getAiTaskConfig(task.type),
    conversationContext,
    attachments
  };

  if (runtimeConfig.provider === "mock") {
    return runMockAiProviderStream(input, callbacks, {
      model: runtimeConfig.model
    });
  }

  return runOpenAiCompatibleProviderStream(input, {
    runtimeConfig
  }, callbacks);
}

function runSingleAiProvider(runtimeConfig: AiRuntimeConfig, input: AiProviderInput) {
  if (runtimeConfig.provider === "mock") {
    return runMockAiProvider(input, {
      model: runtimeConfig.model
    });
  }

  return runOpenAiCompatibleProvider(input, {
    runtimeConfig
  });
}

async function readRuntimeConfig() {
  try {
    return await resolveAiRuntimeConfig();
  } catch (error) {
    if (error instanceof ServerConfigError) {
      throw new ApiError("AI_PROVIDER_CONFIG_ERROR", "AI 服务配置不可用", 500);
    }

    throw error;
  }
}
