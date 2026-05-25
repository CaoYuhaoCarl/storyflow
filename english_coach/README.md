# english-coach

ADK v2 workflow for English coaching feedback. Drop `.jpg`, `.jpeg`, `.png`,
`.webp`, `.heic`, or `.heif` files into `./input/`. The workflow classifies
each screenshot as writing feedback, grammar training, or unsupported, then
routes it to the matching structured extractor. It writes per-student Markdown
reports to `./reports/` and machine-readable personalized training inputs to
`./training_inputs/`.

Usage: from the *parent* directory of this folder, run `adk web` and pick
`english_coach` in the app dropdown. (`adk web` discovers apps as subdirectories
of the cwd, and the directory name must be a valid Python identifier — that's
why it's `english_coach`, not `english-coach`.)
