import { FileImage, X } from "lucide-react";
import { useEffect, useState } from "react";

import { formatBytes } from "../lib/utils";

const HEIC_MIMES = new Set(["image/heic", "image/heif"]);

interface Props {
  filename: string;
  size: number;
  mime: string;
  file?: File;
  onRemove?: () => void;
}

export function ImageThumb({ filename, size, mime, file, onRemove }: Props) {
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!file || HEIC_MIMES.has(mime)) return;
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file, mime]);

  return (
    <div
      className="group flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 transition-colors hover:bg-[var(--color-fill-4)]"
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md"
        style={{ background: "var(--color-fill-3)" }}
      >
        {url ? (
          <img src={url} alt={filename} className="h-full w-full object-cover" />
        ) : (
          <FileImage size={13} className="text-[var(--color-fg-tertiary)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[12px] font-medium text-[var(--color-fg)]"
          title={filename}
        >
          {filename}
        </div>
        <div className="text-[10.5px] text-[var(--color-fg-tertiary)]">
          {mime.replace("image/", "").toUpperCase()} · {formatBytes(size)}
        </div>
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="flex h-5 w-5 items-center justify-center rounded-full opacity-0 transition group-hover:opacity-100"
          style={{ background: "var(--color-fill-2)", color: "var(--color-fg-secondary)" }}
          aria-label="Remove"
          onMouseEnter={(e) => {
            const t = e.currentTarget as HTMLButtonElement;
            t.style.background = "var(--color-red)";
            t.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            const t = e.currentTarget as HTMLButtonElement;
            t.style.background = "var(--color-fill-2)";
            t.style.color = "var(--color-fg-secondary)";
          }}
        >
          <X size={11} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
