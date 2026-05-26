import { useCallback, useReducer, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createSession, runSSE } from "../lib/adk-client";
import {
  INTERNAL_AGENTS,
  PIPELINE,
  PIPELINE_IDS,
  nodeIdFromPath,
  rootNodeOf,
  stripVersion,
} from "../lib/pipeline-map";
import type {
  AdkEvent,
  ChildState,
  FeedbackLanguage,
  NodeState,
  ProcessOneInputOutput,
  RunState,
} from "../lib/types";
import { basename } from "../lib/utils";

function initialNodes(): Record<string, NodeState> {
  const out: Record<string, NodeState> = {};
  for (const p of PIPELINE) {
    out[p.id] = {
      id: p.id,
      label: p.label,
      status: "pending",
      children: p.id === "orchestrate" ? new Map() : undefined,
    };
  }
  return out;
}

function initialState(): RunState {
  return {
    phase: "idle",
    nodes: initialNodes(),
    events: [],
    newReportFiles: [],
  };
}

type Action =
  | { type: "reset" }
  | { type: "start"; sessionId: string }
  | { type: "event"; e: AdkEvent }
  | { type: "done" }
  | { type: "error"; message: string };

function ordinal(id: string): number {
  const i = PIPELINE_IDS.indexOf(id as (typeof PIPELINE_IDS)[number]);
  return i === -1 ? Infinity : i;
}

/** When the run terminates, clamp any still-running nodes/children so the UI stops pulsing. */
function settle(nodes: Record<string, NodeState>, t: number): Record<string, NodeState> {
  const out: Record<string, NodeState> = {};
  for (const [k, n] of Object.entries(nodes)) {
    let children = n.children;
    if (children) {
      const next = new Map(children);
      for (const [ck, c] of children) {
        if (c.status === "running") {
          next.set(ck, { ...c, status: "done", finishedAt: c.finishedAt ?? t });
        }
      }
      children = next;
    }
    if (n.status === "running") {
      out[k] = { ...n, status: "done", finishedAt: n.finishedAt ?? t, children };
    } else {
      out[k] = children !== n.children ? { ...n, children } : n;
    }
  }
  return out;
}

function reducer(s: RunState, a: Action): RunState {
  switch (a.type) {
    case "reset":
      return initialState();

    case "start":
      return {
        ...initialState(),
        phase: "running",
        sessionId: a.sessionId,
        startedAt: Date.now(),
      };

    case "done":
      return { ...s, phase: "done", finishedAt: Date.now(), nodes: settle(s.nodes, Date.now()) };

    case "error":
      return { ...s, phase: "error", error: a.message, finishedAt: Date.now(), nodes: settle(s.nodes, Date.now()) };

    case "event": {
      const e = a.e;
      // Always keep raw events for the Events tab (but skip super-chatty partial LLM tokens).
      const events = e.partial ? s.events : [...s.events, e];

      const path = e.nodeInfo?.path;
      const rootId = rootNodeOf(path);
      const lastSeg = nodeIdFromPath(path);

      // Internal LLM agents → don't mutate pipeline state, just keep the event row.
      if (lastSeg && INTERNAL_AGENTS.has(lastSeg)) return { ...s, events };
      if (!rootId) return { ...s, events };

      const now = Date.now();
      const isTerminal =
        Array.isArray(e.nodeInfo?.outputFor) &&
        path !== undefined &&
        e.nodeInfo!.outputFor!.includes(path);

      const nodes = { ...s.nodes };
      let newReportFiles = s.newReportFiles;
      let phase = s.phase;

      // Implicit "close prior nodes" rule: any later pipeline node firing closes earlier ones.
      const rootOrd = ordinal(rootId);
      for (const pid of PIPELINE_IDS) {
        if (ordinal(pid) < rootOrd && nodes[pid].status !== "done" && nodes[pid].status !== "error") {
          nodes[pid] = {
            ...nodes[pid],
            status: "done",
            finishedAt: nodes[pid].finishedAt ?? now,
          };
        }
      }

      // Handle the root pipeline node touched by this event.
      const root = nodes[rootId];
      const updated: NodeState = { ...root };
      if (updated.status === "pending") {
        updated.status = "running";
        updated.startedAt = now;
      }

      // Carry message text (last non-empty wins for the pipeline row).
      const text = e.content?.parts?.map((p) => p.text).filter(Boolean).join("\n");
      if (text && lastSeg === rootId) updated.message = text;

      // Per-child handling for `orchestrate` → process_one_input branches.
      if (rootId === "orchestrate" && lastSeg === "process_one_input") {
        const branch = e.branch ?? `process_one_input@?`;
        const key = stripVersion(branch.split(".")[0]) + ":" + branch;
        const children = new Map(updated.children ?? new Map());
        const prev = children.get(key);
        const child: ChildState = prev ?? {
          key,
          filename: "(pending)",
          status: "pending",
          attempt: 1,
        };

        if (text) {
          const m = text.match(/Processing (.+?) \(attempt (\d+)\)/);
          if (m) {
            child.filename = m[1];
            child.attempt = Number(m[2]);
          }
          child.message = text;
        }
        if (child.status === "pending") {
          child.status = "running";
          child.startedAt = child.startedAt ?? now;
        }
        if (isTerminal && e.output !== undefined) {
          child.output = e.output as ProcessOneInputOutput;
          if (child.output.filename) child.filename = child.output.filename;
          child.status = "done";
          child.finishedAt = now;
        }
        children.set(key, child);
        updated.children = children;
      }

      // Terminal for the pipeline node itself.
      if (isTerminal && lastSeg === rootId) {
        updated.status = "done";
        updated.finishedAt = now;
        if (e.output !== undefined) updated.output = e.output;

        // write_report final event message contains the list of generated files.
        if (rootId === "write_report" && text) {
          const re = /^- (.+\.md)$/gm;
          const files: string[] = [];
          let m: RegExpExecArray | null;
          while ((m = re.exec(text)) !== null) files.push(basename(m[1]));
          if (files.length > 0) newReportFiles = files;
        }
      }

      nodes[rootId] = updated;
      return { ...s, events, nodes, newReportFiles, phase };
    }
  }
}

export function useRun() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const qc = useQueryClient();

  const start = useCallback(
    async (language: FeedbackLanguage) => {
      if (state.phase === "running") return;
      dispatch({ type: "reset" });
      try {
        const sessionId = await createSession();
        dispatch({ type: "start", sessionId });
        const ac = new AbortController();
        abortRef.current = ac;
        await runSSE({
          sessionId,
          language,
          onEvent: (e) => dispatch({ type: "event", e }),
          onError: (err) => {
            dispatch({ type: "error", message: err.message });
            toast.error(err.message);
          },
          onDone: () => {
            dispatch({ type: "done" });
            qc.invalidateQueries({ queryKey: ["reports"] });
          },
          signal: ac.signal,
        });
      } catch (err) {
        const msg = (err as Error).message;
        dispatch({ type: "error", message: msg });
        toast.error(msg);
      }
    },
    [qc, state.phase],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    dispatch({ type: "done" });
  }, []);

  const reset = useCallback(() => {
    cancel();
    dispatch({ type: "reset" });
  }, [cancel]);

  return { state, start, cancel, reset };
}
