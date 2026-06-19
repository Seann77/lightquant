"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchAiConversationSnapshot,
  getWorkbenchSwitchPerf,
  logWorkbenchPerf,
  notifyWorkbenchSwitchComplete,
  restoreWorkbenchConversation
} from "@/lib/ai/workbench-client";
import type {
  AiConversationData,
  AiConversationMessagesData,
  RestoredWorkbenchSnapshot,
  WorkbenchConversationMode,
  WorkbenchTaskType
} from "@/lib/ai/workbench-types";

type RestoreOptions = {
  conversationId: string | null;
  expectedMode: WorkbenchConversationMode;
  taskType: WorkbenchTaskType;
  messages?: {
    limit?: number;
    taskLimit?: number;
    includeTaskResults?: "none" | "latest" | "all";
  };
  onSummary?: (conversation: AiConversationData) => void;
  onRestore: (data: AiConversationMessagesData, snapshot: RestoredWorkbenchSnapshot) => void;
  onError: (error: unknown) => void;
};

export function useWorkbenchConversationRestore({
  conversationId,
  expectedMode,
  messages,
  onError,
  onRestore,
  onSummary,
  taskType
}: RestoreOptions) {
  const [loading, setLoading] = useState(false);
  const callbacksRef = useRef({
    onError,
    onRestore,
    onSummary
  });
  const restoreRequestIdRef = useRef(0);

  useEffect(() => {
    callbacksRef.current = {
      onError,
      onRestore,
      onSummary
    };
  }, [onError, onRestore, onSummary]);

  useEffect(() => {
    if (!conversationId) {
      restoreRequestIdRef.current += 1;
      setLoading(false);
      return;
    }

    const requestId = restoreRequestIdRef.current + 1;
    restoreRequestIdRef.current = requestId;
    const controller = new AbortController();
    const activeConversationId = conversationId;
    const isStaleRequest = () => controller.signal.aborted || restoreRequestIdRef.current !== requestId;
    setLoading(true);

    async function restore() {
      const requestStartedAt = getPerfNow();
      const clickPerfState = getWorkbenchSwitchPerf(activeConversationId);
      logWorkbenchPerf("snapshot.request", {
        conversationId: activeConversationId,
        taskType,
        clickToRequestMs: clickPerfState ? Math.round(requestStartedAt - clickPerfState.clickedAt) : null
      });
      const data = await fetchAiConversationSnapshot(activeConversationId, {
        limit: messages?.limit ?? 20,
        taskLimit: messages?.taskLimit ?? 1,
        includeTaskResults: messages?.includeTaskResults ?? "latest",
        signal: controller.signal
      });
      const snapshotResolvedAt = getPerfNow();
      const resolvedClickPerfState = getWorkbenchSwitchPerf(activeConversationId);

      if (isStaleRequest()) {
        return;
      }

      if (data.conversation.mode !== expectedMode) {
        throw new Error("VALIDATION_ERROR:当前会话不属于此模块。");
      }

      if (isStaleRequest()) {
        return;
      }

      const restoredSnapshot = restoreWorkbenchConversation(data, taskType);
      logWorkbenchPerf("snapshot.resolved", {
        conversationId: activeConversationId,
        taskType,
        requestMs: Math.round(snapshotResolvedAt - requestStartedAt),
        clickToSnapshotMs: resolvedClickPerfState ? Math.round(snapshotResolvedAt - resolvedClickPerfState.clickedAt) : null,
        messages: data.messages.length,
        tasks: data.tasks?.length ?? 0,
        hasResult: Boolean(data.latestResult ?? data.result),
        taskStatus: restoredSnapshot.taskData?.task.status ?? null
      });
      callbacksRef.current.onSummary?.(data.conversation);
      callbacksRef.current.onRestore(data, restoredSnapshot);
      window.requestAnimationFrame(() => {
        const renderedClickPerfState = getWorkbenchSwitchPerf(activeConversationId);
        const renderedAt = getPerfNow();

        logWorkbenchPerf("snapshot.rendered", {
          conversationId: activeConversationId,
          taskType,
          clickToRenderedMs: renderedClickPerfState ? Math.round(renderedAt - renderedClickPerfState.clickedAt) : null,
          snapshotToRenderedMs: Math.round(renderedAt - snapshotResolvedAt),
          taskStatus: restoredSnapshot.taskData?.task.status ?? null,
          hasResult: Boolean(restoredSnapshot.taskData?.result)
        });
        notifyWorkbenchSwitchComplete({
          conversationId: activeConversationId,
          status: "rendered"
        });
      });
    }

    restore()
      .catch((error) => {
        if (!isStaleRequest() && !isAbortError(error)) {
          callbacksRef.current.onError(error);
          notifyWorkbenchSwitchComplete({
            conversationId: activeConversationId,
            status: "error"
          });
        }
      })
      .finally(() => {
        if (!isStaleRequest()) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [conversationId, expectedMode, messages?.includeTaskResults, messages?.limit, messages?.taskLimit, taskType]);

  return {
    loading
  };
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function getPerfNow() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
