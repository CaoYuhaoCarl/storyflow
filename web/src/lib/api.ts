import type { InputFile, ReportMeta } from "./types";

async function json<T>(r: Response): Promise<T> {
  if (!r.ok) {
    let detail = r.statusText;
    try { detail = (await r.json()).detail ?? detail; } catch {}
    throw new Error(`${r.status} ${detail}`);
  }
  return r.json();
}

export async function listInputs(): Promise<InputFile[]> {
  return json(await fetch("/api/inputs"));
}

export async function deleteInput(name: string): Promise<void> {
  const r = await fetch(`/api/inputs/${encodeURIComponent(name)}`, { method: "DELETE" });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
}

export async function uploadInput(file: File): Promise<InputFile> {
  const fd = new FormData();
  fd.append("file", file, file.name);
  return json(await fetch("/api/uploads", { method: "POST", body: fd }));
}

export async function listReports(): Promise<ReportMeta[]> {
  return json(await fetch("/api/reports"));
}

export async function getReport(name: string): Promise<string> {
  const r = await fetch(`/api/reports/${encodeURIComponent(name)}`);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.text();
}
