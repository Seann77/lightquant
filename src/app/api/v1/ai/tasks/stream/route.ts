import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { createAndStreamAiTask, type AiTaskStreamEvent } from "@/server/ai/ai-service";
import { ApiError, createRequestId, fail } from "@/server/http/api-response";
import { getStringField, readJsonObject } from "@/server/http/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClientStreamEvent =
  | AiTaskStreamEvent
  | {
      type: "error";
      error: {
        code: string;
        message: string;
      };
    };

export async function POST(request: NextRequest) {
  const requestId = createRequestId();
  let userId: string;
  let input: Parameters<typeof createAndStreamAiTask>[1];

  try {
    userId = await requireSessionUserId();
    const body = await readJsonObject(request);
    input = {
      type: getStringField(body, "type"),
      conversationId: getStringField(body, "conversationId", false),
      messageContent: getStringField(body, "messageContent", false),
      sourcePlatform: getStringField(body, "sourcePlatform", false),
      targetPlatform: getStringField(body, "targetPlatform", false),
      prompt: getStringField(body, "prompt", false),
      inputCode: getStringField(body, "inputCode", false),
      inputFileId: getStringField(body, "inputFileId", false),
      clientRequestId: getStringField(body, "clientRequestId")
    };
  } catch (error) {
    return fail(error, requestId);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: ClientStreamEvent) => {
        controller.enqueue(encoder.encode(`event: ${event.type}\n`));
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        await createAndStreamAiTask(userId, input, requestId, emit);
      } catch (error) {
        emit({
          type: "error",
          error: normalizeStreamError(error)
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}

function normalizeStreamError(error: unknown) {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      message: error.message
    };
  }

  console.error("[ai-task-stream] unexpected failure", error);

  return {
    code: "AI_TASK_FAILED",
    message: "AI 任务执行失败，请稍后重试"
  };
}
