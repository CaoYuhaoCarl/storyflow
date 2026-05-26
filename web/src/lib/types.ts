export type FeedbackLanguage = "zh-Hans" | "en" | "ja" | "ko";

export interface AdkEvent {
  invocationId: string;
  author: string;
  id: string;
  timestamp: number;
  partial?: boolean;
  branch?: string;
  content?: {
    role: "user" | "model";
    parts: { text?: string }[];
  };
  actions?: {
    stateDelta?: Record<string, unknown>;
    artifactDelta?: Record<string, unknown>;
  };
  output?: unknown;
  nodeInfo?: {
    path: string;
    outputFor?: string[];
    messageAsOutput?: boolean;
  };
}

export type NodeStatus = "pending" | "running" | "done" | "error";

export interface ChildState {
  key: string;
  filename: string;
  status: NodeStatus;
  startedAt?: number;
  finishedAt?: number;
  attempt: number;
  message?: string;
  output?: ProcessOneInputOutput;
  error?: string;
}

export interface NodeState {
  id: string;
  label: string;
  status: NodeStatus;
  startedAt?: number;
  finishedAt?: number;
  message?: string;
  output?: unknown;
  error?: string;
  children?: Map<string, ChildState>;
}

export interface RunState {
  phase: "idle" | "uploading" | "running" | "done" | "error";
  invocationId?: string;
  sessionId?: string;
  startedAt?: number;
  finishedAt?: number;
  nodes: Record<string, NodeState>;
  events: AdkEvent[];
  newReportFiles: string[];
  error?: string;
}

export interface ProcessOneInputOutput {
  filename: string;
  category: "writing" | "grammar_training" | "unsupported";
  student_name?: string;
  feedback_language?: FeedbackLanguage;
}

export interface InputFile {
  filename: string;
  size: number;
  mtime: number;
  mime: string;
}

export interface ReportMeta {
  filename: string;
  size: number;
  mtime: number;
  student: string;
  feedback_language: string;
  generated_at: string;
  submission_count: number;
}
