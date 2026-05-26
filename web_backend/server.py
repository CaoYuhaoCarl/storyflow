"""FastAPI sidecar: file uploads + report listing for the english_coach UI."""
from __future__ import annotations

import re
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse

from english_coach.agent import (
    MIME_BY_SUFFIX,
    REPORTS_DIR,
    WRITING_INPUTS_DIR,
)

SAFE_NAME = re.compile(r"^[A-Za-z0-9._-]+$")

app = FastAPI(title="english_coach web sidecar")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def _safe(name: str) -> str:
  if "/" in name or ".." in name or not SAFE_NAME.match(name):
    raise HTTPException(400, "invalid filename")
  return name


def _stat(path: Path) -> dict:
  st = path.stat()
  return {
      "filename": path.name,
      "size": st.st_size,
      "mtime": int(st.st_mtime),
  }


@app.get("/api/health")
def health() -> dict:
  return {"ok": True}


@app.post("/api/uploads")
async def upload(file: UploadFile = File(...)) -> dict:
  suffix = Path(file.filename or "").suffix.lower()
  if suffix not in MIME_BY_SUFFIX:
    raise HTTPException(400, f"unsupported suffix {suffix!r}")
  name = _safe(Path(file.filename).name)
  WRITING_INPUTS_DIR.mkdir(parents=True, exist_ok=True)
  dest = WRITING_INPUTS_DIR / name
  dest.write_bytes(await file.read())
  return {**_stat(dest), "mime": MIME_BY_SUFFIX[suffix]}


@app.get("/api/inputs")
def list_inputs() -> list[dict]:
  if not WRITING_INPUTS_DIR.exists():
    return []
  out = []
  for p in sorted(WRITING_INPUTS_DIR.iterdir(), key=lambda x: x.name):
    if p.suffix.lower() in MIME_BY_SUFFIX:
      out.append({**_stat(p), "mime": MIME_BY_SUFFIX[p.suffix.lower()]})
  return out


@app.delete("/api/inputs/{name}", status_code=204)
def delete_input(name: str) -> None:
  target = WRITING_INPUTS_DIR / _safe(name)
  if not target.exists() or target.parent != WRITING_INPUTS_DIR:
    raise HTTPException(404, "not found")
  target.unlink()


def _frontmatter(text: str) -> dict:
  if not text.startswith("---\n"):
    return {}
  end = text.find("\n---\n", 4)
  if end == -1:
    return {}
  out: dict = {}
  for line in text[4:end].splitlines():
    if ":" in line:
      k, _, v = line.partition(":")
      out[k.strip()] = v.strip().strip('"').strip("'")
  return out


@app.get("/api/reports")
def list_reports() -> list[dict]:
  if not REPORTS_DIR.exists():
    return []
  items = []
  for p in REPORTS_DIR.glob("*.md"):
    meta = _frontmatter(p.read_text(encoding="utf-8", errors="ignore"))
    items.append({
        **_stat(p),
        "student": meta.get("student") or p.stem,
        "feedback_language": meta.get("feedback_language", ""),
        "generated_at": meta.get("generated_at", ""),
        "submission_count": int(meta.get("submission_count", "0") or 0),
    })
  items.sort(key=lambda x: x["mtime"], reverse=True)
  return items


@app.get("/api/reports/{name}", response_class=PlainTextResponse)
def get_report(name: str) -> str:
  target = REPORTS_DIR / _safe(name)
  if not target.exists() or target.suffix != ".md":
    raise HTTPException(404, "not found")
  return target.read_text(encoding="utf-8")
