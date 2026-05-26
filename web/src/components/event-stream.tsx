import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { nodeIdFromPath, rootNodeOf } from "../lib/pipeline-map";
import type { AdkEvent } from "../lib/types";
import { cn } from "../lib/utils";

function eventLine(e: AdkEvent): { tag: string; text: string; tone: "neutral" | "model" | "node" | "done" } {
  const path = e.nodeInfo?.path;
  const root = rootNodeOf(path);
  const last = nodeIdFromPath(path) ?? e.author;
  const text = e.content?.parts?.map((p) => p.text).filter(Boolean).join(" ") ?? "";
  const isDone = !!e.nodeInfo?.outputFor?.includes(path ?? "");
  const tag = isDone ? `${last} · done` : last;
  const tone = isDone ? "done" : root ? "node" : "model";
  if (text) return { tag, text, tone };
  if (isDone && e.output !== undefined) {
    const preview =
      typeof e.output === "string"
        ? e.output
        : JSON.stringify(e.output).slice(0, 240);
    return { tag, text: `→ ${preview}`, tone };
  }
  return { tag, text: "(no payload)", tone: "neutral" };
}

const TONE: Record<string, string> = {
  neutral: "text-[var(--color-fg-tertiary)]",
  model: "text-[var(--color-fg-tertiary)]",
  node: "text-[var(--color-fg)]",
  done: "text-[var(--color-status-done)]",
};

export function EventStream({ events }: { events: AdkEvent[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(true);

  useEffect(() => {
    if (!stick || !ref.current) return;
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [events, stick]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 24);
  };

  if (events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-8 text-center">
        <div className="max-w-[280px]">
          <div className="text-[13px] font-medium text-[var(--color-fg-secondary)]">
            Ready when you are.
          </div>
          <div className="mt-1 text-[12px] text-[var(--color-fg-tertiary)]">
            Events will stream here in real time once you start a run.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div
        ref={ref}
        onScroll={onScroll}
        className="h-full overflow-y-auto px-5 py-3"
      >
        {events.map((e) => {
          const { tag, text, tone } = eventLine(e);
          const ts = new Date(e.timestamp * 1000).toLocaleTimeString(undefined, {
            hour12: false,
          });
          return (
            <div
              key={e.id}
              className="flex gap-3 rounded-md py-[3px] font-mono text-[11.5px] leading-[1.55] transition-colors hover:bg-[var(--color-fill-4)]"
            >
              <span className="w-[62px] shrink-0 tabular-nums text-[var(--color-fg-tertiary)]">
                {ts}
              </span>
              <span className="w-[170px] shrink-0 truncate text-[var(--color-fg-secondary)]">
                {tag}
              </span>
              <span
                className={cn(
                  "min-w-0 flex-1 whitespace-pre-wrap break-words",
                  TONE[tone],
                )}
              >
                {text}
              </span>
            </div>
          );
        })}
      </div>
      {!stick && (
        <button
          type="button"
          onClick={() => setStick(true)}
          className="absolute bottom-3 right-4 inline-flex items-center gap-1 rounded-full px-2.5 py-[5px] text-[10.5px] font-medium text-white transition active:scale-[0.98]"
          style={{
            background: "var(--color-fg)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <ChevronDown size={11} /> Jump to latest
        </button>
      )}
    </div>
  );
}
