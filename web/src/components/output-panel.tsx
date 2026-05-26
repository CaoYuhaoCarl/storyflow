import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useReports } from "../hooks/useReports";
import type { RunState } from "../lib/types";
import { cn } from "../lib/utils";
import { EventStream } from "./event-stream";
import { ReportList } from "./report-list";
import { ReportViewer } from "./report-viewer";

type Tab = "events" | "reports";

export function OutputPanel({ run }: { run: RunState }) {
  const [tab, setTab] = useState<Tab>("events");
  const { data: reports = [] } = useReports();
  const [selected, setSelected] = useState<string | undefined>();
  const highlight = useMemo(() => new Set(run.newReportFiles), [run.newReportFiles]);

  useEffect(() => {
    if (run.phase !== "done" || run.newReportFiles.length === 0) return;
    setTab("reports");
    setSelected(run.newReportFiles[0]);
  }, [run.phase, run.newReportFiles]);

  useEffect(() => {
    if (tab === "reports" && !selected && reports.length > 0) {
      setSelected(reports[0].filename);
    }
  }, [tab, selected, reports]);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-[var(--radius-panel)] bg-[var(--color-surface)]"
      style={{ boxShadow: "var(--shadow-card)", border: "0.5px solid var(--color-hairline)" }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2.5"
        style={{ borderBottom: "0.5px solid var(--color-hairline)" }}
      >
        {/* iOS-style segmented control */}
        <div
          className="flex items-center rounded-[8px] p-[2px]"
          style={{ background: "var(--color-fill-3)" }}
        >
          <SegmentButton active={tab === "events"} onClick={() => setTab("events")}>
            Live Events
          </SegmentButton>
          <SegmentButton active={tab === "reports"} onClick={() => setTab("reports")}>
            Reports
            {reports.length > 0 && (
              <span
                className={cn(
                  "ml-1 rounded-full px-1.5 text-[9.5px] font-medium tabular-nums transition-colors",
                  tab === "reports"
                    ? "bg-[var(--color-fill-3)] text-[var(--color-fg-secondary)]"
                    : "bg-[var(--color-fill-2)] text-[var(--color-fg-secondary)]",
                )}
              >
                {reports.length}
              </span>
            )}
          </SegmentButton>
        </div>

        {run.phase === "running" && (
          <div
            className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium"
            style={{ background: "rgba(0, 122, 255, 0.10)", color: "var(--color-blue)" }}
          >
            <span
              className="inline-block h-[5px] w-[5px] rounded-full apple-pulse"
              style={{ background: "var(--color-blue-2)" }}
            />
            Running
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          className="min-h-0 flex-1"
        >
          {tab === "events" ? (
            <EventStream events={run.events} />
          ) : (
            <div className="grid h-full grid-cols-[260px_1fr]">
              <div style={{ borderRight: "0.5px solid var(--color-hairline)" }}>
                <ReportList
                  reports={reports}
                  selected={selected}
                  onSelect={setSelected}
                  highlight={highlight}
                />
              </div>
              <ReportViewer filename={selected} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-[6px] px-2.5 py-[3px] text-[11.5px] font-medium transition",
        active ? "text-[var(--color-fg)]" : "text-[var(--color-fg-secondary)] hover:text-[var(--color-fg)]",
      )}
      style={
        active
          ? {
              background: "var(--color-surface)",
              boxShadow: "0 0.5px 1.5px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)",
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}
