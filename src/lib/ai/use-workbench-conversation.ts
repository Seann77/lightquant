"use client";

import { useEffect, useRef, useState } from "react";
import {
  fetchAiConversationMessages,
  fetchAiConversationSummary,
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

  useEffect(() => {
    callbacksRef.current = {
      onError,
      onRestore,
      onSummary
    };
  }, [onError, onRestore, onSummary]);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const activeConversationId = conversationId;
    setLoading(true);

    async function restore() {
      const summary = await fetchAiConversationSummary(activeConversationId);

      if (summary.mode !== expectedMode) {
        throw new Error("VALIDATION_ERROR:当前会话不属于此模块。");
      }

      if (cancelled) {
        return;
      }

      callbacksRef.current.onSummary?.(summary);

      const data = await fetchAiConversationMessages(activeConversationId, {
        limit: messages?.limit ?? 20,
        taskLimit: messages?.taskLimit ?? 1,
        includeTaskResults: messages?.includeTaskResults ?? "latest"
      });

      if (data.conversation.mode !== expectedMode) {
        throw new Error("VALIDATION_ERROR:当前会话不属于此模块。");
      }

      if (cancelled) {
        return;
      }

      callbacksRef.current.onRestore(data, restoreWorkbenchConversation(data, taskType));
    }

    restore()
      .catch((error) => {
        if (!cancelled) {
          callbacksRef.current.onError(error);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [conversationId, expectedMode, messages?.includeTaskResults, messages?.limit, messages?.taskLimit, taskType]);

  return {
    loading
  };
}
