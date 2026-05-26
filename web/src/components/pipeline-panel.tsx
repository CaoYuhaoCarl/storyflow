import { PIPELINE } from "../lib/pipeline-map";
import type { RunState } from "../lib/types";
import { formatDuration } from "../lib/utils";
import { NodeRow } from "./node-row";

export function PipelinePanel({ run }: { run: RunState }) {
  const total =
    run.startedAt && (run.finishedAt ?? (run.phase === "running" ? Date.now() : run.startedAt))
      ? (run.finishedAt ?? Date.now()) - run.startedAt
      : undefined;
  const doneCount = Object.values(run.nodes).filter((n) => n.status === "done").length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between px-1.5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--color-fg-tertiary)]">
          Pipeline
        </div>
        <div className="text-[10.5px] tabular-nums text-[var(--color-fg-tertiary)]">
          {doneCount}/{PIPELINE.length}
          {total !== undefined && <span> · {formatDuration(total)}</span>}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {PIPELINE.map((p, i) => (
          <NodeRow key={p.id} node={run.nodes[p.id]} isLast={i === PIPELINE.length - 1} />
        ))}
      </div>
    </div>
  );
}
