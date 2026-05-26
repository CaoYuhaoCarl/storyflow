import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { PIPELINE } from "../lib/pipeline-map";
import type { ChildState, NodeState } from "../lib/types";
import { cn, formatDuration } from "../lib/utils";
import { StatusDot } from "./status-dot";

function duration(n: NodeState | ChildState): number | undefined {
  if (!n.startedAt) return undefined;
  return (n.finishedAt ?? Date.now()) - n.startedAt;
}

const CATEGORY_PILL: Record<string, { bg: string; fg: string; label: string }> = {
  writing: { bg: "rgba(0, 122, 255, 0.12)", fg: "#0a6bd4", label: "writing" },
  grammar_training: { bg: "rgba(88, 86, 214, 0.14)", fg: "#4744b8", label: "grammar" },
  unsupported: { bg: "var(--color-fill-3)", fg: "var(--color-fg-secondary)", label: "skipped" },
};

interface Props {
  node: NodeState;
  isLast: boolean;
}

export function NodeRow({ node, isLast }: Props) {
  const hint = PIPELINE.find((p) => p.id === node.id)?.hint;
  const children = node.children ? Array.from(node.children.values()) : [];
  const hasChildren = children.length > 0;
  const [open, setOpen] = useState(true);

  const isRunning = node.status === "running";
  const isPending = node.status === "pending";

  // Keep duration counter ticking while running.
  const [, force] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => force((n) => n + 1), 250);
    return () => clearInterval(t);
  }, [isRunning]);

  return (
    <div className="relative">
      {/* Vertical connector line — runs from this node's dot down through children to next node */}
      {!isLast && (
        <div
          className="absolute left-[9px] top-[22px] bottom-[-12px] w-px"
          style={{
            background: isRunning || node.status === "done"
              ? "linear-gradient(to bottom, var(--color-hairline-strong) 0%, var(--color-hairline) 100%)"
              : "var(--color-hairline)",
          }}
        />
      )}

      <motion.div layout className="relative">
        <button
          type="button"
          onClick={() => hasChildren && setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-3 rounded-[10px] px-1.5 py-1.5 text-left transition-colors",
            hasChildren ? "cursor-pointer hover:bg-[var(--color-fill-4)]" : "cursor-default",
          )}
        >
          <span className="relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center">
            <StatusDot status={node.status} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "truncate text-[13px] font-medium tracking-[-0.005em]",
                  isPending ? "text-[var(--color-fg-tertiary)]" : "text-[var(--color-fg)]",
                )}
              >
                {node.label}
              </span>
              {hasChildren && (
                <span className="text-[10.5px] font-medium text-[var(--color-fg-tertiary)]">
                  {children.length}
                </span>
              )}
            </div>
            {hint && (
              <div className="truncate text-[11px] text-[var(--color-fg-tertiary)]">{hint}</div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1 pl-1 text-[11px] tabular-nums text-[var(--color-fg-tertiary)]">
            {(node.status === "done" || isRunning || node.status === "error") && (
              <span className={cn(isRunning && "text-[var(--color-blue)]")}>
                {formatDuration(duration(node))}
              </span>
            )}
            {hasChildren && (
              <ChevronRight
                size={12}
                className={cn(
                  "transition-transform duration-200 ease-out",
                  open && "rotate-90",
                )}
              />
            )}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {hasChildren && open && (
            <motion.div
              key="children"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="ml-[14px] mt-1 space-y-0.5 border-l border-[var(--color-hairline)] pl-3">
                {children.map((c, idx) => {
                  const cat = c.output?.category && CATEGORY_PILL[c.output.category];
                  return (
                    <motion.div
                      key={c.key}
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: idx * 0.04, ease: [0.32, 0.72, 0, 1] }}
                      className="group flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-[var(--color-fill-4)]"
                    >
                      <StatusDot status={c.status} size="sm" />
                      <span
                        className="min-w-0 flex-1 truncate font-mono text-[11px] text-[var(--color-fg-secondary)]"
                        title={c.filename}
                      >
                        {c.filename}
                      </span>
                      {c.attempt > 1 && (
                        <span
                          className="rounded-full px-1.5 py-px text-[9.5px] font-medium"
                          style={{ background: "rgba(255, 149, 0, 0.14)", color: "#c66a00" }}
                        >
                          attempt {c.attempt}
                        </span>
                      )}
                      {cat && (
                        <span
                          className="rounded-full px-1.5 py-px text-[9.5px] font-medium"
                          style={{ background: cat.bg, color: cat.fg }}
                        >
                          {cat.label}
                        </span>
                      )}
                      {c.output?.student_name && (
                        <span className="text-[10.5px] font-medium text-[var(--color-fg-secondary)]">
                          {c.output.student_name}
                        </span>
                      )}
                      <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-[var(--color-fg-tertiary)]">
                        {formatDuration(duration(c))}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
