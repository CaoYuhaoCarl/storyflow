import { ArrowUpFromLine, Loader2, Play, RotateCcw, Square } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { deleteInput, uploadInput } from "../lib/api";
import type { FeedbackLanguage, RunState } from "../lib/types";
import { cn } from "../lib/utils";
import { ImageThumb } from "./image-thumb";
import { useInputs } from "../hooks/useReports";

const LANGS: { id: FeedbackLanguage; label: string }[] = [
  { id: "zh-Hans", label: "中文" },
  { id: "en", label: "EN" },
  { id: "ja", label: "日本語" },
  { id: "ko", label: "한국어" },
];

const ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "image/heic": [".heic"],
  "image/heif": [".heif"],
};

interface Props {
  run: RunState;
  onStart: (lang: FeedbackLanguage) => void;
  onCancel: () => void;
  onReset: () => void;
}

export function RunControl({ run, onStart, onCancel, onReset }: Props) {
  const [lang, setLang] = useState<FeedbackLanguage>("zh-Hans");
  const [uploading, setUploading] = useState(false);
  const qc = useQueryClient();
  const { data: inputs = [] } = useInputs();

  const onDrop = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setUploading(true);
      try {
        for (const f of files) await uploadInput(f);
        toast.success(`Uploaded ${files.length} file${files.length > 1 ? "s" : ""}`);
        qc.invalidateQueries({ queryKey: ["inputs"] });
      } catch (e) {
        toast.error((e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [qc],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    multiple: true,
    noClick: false,
  });

  const handleRemove = async (name: string) => {
    try {
      await deleteInput(name);
      qc.invalidateQueries({ queryKey: ["inputs"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const isRunning = run.phase === "running";
  const canRun = inputs.length > 0 && !isRunning && !uploading;

  return (
    <div className="flex flex-col gap-3">
      {/* Section heading */}
      <div className="flex items-baseline justify-between px-1.5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--color-fg-tertiary)]">
          Inputs
        </div>
        {inputs.length > 0 && (
          <div className="text-[10.5px] tabular-nums text-[var(--color-fg-tertiary)]">
            {inputs.length} file{inputs.length > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* AirDrop-style drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[14px] py-6 text-center transition-all",
          isDragActive
            ? "scale-[1.01]"
            : "hover:bg-[var(--color-fill-4)]",
        )}
        style={{
          background: isDragActive
            ? "rgba(0, 122, 255, 0.08)"
            : "var(--color-surface)",
          boxShadow: isDragActive
            ? "inset 0 0 0 1.5px var(--color-blue), var(--shadow-card)"
            : "inset 0 0 0 0.5px var(--color-hairline), var(--shadow-card)",
        }}
      >
        <input {...getInputProps()} />
        <div
          className="mb-1.5 flex h-9 w-9 items-center justify-center rounded-full transition-transform"
          style={{
            background: isDragActive
              ? "rgba(0, 122, 255, 0.16)"
              : "var(--color-fill-4)",
            color: isDragActive ? "var(--color-blue)" : "var(--color-fg-secondary)",
          }}
        >
          <ArrowUpFromLine size={16} strokeWidth={2} />
        </div>
        <div className="text-[12.5px] font-medium tracking-[-0.005em] text-[var(--color-fg)]">
          {isDragActive ? "Release to upload" : "Drop screenshots here"}
        </div>
        <div className="mt-0.5 text-[10.5px] text-[var(--color-fg-tertiary)]">
          PNG · JPG · WEBP · HEIC
        </div>
      </div>

      {/* Input list */}
      {inputs.length > 0 && (
        <div className="flex flex-col">
          {inputs.map((f) => (
            <ImageThumb
              key={f.filename}
              filename={f.filename}
              size={f.size}
              mime={f.mime}
              onRemove={isRunning ? undefined : () => handleRemove(f.filename)}
            />
          ))}
        </div>
      )}

      {/* Action bar: segmented language + primary button */}
      <div className="flex items-center gap-2">
        {/* iOS-style segmented control */}
        <div
          className="flex items-center rounded-[8px] p-[2px]"
          style={{ background: "var(--color-fill-3)" }}
        >
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              disabled={isRunning}
              onClick={() => setLang(l.id)}
              className={cn(
                "rounded-[6px] px-2 py-[3px] text-[11px] font-medium transition",
                lang === l.id
                  ? "text-[var(--color-fg)]"
                  : "text-[var(--color-fg-secondary)] hover:text-[var(--color-fg)]",
                isRunning && "cursor-not-allowed opacity-50",
              )}
              style={
                lang === l.id
                  ? {
                      background: "var(--color-surface)",
                      boxShadow: "0 0.5px 1.5px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)",
                    }
                  : undefined
              }
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {(run.phase === "done" || run.phase === "error") && (
            <button
              type="button"
              onClick={onReset}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors"
              style={{ background: "var(--color-fill-3)", color: "var(--color-fg-secondary)" }}
              aria-label="Reset"
              title="Reset"
            >
              <RotateCcw size={12} />
            </button>
          )}
          {isRunning ? (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-[8px] px-3 py-[6px] text-[12px] font-medium text-white transition active:scale-[0.98]"
              style={{
                background: "var(--color-red)",
                boxShadow: "inset 0 -0.5px 0 rgba(0,0,0,0.08), 0 0.5px 1.5px rgba(255,59,48,0.4)",
              }}
            >
              <Square size={10} fill="currentColor" /> Stop
            </button>
          ) : (
            <button
              type="button"
              disabled={!canRun}
              onClick={() => onStart(lang)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[8px] px-3 py-[6px] text-[12px] font-semibold transition-all active:scale-[0.98]",
                !canRun && "cursor-not-allowed opacity-40",
              )}
              style={
                canRun
                  ? {
                      background:
                        "linear-gradient(180deg, var(--color-blue-2) 0%, var(--color-blue) 100%)",
                      color: "#fff",
                      boxShadow:
                        "inset 0 0.5px 0 rgba(255,255,255,0.2), inset 0 -0.5px 0 rgba(0,0,0,0.15), 0 1px 2px rgba(0, 122, 255, 0.35)",
                    }
                  : {
                      background: "var(--color-fill-3)",
                      color: "var(--color-fg-tertiary)",
                    }
              }
            >
              {uploading ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Play size={10} fill="currentColor" />
              )}
              {uploading ? "Uploading" : "Run"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
