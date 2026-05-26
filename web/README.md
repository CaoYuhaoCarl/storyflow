# LearnMate English Coach — Web UI

Real-time pipeline + report viewer for the `english_coach` ADK agent.

## Stack
Vite · React 19 · TypeScript · Tailwind CSS v4 · TanStack Query · framer-motion · react-markdown · sonner · lucide-react.

## Architecture
- **Frontend** (this dir, port `5173`)
- **`adk api_server`** (port `8010`) — native ADK FastAPI, streams events at `POST /run_sse`
- **`web_backend/server.py`** (port `8002`) — tiny FastAPI sidecar: image upload, input/report listing, markdown fetch

Vite proxies `/api/*` → `:8002` and `/adk/*` → `:8010`.

## Run

From the repo root:

```bash
make dev          # starts all three (ADK + sidecar + Vite) in one shell
# or, à la carte:
make backend      # ADK + sidecar
make frontend     # Vite only
```

Then open <http://localhost:5173/>.

## SSE → node mapping
Implemented in [`src/hooks/useRun.ts`](src/hooks/useRun.ts):

- The visible pipeline is exactly the 4 top-level nodes in [`src/lib/pipeline-map.ts`](src/lib/pipeline-map.ts).
- Node id comes from `event.nodeInfo.path` (last segment, `@N` suffix stripped).
- Completion is signaled by `event.nodeInfo.outputFor` containing the node's path.
- Parallel `process_one_input` children under `orchestrate` are keyed by `event.branch`. The filename and category badge come from `Processing X (attempt N)…` text and the terminal `output.{filename, category, student_name}`.
- LLM agents (`classify_input_image`, `extractor`, `grammar_training_extractor`) are filtered out of the pipeline view; their events still show in **Live Events**.
- `partial: true` token-streaming events are dropped from the events tab (too noisy).
- `write_report`'s final message lists generated `.md` files; the reducer extracts them, invalidates the Reports query, and the panel auto-switches to the new report.

## Folder map
```
web/
  src/
    App.tsx
    main.tsx
    index.css
    lib/
      adk-client.ts        # createSession + SSE via fetch+ReadableStream
      api.ts               # sidecar fetch wrappers
      pipeline-map.ts      # 4 visible nodes + helpers
      types.ts
      utils.ts
    hooks/
      useRun.ts            # reducer: SSE events → RunState
      useReports.ts        # TanStack Query for reports/inputs
    components/
      run-control.tsx      # dropzone, language picker, Run/Stop
      pipeline-panel.tsx
      node-row.tsx         # status dot + parallel children
      status-dot.tsx
      image-thumb.tsx
      output-panel.tsx     # Tabs: Events / Reports
      event-stream.tsx
      report-list.tsx
      report-viewer.tsx
```
