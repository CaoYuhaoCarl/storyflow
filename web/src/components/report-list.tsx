import { FileText } from "lucide-react";

import type { ReportMeta } from "../lib/types";
import { cn, formatBytes } from "../lib/utils";

interface Props {
  reports: ReportMeta[];
  selected?: string;
  onSelect: (filename: string) => void;
  highlight?: Set<string>;
}

const LANG_LABEL: Record<string, string> = {
  "zh-Hans": "中文",
  en: "English",
  ja: "日本語",
  ko: "한국어",
};

function relTime(seconds: number): string {
  const diff = Date.now() / 1000 - seconds;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(seconds * 1000).toLocaleDateString();
}

export function ReportList({ reports, selected, onSelect, highlight }: Props) {
  if (reports.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-8 text-center">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "var(--color-fill-4)" }}
        >
          <FileText size={16} className="text-[var(--color-fg-tertiary)]" />
        </div>
        <div className="mt-2.5 text-[12.5px] font-medium text-[var(--color-fg-secondary)]">
          No reports yet
        </div>
        <div className="mt-0.5 text-[11.5px] text-[var(--color-fg-tertiary)]">
          Reports appear here after your first run.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-2">
      {reports.map((r) => {
        const isNew = highlight?.has(r.filename);
        const isActive = selected === r.filename;
        return (
          <button
            key={r.filename}
            type="button"
            onClick={() => onSelect(r.filename)}
            className={cn(
              "group mb-1 flex w-full flex-col gap-1 rounded-[10px] px-3 py-2.5 text-left transition-colors",
            )}
            style={
              isActive
                ? { background: "var(--color-blue-2)" }
                : undefined
            }
            onMouseEnter={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLButtonElement).style.background = "var(--color-fill-4)";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "truncate text-[13px] font-semibold tracking-[-0.005em]",
                  isActive ? "text-white" : "text-[var(--color-fg)]",
                )}
              >
                {r.student}
              </span>
              {isNew && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[9px] font-bold uppercase tracking-wider",
                    isActive ? "bg-white text-[var(--color-blue)]" : "bg-[var(--color-green)] text-white",
                  )}
                >
                  New
                </span>
              )}
              <span
                className={cn(
                  "ml-auto shrink-0 text-[10.5px] tabular-nums",
                  isActive ? "text-white/80" : "text-[var(--color-fg-tertiary)]",
                )}
              >
                {relTime(r.mtime)}
              </span>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 text-[11px]",
                isActive ? "text-white/85" : "text-[var(--color-fg-secondary)]",
              )}
            >
              <span>{LANG_LABEL[r.feedback_language] ?? r.feedback_language}</span>
              <span className={cn(isActive ? "text-white/50" : "text-[var(--color-fg-quaternary)]")}>·</span>
              <span>
                {r.submission_count} submission{r.submission_count === 1 ? "" : "s"}
              </span>
              <span className={cn(isActive ? "text-white/50" : "text-[var(--color-fg-quaternary)]")}>·</span>
              <span>{formatBytes(r.size)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
