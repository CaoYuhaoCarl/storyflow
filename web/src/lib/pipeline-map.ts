export const PIPELINE = [
  { id: "list_writing_inputs",    label: "Scan inputs",         hint: "Discover images in input/" },
  { id: "orchestrate",            label: "Dispatch & classify", hint: "Per-image parallel coaching" },
  { id: "build_student_profiles", label: "Build profiles",      hint: "Merge by student" },
  { id: "write_report",           label: "Write report",        hint: "Render Markdown & JSON" },
] as const;

export type PipelineId = typeof PIPELINE[number]["id"];

export const PIPELINE_IDS = PIPELINE.map((p) => p.id) as PipelineId[];

export const INTERNAL_AGENTS = new Set([
  "classify_input_image",
  "extractor",
  "grammar_training_extractor",
]);

/** Strip "@N" suffix → bare node name. */
export function stripVersion(seg: string): string {
  const at = seg.indexOf("@");
  return at === -1 ? seg : seg.slice(0, at);
}

/** Get last segment of nodeInfo.path, stripped of version. */
export function nodeIdFromPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  const last = path.split("/").pop();
  if (!last) return undefined;
  return stripVersion(last);
}

/** Returns the pipeline node this event is under (one of PIPELINE_IDS), or undefined. */
export function rootNodeOf(path: string | undefined): PipelineId | undefined {
  if (!path) return undefined;
  for (const seg of path.split("/")) {
    const name = stripVersion(seg) as PipelineId;
    if ((PIPELINE_IDS as readonly string[]).includes(name)) return name;
  }
  return undefined;
}
