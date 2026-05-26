import type { AdkEvent, FeedbackLanguage } from "./types";

const APP_NAME = "english_coach";
const USER_ID = "web-user";

const LANG_PROMPT: Record<FeedbackLanguage, string> = {
  "zh-Hans": "请用中文反馈",
  en: "Please give feedback in English.",
  ja: "日本語でフィードバックしてください",
  ko: "한국어로 피드백 부탁드립니다",
};

export async function createSession(): Promise<string> {
  const r = await fetch(`/adk/apps/${APP_NAME}/users/${USER_ID}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (!r.ok) throw new Error(`createSession failed: ${r.status} ${r.statusText}`);
  const data = await r.json();
  return data.id as string;
}

export interface RunOptions {
  sessionId: string;
  language: FeedbackLanguage;
  onEvent: (e: AdkEvent) => void;
  onError?: (err: Error) => void;
  onDone?: () => void;
  signal?: AbortSignal;
}

/** POSTs to /run_sse and streams parsed events. Returns once stream ends. */
export async function runSSE(opts: RunOptions): Promise<void> {
  const body = {
    appName: APP_NAME,
    userId: USER_ID,
    sessionId: opts.sessionId,
    newMessage: {
      role: "user",
      parts: [{ text: LANG_PROMPT[opts.language] }],
    },
    streaming: true,
  };

  const r = await fetch("/adk/run_sse", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!r.ok || !r.body) {
    throw new Error(`run_sse failed: ${r.status} ${r.statusText}`);
  }

  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      // SSE frames separated by \n\n
      let idx: number;
      while ((idx = buf.indexOf("\n\n")) !== -1) {
        const frame = buf.slice(0, idx);
        buf = buf.slice(idx + 2);
        for (const line of frame.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trimStart();
          if (!payload) continue;
          try {
            const evt = JSON.parse(payload) as AdkEvent;
            opts.onEvent(evt);
          } catch (e) {
            // Sometimes server sends `{"error": "..."}` — surface as error event
            opts.onError?.(new Error(`bad SSE frame: ${(e as Error).message}`));
          }
        }
      }
    }
    opts.onDone?.();
  } catch (e) {
    if ((e as Error).name === "AbortError") return;
    opts.onError?.(e as Error);
  }
}
