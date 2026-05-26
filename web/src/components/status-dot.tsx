import { Check, X } from "lucide-react";
import type { NodeStatus } from "../lib/types";
import { cn } from "../lib/utils";

interface Props {
  status: NodeStatus;
  size?: "sm" | "md";
}

/** Apple-style status indicator: filled symbols, pulsing ring on running. */
export function StatusDot({ status, size = "md" }: Props) {
  const px = size === "sm" ? 14 : 18;
  const iconPx = size === "sm" ? 8 : 11;

  if (status === "done") {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full text-white shadow-sm"
        style={{
          width: px,
          height: px,
          background: "var(--color-green)",
          boxShadow: "inset 0 -0.5px 0 rgba(0,0,0,0.08), 0 0.5px 1.5px rgba(52, 199, 89, 0.35)",
        }}
      >
        <Check size={iconPx} strokeWidth={3.5} />
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className="inline-flex items-center justify-center rounded-full text-white shadow-sm"
        style={{
          width: px,
          height: px,
          background: "var(--color-red)",
          boxShadow: "inset 0 -0.5px 0 rgba(0,0,0,0.08), 0 0.5px 1.5px rgba(255, 59, 48, 0.35)",
        }}
      >
        <X size={iconPx} strokeWidth={3.5} />
      </span>
    );
  }
  if (status === "running") {
    return (
      <span
        className={cn("relative inline-flex items-center justify-center rounded-full apple-pulse")}
        style={{
          width: px,
          height: px,
          background: "var(--color-blue-2)",
          boxShadow: "0 0.5px 1.5px rgba(10, 132, 255, 0.35)",
        }}
      >
        <span
          className="absolute inset-[3px] rounded-full"
          style={{ background: "rgba(255,255,255,0.95)" }}
        />
        <span
          className="absolute inset-[6px] rounded-full"
          style={{ background: "var(--color-blue-2)" }}
        />
      </span>
    );
  }
  // pending
  return (
    <span
      className="inline-flex rounded-full"
      style={{
        width: px,
        height: px,
        background: "transparent",
        boxShadow: "inset 0 0 0 1.5px var(--color-fg-quaternary)",
      }}
    />
  );
}
