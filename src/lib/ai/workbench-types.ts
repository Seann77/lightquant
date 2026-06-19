import type { UploadedCodeFile } from "@/lib/file-upload";

export type ApiResponse<T> =
  | { success: true; data: T; requestId: string }
  | { success: false; error: { code: string; message: string }; requestId: string };

export type AiTaskProgress = {
  phase?: string | null;
  phaseLabel?: string | null;
  progressPercent?: number | null;
  estimatedSecondsMin?: number | null;
  estimatedSecondsMax?: number | null;
  statusMessage?: string | null;
  inputChars?: number | null;
  processingMode?: string | null;
  chunkCount?: number | null;
  completedChunks?: number | null;
  currentChunk?: number | null;
  startedAt?: string | null;
  updatedAt?: string | null;
  failureStage?: string | null;
};

export type AiRunEventData = {
  id: string;
  taskId: string;
  conversationId?: string | null;
  seq: number;
  type: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  title: string;
  summary?: string | null;
  detailJson?: Record<string, unknown> | null;
  progressPercent?: number | null;
  visibility?: string | null;
  createdAt: string;
};

export type WorkbenchConversationMode = "strategy" | "convert" | "analysis";
export type WorkbenchTaskType = "strategy_generation" | "code_conversion" | "code_analysis";
export type WorkbenchAttachmentKind = "code" | "text" | "log" | "markdown" | "image";

export type AiTaskData = {
  task: {
    id: string;
    type?: string;
    status: string;
    conversationId?: string | null;
    sourcePlatform?: string | null;
    targetPlatform?: string | null;
    costPoints: number;
    title?: string | null;
    promptPreview?: string | null;
    errorCode?: string | null;
    errorMessage?: string | null;
    inputFileId?: string | null;
    startedAt?: string | null;
    finishedAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    progress?: AiTaskProgress | null;
    events?: AiRunEventData[] | null;
  };
  result: {
    scopeStatus: "in_scope" | "out_of_scope";
    generatedCode?: string | null;
    explanation: string | null;
    migrationNotes?: string | null;
    riskWarnings: string[];
    reportJson: Record<string, unknown> | null;
  } | null;
  visibleThinking?: string | null;
  finalAnswerMarkdown?: string | null;
  parsedResult?: AiTaskData["result"] | null;
  creditAccount?: {
    balance: number;
  };
  duplicated?: boolean;
  conversation?: AiConversationData | null;
  messages?: AiMessageData[];
  events?: AiRunEventData[];
  latestEventSeq?: number;
};

export type AiConversationData = {
  id: string;
  mode: WorkbenchConversationMode;
  title: string;
  targetPlatform: string | null;
  sourcePlatform: string | null;
  status: "active" | "archived";
  uiState?: Record<string, unknown> | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageAttachmentData = {
  id: string;
  messageId: string;
  conversationId: string;
  fileId: string;
  kind?: WorkbenchAttachmentKind | null;
  originalName?: string;
  ext?: string;
  mimeType?: string;
  sizeBytes?: number;
  scanStatus?: "PASSED" | "BLOCKED" | "WARNING";
  riskFlags?: string[];
  contentPreview?: string;
  hasThumbnail?: boolean;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  role: "input" | "reference" | "generated";
  displayOrder: number;
  caption: string | null;
  createdAt: string;
  file: {
    fileId: string;
    kind?: WorkbenchAttachmentKind | null;
    originalName: string;
    ext: string;
    mimeType: string;
    sizeBytes: number;
    scanStatus: "PASSED" | "BLOCKED" | "WARNING";
    riskFlags: string[];
    contentPreview: string;
    hasThumbnail?: boolean;
    thumbnailUrl?: string | null;
    previewUrl?: string | null;
    createdAt: string;
  };
};

export type AiMessageData = {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  taskId: string | null;
  content: string;
  contentJson: Record<string, unknown> | null;
  attachments?: MessageAttachmentData[];
  createdAt: string;
};

export type AiConversationMessagesData = {
  conversation: AiConversationData;
  messages: AiMessageData[];
  tasks?: AiTaskData["task"][];
  latestTask?: AiTaskData["task"] | null;
  latestResult?: AiTaskData["result"] | null;
  result?: AiTaskData["result"] | null;
  nextCursor?: string | null;
  limit?: number;
  taskLimit?: number;
};

export type AiTaskStatusData = {
  task: AiTaskData["task"];
  result: AiTaskData["result"] | null;
  latestEvents?: AiRunEventData[];
  latestEventSeq?: number;
  conversation?: Pick<AiConversationData, "id" | "mode"> | null;
  limit?: number;
};

export type AiTaskStreamEventData =
  | {
      type: "task";
      data: AiTaskData;
    }
  | {
      type: "thinking_delta" | "final_delta";
      delta: string;
    }
  | {
      type: "done";
      data: AiTaskData;
      visibleThinking?: string | null;
      finalAnswerMarkdown?: string | null;
      parsedResult?: AiTaskData["result"] | null;
    }
  | {
      type: "error";
      error: {
        code: string;
        message: string;
      };
    };

export type RestoredWorkbenchSnapshot = {
  sourcePlatform: string | null;
  targetPlatform: string | null;
  prompt: string | null;
  inputCodePreview: string | null;
  inputFileId: string | null;
  inputFileName: string | null;
  inputAttachment: MessageAttachmentData | null;
  taskData: AiTaskData | null;
};

export type RestoredUploadedFileSnapshot = Pick<
  RestoredWorkbenchSnapshot,
  "inputFileId" | "inputFileName" | "inputCodePreview" | "inputAttachment"
>;

export type WorkbenchUploadedFile = UploadedCodeFile;
