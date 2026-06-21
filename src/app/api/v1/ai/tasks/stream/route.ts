import type { NextRequest } from "next/server";
import { requireSessionUserId } from "@/server/auth/session";
import { createAndStreamAiTask, type AiTaskStreamEvent } from "@/server/ai/ai-service";
import { getAiPerfNow, logAiPerf, measureAiPerf } from "@/server/ai/ai-perf";
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
  const routeStartedAt = getAiPerfNow();
  let userId: string;
  let input: Parameters<typeof createAndStreamAiTask>[1];

  try {
    userId = await measureAiPerf("tasks.stream.auth", { requestId }, () => requireSessionUserId());
    const body = await measureAiPerf("tasks.stream.read_request", { requestId }, () => readJsonObject(request));
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
    logAiPerf("tasks.stream.request_ready", {
      requestId,
      taskType: input.type,
      hasConversation: Boolean(input.conversationId),
      hasInputFile: Boolean(input.inputFileId),
      messageChars: input.messageContent?.length ?? 0,
      promptChars: input.prompt?.length ?? 0,
      inputChars: input.inputCode?.length ?? 0,
      durationMs: getAiPerfNow() - routeStartedAt
    });
  } catch (error) {
    logAiPerf("tasks.stream.request_failed", {
      requestId,
      durationMs: getAiPerfNow() - routeStartedAt
    });
    return fail(error, requestId);
  }

  const encoder = new TextEncoder();
  let streamClosed = false;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const streamStartedAt = getAiPerfNow();
      let firstEmitLogged = false;
      const emit = (event: ClientStreamEvent) => {
        if (streamClosed) {
          return;
        }

        if (!firstEmitLogged) {
          logAiPerf("tasks.stream.first_emit", {
            requestId,
            eventType: event.type,
            taskStatus: event.type === "task" ? event.data.task.status : undefined,
            durationMs: getAiPerfNow() - streamStartedAt,
            totalDurationMs: getAiPerfNow() - routeStartedAt
          });
          firstEmitLogged = true;
        }

        if (event.type === "done") {
          logAiPerf("tasks.stream.done_emit", {
            requestId,
            taskStatus: event.data.task.status,
            durationMs: getAiPerfNow() - streamStartedAt,
            totalDurationMs: getAiPerfNow() - routeStartedAt
          });
        }

        try {
          controller.enqueue(encoder.encode(`event: ${event.type}\n`));
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch (error) {
          streamClosed = true;
          logAiPerf("tasks.stream.emit_closed", {
            requestId,
            eventType: event.type,
            durationMs: getAiPerfNow() - streamStartedAt,
            totalDurationMs: getAiPerfNow() - routeStartedAt
          });
        }
      };

      try {
        await measureAiPerf("tasks.stream.create_and_stream", {
          requestId,
          taskType: input.type
        }, () => createAndStreamAiTask(userId, input, requestId, emit));
      } catch (error) {
        logAiPerf("tasks.stream.error_emit", {
          requestId,
          durationMs: getAiPerfNow() - streamStartedAt,
          totalDurationMs: getAiPerfNow() - routeStartedAt
        });
        if (!streamClosed) {
          emit({
            type: "error",
            error: normalizeStreamError(error)
          });
        }
      } finally {
        logAiPerf("tasks.stream.close", {
          requestId,
          durationMs: getAiPerfNow() - streamStartedAt,
          totalDurationMs: getAiPerfNow() - routeStartedAt
        });
        if (!streamClosed) {
          streamClosed = true;
          controller.close();
        }
      }
    },
    cancel() {
      streamClosed = true;
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
